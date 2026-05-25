import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { XCircle, Search, AlertTriangle, CheckCircle, ExternalLink, Shield } from 'lucide-react'
import useMetaMask from '../hooks/useMetaMask'
import useRoleCheck from '../hooks/useRoleCheck'
import { getContract, getReadOnlyContract } from '../utils/blockchain'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'

const Revoke = () => {
  // ============ WALLET STATE ============
  const { isConnected, account, chainId, provider } = useMetaMask()
  const { isIssuer, isOwner, loading: roleLoading } = useRoleCheck(provider, account)

  // ============ FORM STATE ============
  const [certId, setCertId] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('input') // input | confirm | revoking | success | error
  const [certificateData, setCertificateData] = useState(null)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')

  const isSepolia = chainId === 11155111

  // ============ CHECK CERTIFICATE ============
  const handleCheckCertificate = async (e) => {
    e?.preventDefault()

    if (!certId.trim()) {
      setError('Certificate ID wajib diisi.')
      return
    }

    setLoading(true)
    setError('')
    setCertificateData(null)

    try {
      const contract = getReadOnlyContract()
      const certIdBytes32 = ethers.encodeBytes32String(certId)
      
      // Get certificate data
      const cert = await contract.getCertificate(certIdBytes32)
      
      // Check if issuer is the connected wallet
      if (cert.issuer.toLowerCase() !== account?.toLowerCase()) {
        setError('Anda bukan issuer yang menerbitkan sertifikat ini. Hanya issuer asli yang bisa merevoke.')
        toast.error('Bukan issuer asli sertifikat ini.')
        setLoading(false)
        return
      }

      // Check if already revoked
      if (!cert.isValid) {
        setError('Sertifikat ini sudah direvoke sebelumnya.')
        toast.error('Sertifikat sudah direvoke.')
        setLoading(false)
        return
      }

      setCertificateData({
        studentName: cert.studentName,
        courseName: cert.courseName,
        issueDate: Number(cert.issueDate),
        ipfsCID: cert.ipfsCID,
        issuer: cert.issuer,
      })
      setStep('confirm')
      toast.success('Sertifikat ditemukan. Konfirmasi untuk revoke.')
    } catch (err) {
      console.error('❌ Check certificate error:', err)
      if (err.message.includes('Sertifikat tidak ditemukan')) {
        setError('Sertifikat tidak ditemukan. Periksa Certificate ID.')
        toast.error('Sertifikat tidak ditemukan.')
      } else {
        setError('Gagal memuat data sertifikat.')
        toast.error('Gagal memuat data.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============ REVOKE CERTIFICATE ============
  const handleRevoke = async () => {
    setLoading(true)
    setStep('revoking')

    try {
      const contract = await getContract(provider)
      const certIdBytes32 = ethers.encodeBytes32String(certId)

      const tx = await contract.revokeCertificate(certIdBytes32)
      
      toast.promise(tx.wait(), {
        loading: 'Merevoke sertifikat...',
        success: 'Sertifikat berhasil direvoke!',
        error: 'Gagal merevoke sertifikat.',
      })

      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setStep('success')
      toast.success('Sertifikat berhasil direvoke! 🗑️')
    } catch (err) {
      console.error('❌ Revoke error:', err)
      setStep('confirm')
      
      if (err.message.includes('user rejected')) {
        toast.error('Transaksi dibatalkan.')
      } else if (err.message.includes('Hanya issuer asli')) {
        toast.error('Hanya issuer asli yang bisa merevoke.')
      } else if (err.message.includes('sudah direvoke')) {
        toast.error('Sertifikat sudah direvoke sebelumnya.')
      } else {
        toast.error('Gagal merevoke sertifikat.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============ RESET ============
  const handleReset = () => {
    setCertId('')
    setCertificateData(null)
    setTxHash('')
    setError('')
    setStep('input')
  }

  // ============ FORMAT DATE ============
  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // ============ FORMAT ADDRESS ============
  const formatAddress = (addr) => {
    if (!addr) return '-'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // ============ LOADING STATE ============
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // ============ ACCESS DENIED ============
  if (!isIssuer && !roleLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Akses Ditolak</h2>
          <p className="text-slate-400">
            Hanya issuer yang terdaftar yang bisa merevoke sertifikat.
          </p>
          {isConnected && (
            <p className="text-slate-500 text-sm mt-2">
              Wallet: {formatAddress(account)}
            </p>
          )}
        </Card>
      </div>
    )
  }

  // ============ SUCCESS STATE ============
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Sertifikat Berhasil Direvoke 🗑️
          </h2>
          <p className="text-slate-400 mb-6">
            Sertifikat <span className="text-slate-200 font-medium">{certId}</span> sudah tidak berlaku lagi.
          </p>

          {/* Detail */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Student</span>
              <span className="text-slate-200">{certificateData?.studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Course</span>
              <span className="text-slate-200">{certificateData?.courseName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Transaction</span>
              <span className="text-slate-200 font-mono text-xs truncate max-w-[200px]">
                {txHash?.slice(0, 20)}...
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <ExternalLink size={16} />
              Lihat di Etherscan
            </a>
            <Button variant="secondary" onClick={handleReset}>
              Revoke Sertifikat Lain
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ============ MAIN CONTENT ============
  return (
    <div className="max-w-2xl mx-auto mt-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Revoke Sertifikat</h1>
        <p className="text-slate-400 mt-1">
          Cabut/merekoke sertifikat yang sudah tidak berlaku
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-orange-400 font-medium text-sm">Perhatian!</p>
          <p className="text-orange-300/80 text-sm">
            Revoke bersifat permanen dan tidak bisa dibatalkan. Sertifikat yang sudah direvoke tidak bisa dikembalikan.
          </p>
        </div>
      </div>

      {/* Input Certificate ID */}
      {step === 'input' && (
        <Card>
          <form onSubmit={handleCheckCertificate}>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Certificate ID"
                  placeholder="Masukkan Certificate ID yang akan direvoke"
                  value={certId}
                  onChange={(e) => {
                    setCertId(e.target.value)
                    setError('')
                  }}
                  error={error}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                variant="danger"
                loading={loading}
                className="flex items-center gap-2"
              >
                <Search size={18} />
                Cari
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Konfirmasi Revoke */}
      {step === 'confirm' && certificateData && (
        <div className="space-y-4">
          {/* Certificate Info */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Detail Sertifikat yang Akan Direvoke
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Certificate ID</span>
                <span className="text-slate-200 font-mono text-sm">{certId}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Nama Mahasiswa</span>
                <span className="text-slate-200 font-medium">{certificateData.studentName}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Program Studi</span>
                <span className="text-slate-200">{certificateData.courseName}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Tanggal Terbit</span>
                <span className="text-slate-200">{formatDate(certificateData.issueDate)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Issuer</span>
                <span className="text-slate-200 font-mono text-sm">
                  {formatAddress(certificateData.issuer)}
                </span>
              </div>
            </div>
          </Card>

          {/* Confirmation */}
          <Card className="border-orange-800 bg-orange-900/10">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-orange-300 font-medium">Konfirmasi Revoke</p>
                <p className="text-orange-400/80 text-sm mt-1">
                  Apakah Anda yakin ingin merevoke sertifikat ini? Tindakan ini tidak dapat dibatalkan dan sertifikat akan ditandai sebagai tidak valid permanen di blockchain.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleRevoke}
                loading={loading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                Ya, Revoke Sertifikat
              </Button>
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Batal
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {step === 'input' && !loading && (
        <Card className="text-center py-10 mt-6">
          <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-1">
            Cari Sertifikat
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Masukkan Certificate ID di atas untuk mencari sertifikat yang ingin direvoke.
            Hanya issuer asli yang bisa merevoke sertifikat.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Revoke