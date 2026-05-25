import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Search, CheckCircle, XCircle, Copy, ExternalLink, Share2, FileText, User, BookOpen, Calendar, Wallet } from 'lucide-react'
import { getReadOnlyContract } from '../utils/blockchain'
import { getIPFSUrl, openPDFInNewTab } from '../utils/gateway'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

const Verify = () => {
  const { certId: urlCertId } = useParams()
  const navigate = useNavigate()

  const [certId, setCertId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [certificateDetail, setCertificateDetail] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Auto-verify jika ada certId di URL
  useEffect(() => {
    if (urlCertId) {
      setCertId(urlCertId)
      // Delay sebentar biar state ke-set
      setTimeout(() => {
        handleVerify(urlCertId)
      }, 300)
    }
  }, [urlCertId])

  const handleVerify = async (idFromUrl = null) => {
    const idToVerify = idFromUrl || certId

    if (!idToVerify.trim()) {
      setError('Certificate ID wajib diisi.')
      toast.error('Certificate ID wajib diisi.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setCertificateDetail(null)

    try {
      const contract = getReadOnlyContract()
      const certIdBytes = ethers.encodeBytes32String(idToVerify)

      // Verify certificate (view function - FREE)
      const verifyResult = await contract.verifyCertificate(certIdBytes)

      setResult({
        isValid: verifyResult.isValid,
        studentName: verifyResult.studentName,
        courseName: verifyResult.courseName,
        issueDate: Number(verifyResult.issueDate),
        issuer: verifyResult.issuer,
      })

      // Get full certificate detail (untuk IPFS CID)
      try {
        const detail = await contract.getCertificate(certIdBytes)
        setCertificateDetail({
          ipfsCID: detail.ipfsCID,
        })
      } catch (e) {
        console.warn('Gagal ambil detail:', e)
      }

      // Save to localStorage history
      const history = JSON.parse(localStorage.getItem('verificationHistory') || '[]')
      history.unshift({
        certId: idToVerify,
        studentName: verifyResult.studentName,
        timestamp: new Date().toISOString(),
        isValid: verifyResult.isValid,
      })
      localStorage.setItem('verificationHistory', JSON.stringify(history.slice(0, 20)))

      toast.success('Sertifikat ditemukan!')
    } catch (err) {
      console.error('❌ Verify error:', err)
      if (err.message && err.message.includes('Sertifikat tidak ditemukan')) {
        setError('Sertifikat tidak ditemukan. Periksa kembali Certificate ID.')
        toast.error('Sertifikat tidak ditemukan.')
      } else {
        setError('Gagal memverifikasi. Silakan coba lagi.')
        toast.error('Gagal memverifikasi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify/${certId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      toast.success('Link disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast.error('Gagal menyalin link.')
    })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const date = new Date(timestamp * 1000)
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const formatAddress = (addr) => {
    if (!addr) return '-'
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  const handleClear = () => {
    setCertId('')
    setResult(null)
    setCertificateDetail(null)
    setError('')
    navigate('/verify')
  }

  return (
    <div className="max-w-2xl mx-auto mt-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Verifikasi Sertifikat</h1>
        <p className="text-slate-400 mt-1">
          Verifikasi keaslian sertifikat digital — gratis, tanpa gas fee
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleVerify()
          }}
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Certificate ID"
                placeholder="Masukkan Certificate ID (contoh: CERT-001)"
                value={certId}
                onChange={(e) => {
                  setCertId(e.target.value)
                  setError('')
                  setResult(null)
                }}
                error={error}
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              <Search size={18} className="inline mr-1" />
              Verify
            </Button>
          </div>
        </form>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memverifikasi sertifikat...</p>
        </Card>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="text-center py-10">
          <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-1">Sertifikat Tidak Ditemukan</h3>
          <p className="text-slate-400 text-sm">{error}</p>
          <Button variant="ghost" className="mt-4" onClick={handleClear}>
            Coba lagi
          </Button>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            result.isValid
              ? 'bg-green-900/20 border border-green-800'
              : 'bg-red-900/20 border border-red-800'
          }`}>
            {result.isValid ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`font-semibold text-lg ${
                result.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.isValid ? '✓ Sertifikat Valid' : '✗ Sertifikat Telah Direvoke'}
              </p>
              <p className="text-slate-400 text-sm">
                {result.isValid
                  ? 'Sertifikat ini asli dan masih berlaku.'
                  : 'Sertifikat ini sudah tidak berlaku.'}
              </p>
            </div>
          </div>

          {/* Detail */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4">Detail Sertifikat</h3>
            <div className="space-y-3">
              {/* Student Name */}
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <User className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Nama Mahasiswa</p>
                  <p className="text-slate-100 font-medium">{result.studentName}</p>
                </div>
              </div>

              {/* Course Name */}
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <BookOpen className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Program Studi</p>
                  <p className="text-slate-100 font-medium">{result.courseName}</p>
                </div>
              </div>

              {/* Issue Date */}
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Tanggal Terbit</p>
                  <p className="text-slate-100 font-medium">{formatDate(result.issueDate)}</p>
                </div>
              </div>

              {/* Issuer */}
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <Wallet className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Diterbitkan Oleh</p>
                  <a
                    href={`https://sepolia.etherscan.io/address/${result.issuer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm transition-colors"
                  >
                    {formatAddress(result.issuer)}
                    <ExternalLink size={12} className="inline ml-1" />
                  </a>
                </div>
              </div>

              {/* IPFS Link */}
              {certificateDetail?.ipfsCID && (
                <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">File Sertifikat (IPFS)</p>
                    <button
                      onClick={() => openPDFInNewTab(certificateDetail.ipfsCID)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1"
                    >
                      Lihat / Download File
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
              <Button
                variant="secondary"
                onClick={handleShare}
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} className="inline mr-1 text-green-400" />
                    Link Disalin!
                  </>
                ) : (
                  <>
                    <Share2 size={16} className="inline mr-1" />
                    Share
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleClear}>
                Verifikasi Baru
              </Button>
            </div>
          </Card>

          {/* Share URL */}
          <p className="text-xs text-slate-600 text-center">
            Share link: {window.location.origin}/verify/{certId}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && !loading && (
        <Card className="text-center py-12">
          <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-1">Verifikasi Sertifikat</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Masukkan Certificate ID di atas untuk memverifikasi keaslian sertifikat digital.
            Verifikasi gratis dan tidak memerlukan gas fee.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Verify