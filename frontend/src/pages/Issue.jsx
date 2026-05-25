import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Upload, FileText, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import useMetaMask from '../hooks/useMetaMask'
import useRoleCheck from '../hooks/useRoleCheck'
import { getContract, getReadOnlyContract } from '../utils/blockchain'
import { uploadFileToBackend } from '../utils/ipfs'
import { getIPFSUrl } from '../utils/gateway'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

const Issue = () => {
  // ============ WALLET STATE ============
  const { isConnected, account, chainId, provider } = useMetaMask()
  const { isIssuer, isOwner, loading: roleLoading } = useRoleCheck(provider, account)

  // ============ FORM STATE ============
  const [certId, setCertId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [courseName, setCourseName] = useState('')
  const [file, setFile] = useState(null)

  // ============ UI STATE ============
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('idle') // idle | uploading | issuing | success
  const [txHash, setTxHash] = useState('')
  const [ipfsCid, setIpfsCid] = useState('')
  const [errors, setErrors] = useState({})

  const isSepolia = chainId === 11155111

  // ============ VALIDASI ============
  const validateForm = async () => {
    const newErrors = {}

    if (!certId.trim()) {
      newErrors.certId = 'Certificate ID wajib diisi.'
    } else if (certId.length < 3) {
      newErrors.certId = 'Certificate ID minimal 3 karakter.'
    } else {
      try {
        const contract = getReadOnlyContract()
        const exists = await contract.certificateExists(ethers.encodeBytes32String(certId))
        if (exists) {
          newErrors.certId = 'Certificate ID sudah digunakan. Gunakan ID lain.'
        }
      } catch (err) {
        console.warn('Gagal cek certificate exists:', err.message)
      }
    }

    if (!studentName.trim()) {
      newErrors.studentName = 'Nama mahasiswa wajib diisi.'
    }

    if (!courseName.trim()) {
      newErrors.courseName = 'Nama program studi wajib diisi.'
    }

    if (!file) {
      newErrors.file = 'File sertifikat wajib diupload.'
    } else {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
      if (!allowedTypes.includes(file.type)) {
        newErrors.file = 'Format file tidak didukung. Gunakan PDF, PNG, atau JPG.'
      }
      if (file.size > 5 * 1024 * 1024) {
        newErrors.file = 'Ukuran file maksimal 5MB.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============ ISSUE CERTIFICATE ============
  const handleIssue = async (e) => {
    e?.preventDefault()

    if (!isConnected) {
      toast.error('Silakan connect wallet terlebih dahulu.')
      return
    }

    if (!isSepolia) {
      toast.error('Harap ganti network ke Sepolia Testnet.')
      return
    }

    const isValid = await validateForm()
    if (!isValid) {
      toast.error('Mohon periksa kembali form yang diisi.')
      return
    }

    setLoading(true)

    try {
      // Step 1: Upload ke IPFS
      setStep('uploading')
      toast.loading('Mengupload file ke IPFS...', { id: 'upload' })

      const { cid } = await uploadFileToBackend(file, {
        studentName,
        courseName,
      })

      setIpfsCid(cid)
      toast.success('File berhasil diupload ke IPFS!', { id: 'upload' })

      // Step 2: Issue ke Blockchain
      setStep('issuing')
      toast.loading('Menunggu konfirmasi transaksi...', { id: 'issue' })

      const contract = await getContract(provider)
      const certIdBytes = ethers.encodeBytes32String(certId)
      const tx = await contract.issueCertificate(certIdBytes, studentName, courseName, cid)
      const receipt = await tx.wait()

      setTxHash(receipt.hash)
      setStep('success')
      toast.success('Sertifikat berhasil diterbitkan! 🎉', { id: 'issue' })

    } catch (err) {
      console.error('❌ Issue error:', err)
      setStep('idle')

      if (err.message.includes('user rejected')) {
        toast.error('Transaksi dibatalkan oleh user.')
      } else {
        toast.error(err.message || 'Gagal menerbitkan sertifikat.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============ RESET ============
  const resetForm = () => {
    setCertId('')
    setStudentName('')
    setCourseName('')
    setFile(null)
    setTxHash('')
    setIpfsCid('')
    setErrors({})
    setStep('idle')
  }

  // ============ FORMAT FILE SIZE ============
  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ============ LOADING ============
  if (roleLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
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
            Hanya issuer yang terdaftar yang bisa menerbitkan sertifikat.
          </p>
        </Card>
      </div>
    )
  }

  // ============ SUCCESS ============
  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Sertifikat Berhasil Diterbitkan! 🎉
          </h2>
          <p className="text-slate-400 mb-6">
            Sertifikat untuk <span className="text-slate-200 font-medium">{studentName}</span> telah tersimpan di blockchain.
          </p>

          {/* Detail */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Certificate ID</span>
              <span className="text-slate-200 font-mono">{certId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">IPFS CID</span>
              <span className="text-slate-200 font-mono text-xs truncate max-w-[180px]" title={ipfsCid}>
                {ipfsCid.slice(0, 20)}...
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Transaction</span>
              <span className="text-slate-200 font-mono text-xs truncate max-w-[180px]" title={txHash}>
                {txHash?.slice(0, 20)}...
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2 px-4 rounded-lg border border-slate-600 transition-all inline-flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Lihat di Etherscan
            </a>
            <a
              href={getIPFSUrl(ipfsCid)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium py-2 px-4 rounded-lg border border-slate-600 transition-all inline-flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Lihat di IPFS
            </a>
            <Button variant="primary" onClick={resetForm}>
              Issue Sertifikat Baru
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ============ FORM ============
  return (
    <div className="max-w-2xl mx-auto mt-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Issue Sertifikat</h1>
        <p className="text-slate-400 mt-1">
          Terbitkan sertifikat digital baru ke blockchain
        </p>
      </div>

      <Card>
        <form onSubmit={handleIssue} className="space-y-1">
          {/* Certificate ID */}
          <Input
            label="Certificate ID"
            placeholder="Contoh: CERT-2025-001"
            value={certId}
            onChange={(e) => {
              setCertId(e.target.value)
              setErrors(prev => ({ ...prev, certId: undefined }))
            }}
            error={errors.certId}
            disabled={loading}
          />

          {/* Student Name */}
          <Input
            label="Nama Mahasiswa"
            placeholder="Nama lengkap mahasiswa"
            value={studentName}
            onChange={(e) => {
              setStudentName(e.target.value)
              setErrors(prev => ({ ...prev, studentName: undefined }))
            }}
            error={errors.studentName}
            disabled={loading}
          />

          {/* Course Name */}
          <Input
            label="Program Studi"
            placeholder="Contoh: Teknik Informatika"
            value={courseName}
            onChange={(e) => {
              setCourseName(e.target.value)
              setErrors(prev => ({ ...prev, courseName: undefined }))
            }}
            error={errors.courseName}
            disabled={loading}
          />

          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1.5">
              File Sertifikat (PDF/PNG/JPG, max 5MB)
            </label>

            <label
              className={`
                flex flex-col items-center justify-center w-full h-32
                border-2 border-dashed rounded-lg cursor-pointer
                transition-all duration-200
                ${file
                  ? 'border-green-600 bg-green-900/10'
                  : errors.file
                    ? 'border-red-500 bg-red-900/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  setFile(e.target.files[0])
                  setErrors(prev => ({ ...prev, file: undefined }))
                }}
                disabled={loading}
              />

              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-green-400" />
                  <div className="text-left">
                    <p className="text-sm text-slate-200 font-medium truncate max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">Klik untuk upload file</p>
                </div>
              )}
            </label>
            {errors.file && (
              <p className="text-red-400 text-xs mt-1">{errors.file}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={!isConnected || !isSepolia}
          >
            {loading
              ? step === 'uploading'
                ? 'Mengupload ke IPFS...'
                : 'Menunggu Transaksi...'
              : 'Issue Certificate'
            }
          </Button>

          {/* Warnings */}
          {!isConnected && (
            <p className="text-yellow-400 text-xs text-center mt-2">
              ⚠️ Silakan connect wallet terlebih dahulu.
            </p>
          )}
          {isConnected && !isSepolia && (
            <p className="text-yellow-400 text-xs text-center mt-2">
              ⚠️ Harap ganti network ke Sepolia Testnet.
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}

export default Issue