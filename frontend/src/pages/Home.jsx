import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import { Award, TrendingUp, Clock, Shield, Search, FileText, ArrowRight } from 'lucide-react'
import useMetaMask from '../hooks/useMetaMask'
import useRoleCheck from '../hooks/useRoleCheck'
import { getReadOnlyContract } from '../utils/blockchain'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

const Home = () => {
  const { isConnected, account, provider } = useMetaMask()
  const { isIssuer, isOwner, loading: roleLoading } = useRoleCheck(provider, account)

  const [stats, setStats] = useState({
    totalCertificates: 0,
    recentCertificates: [],
    issuerCertificates: [],
    verificationHistory: [],
  })
  const [loading, setLoading] = useState(true)

  // Load data dari blockchain & localStorage
  useEffect(() => {
    loadDashboardData()
  }, [isConnected, account])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const contract = getReadOnlyContract()

      // Get total certificates
      const total = await contract.getTotalCertificates()

      // Get verification history from localStorage
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]')

      setStats({
        totalCertificates: Number(total),
        recentCertificates: [],
        issuerCertificates: [],
        verificationHistory: history.slice(0, 5),
      })
    } catch (err) {
      console.error('❌ Load dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatAddress = (addr) => {
    if (!addr) return '-'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-100 mb-3">
          CertiChain
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Platform verifikasi ijazah digital berbasis blockchain.
          Transparan, aman, dan terdesentralisasi.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {isIssuer || isOwner ? (
            <Link to="/issue">
              <Button variant="primary" className="flex items-center gap-2">
                <FileText size={18} />
                Issue Certificate
              </Button>
            </Link>
          ) : null}
          <Link to="/verify">
            <Button variant="secondary" className="flex items-center gap-2">
              <Search size={18} />
              Verify Certificate
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Sertifikat</p>
            <p className="text-2xl font-bold text-slate-100">
              {loading ? '-' : stats.totalCertificates}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Network</p>
            <p className="text-lg font-semibold text-green-400">Sepolia Testnet</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Role</p>
            <p className="text-lg font-semibold text-slate-100">
              {!isConnected ? 'Guest' : isOwner ? 'Admin' : isIssuer ? 'Issuer' : 'User'}
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Certificates */}
      <div>
        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-slate-400" />
          Sertifikat Terbaru
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : stats.recentCertificates.length > 0 ? (
          <div className="space-y-3">
            {stats.recentCertificates.map((cert, idx) => (
              <Card key={idx} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    cert.isValid ? 'bg-green-900/30' : 'bg-red-900/30'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      cert.isValid ? 'text-green-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">{cert.studentName}</p>
                    <p className="text-slate-400 text-sm">{cert.courseName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">{formatDate(cert.issueDate)}</p>
                  <Link
                    to={`/verify/${cert.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 justify-end mt-1"
                  >
                    Verify <ArrowRight size={14} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-slate-500">Belum ada sertifikat diterbitkan.</p>
          </Card>
        )}
      </div>

      {/* Issuer Section */}
      {isIssuer && stats.issuerCertificates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Sertifikat yang Anda Terbitkan
          </h2>
          <div className="space-y-2">
            {stats.issuerCertificates.map((cert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
              >
                <span className="text-slate-300">{cert.studentName}</span>
                <span className="text-slate-500 text-sm">{formatDate(cert.issueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification History */}
      {stats.verificationHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Riwayat Verifikasi Anda
          </h2>
          <div className="space-y-2">
            {stats.verificationHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
              >
                <span className="text-slate-300 font-mono text-sm">{item.certId}</span>
                <span className="text-slate-500 text-sm">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Home