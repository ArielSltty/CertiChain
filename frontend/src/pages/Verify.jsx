import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Search, CheckCircle, XCircle, Copy, ExternalLink, Share2, FileText, User, BookOpen, Calendar, Wallet } from 'lucide-react'
import { getReadOnlyContract } from '../utils/blockchain'
import { getIPFSUrl, openPDFInNewTab } from '../utils/gateway'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { useParams } from 'react-router-dom'

const Verify = () => {
  // ============ STATE ============
  const [certId, setCertId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // ============ VERIFY CERTIFICATE ============
  const handleVerify = async (e) => {
    e?.preventDefault()

    // Validasi input
    if (!certId.trim()) {
      setError('Certificate ID wajib diisi.')
      toast.error('Certificate ID wajib diisi.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const contract = getReadOnlyContract()
      const certIdBytes32 = ethers.encodeBytes32String(certId)

      // Panggil verifyCertificate (FREE - view function)
      const result = await contract.verifyCertificate(certIdBytes32)
      
      setResult({
        isValid: result.isValid,
        studentName: result.studentName,
        courseName: result.courseName,
        issueDate: Number(result.issueDate),
        issuer: result.issuer,
      })

      toast.success('Sertifikat ditemukan!')
    } catch (err) {
      console.error('❌ Verify error:', err)

      if (err.message.includes('Sertifikat tidak ditemukan')) {
        setResult(null)
        setError('Sertifikat tidak ditemukan. Periksa kembali Certificate ID.')
        toast.error('Sertifikat tidak ditemukan.')
      } else {
        setError('Gagal memverifikasi. Silakan coba lagi.')
        toast.error('Gagal memverifikasi sertifikat.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============ COPY SHARE LINK ============
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

  // ============ FORMAT DATE ============
  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ]
    const date = new Date(timestamp * 1000)
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // ============ FORMAT ADDRESS ============
  const formatAddress = (addr) => {
    if (!addr) return '-'
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  // ============ CLEAR ============
  const handleClear = () => {
    setCertId('')
    setResult(null)
    setError('')
  }
  const { certId: urlCertId } = useParams()

  // Auto-verify jika ada certId di URL
  useEffect(() => {
    if (urlCertId) {
      setCertId(urlCertId)
      // Auto verify setelah set certId
      setTimeout(() => {
        handleVerify()
      }, 100)
    }
  }, [urlCertId])

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
        <form onSubmit={handleVerify}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Certificate ID"
                placeholder="Masukkan Certificate ID (contoh: CERT-2025-001)"
                value={certId}
                onChange={(e) => {
                  setCertId(e.target.value)
                  setError('')
                  setResult(null)
                }}
                error={error}
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify(e)}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex items-center gap-2"
            >
              <Search size={18} />
              Verify
            </Button>
          </div>
        </form>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400">Memverifikasi sertifikat...</p>
            <p className="text-slate-500 text-sm">
              Mengecek di blockchain Sepolia
            </p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="text-center py-10">
          <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-1">
            Sertifikat Tidak Ditemukan
          </h3>
          <p className="text-slate-400 text-sm">
            Certificate ID "{certId}" tidak terdaftar di blockchain.
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={handleClear}
          >
            Coba lagi
          </Button>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              result.isValid
                ? 'bg-green-900/20 border border-green-800'
                : 'bg-red-900/20 border border-red-800'
            }`}
          >
            {result.isValid ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold text-lg ${
                  result.isValid ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.isValid ? '✓ Sertifikat Valid' : '✗ Sertifikat Telah Direvoke'}
              </p>
              <p className="text-slate-400 text-sm">
                {result.isValid
                  ? 'Sertifikat ini asli dan masih berlaku.'
                  : 'Sertifikat ini sudah tidak berlaku.'}
              </p>
            </div>
          </div>

          {/* Certificate Details */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4">
              Detail Sertifikat
            </h3>

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
                  <p className="text-slate-100 font-medium">
                    {formatDate(result.issueDate)}
                  </p>
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
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">File Sertifikat (IPFS)</p>
                  <button
                    onClick={() => {
                      // Ambil CID dari contract
                      getReadOnlyContract()
                        .getCertificate(ethers.encodeBytes32String(certId))
                        .then((data) => openPDFInNewTab(data.ipfsCID))
                        .catch(() => toast.error('Gagal membuka file.'))
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1"
                  >
                    Lihat / Download File
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
              <Button
                variant="secondary"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} className="text-green-400" />
                    Link Disalin!
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    Share
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                Verifikasi Baru
              </Button>
            </div>
          </Card>

          {/* Share URL Info */}
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
          <h3 className="text-lg font-medium text-slate-300 mb-1">
            Verifikasi Sertifikat
          </h3>
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