import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Shield, UserPlus, UserMinus, Users, Info, ExternalLink, Copy, CheckCircle } from 'lucide-react'
import useMetaMask from '../hooks/useMetaMask'
import useRoleCheck from '../hooks/useRoleCheck'
import { getContract, getContractAddress, getReadOnlyContract } from '../utils/blockchain'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'

const Admin = () => {
  // ============ WALLET STATE ============
  const { isConnected, account, chainId, provider } = useMetaMask()
  const { isOwner, loading: roleLoading } = useRoleCheck(provider, account)

  // ============ UI STATE ============
  const [activeTab, setActiveTab] = useState('issuers')
  const [addAddress, setAddAddress] = useState('')
  const [removeAddress, setRemoveAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [issuers, setIssuers] = useState([])
  const [issuersLoading, setIssuersLoading] = useState(false)
  const [totalCertificates, setTotalCertificates] = useState(0)
  const [copiedAddress, setCopiedAddress] = useState('')

  const contractAddress = getContractAddress()

  // ============ LOAD ISSUERS & STATS ============
  useEffect(() => {
    if (isOwner && provider) {
      loadContractInfo()
    }
  }, [isOwner, provider])

  const loadContractInfo = async () => {
    setIssuersLoading(true)
    try {
      const contract = getReadOnlyContract()
      const total = await contract.getTotalCertificates()
      setTotalCertificates(Number(total))

      const ownerAddress = await contract.owner()
      const ownerIsIssuer = await contract.isIssuer(ownerAddress)

      const issuersList = []
      if (ownerIsIssuer) {
        issuersList.push({
          address: ownerAddress,
          isOwner: true,
          addedAt: 'Contract deployment',
        })
      }

      setIssuers(issuersList)
    } catch (err) {
      console.error('❌ Load contract info error:', err)
    } finally {
      setIssuersLoading(false)
    }
  }

  // ============ ADD ISSUER ============
  const handleAddIssuer = async () => {
    if (!addAddress.trim()) {
      toast.error('Alamat wallet wajib diisi.')
      return
    }

    if (!ethers.isAddress(addAddress)) {
      toast.error('Format alamat wallet tidak valid.')
      return
    }

    setLoading(true)
    try {
      const contract = await getContract(provider)
      const tx = await contract.addIssuer(addAddress)

      toast.promise(tx.wait(), {
        loading: 'Menambahkan issuer...',
        success: 'Issuer berhasil ditambahkan! 🎉',
        error: 'Gagal menambahkan issuer.',
      })

      await tx.wait()

      setIssuers(prev => [...prev, {
        address: addAddress,
        isOwner: false,
        addedAt: new Date().toISOString(),
      }])
      setAddAddress('')
    } catch (err) {
      console.error('❌ Add issuer error:', err)
      if (err.message.includes('user rejected')) {
        toast.error('Transaksi dibatalkan.')
      } else {
        toast.error('Gagal menambahkan issuer.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============ REMOVE ISSUER ============
  const handleRemoveIssuer = async () => {
    if (!removeAddress.trim()) {
      toast.error('Alamat wallet wajib diisi.')
      return
    }

    if (!ethers.isAddress(removeAddress)) {
      toast.error('Format alamat wallet tidak valid.')
      return
    }

    if (removeAddress.toLowerCase() === account?.toLowerCase()) {
      toast.error('Tidak bisa menghapus diri sendiri.')
      return
    }

    setLoading(true)
    try {
      const contract = await getContract(provider)
      const tx = await contract.removeIssuer(removeAddress)

      toast.promise(tx.wait(), {
        loading: 'Menghapus issuer...',
        success: 'Issuer berhasil dihapus!',
        error: 'Gagal menghapus issuer.',
      })

      await tx.wait()

      setIssuers(prev => prev.filter(i => i.address.toLowerCase() !== removeAddress.toLowerCase()))
      setRemoveAddress('')
    } catch (err) {
      console.error('❌ Remove issuer error:', err)
      if (err.message.includes('user rejected')) {
        toast.error('Transaksi dibatalkan.')
      } else {
        toast.error('Gagal menghapus issuer.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============ COPY TO CLIPBOARD ============
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(label)
      toast.success(`${label} disalin!`)
      setTimeout(() => setCopiedAddress(''), 2000)
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
  if (!isOwner && !roleLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Akses Ditolak</h2>
          <p className="text-slate-400">
            Hanya admin sistem (owner contract) yang bisa mengakses halaman ini.
          </p>
        </Card>
      </div>
    )
  }

  // ============ ADMIN PANEL ============
  return (
    <div className="max-w-3xl mx-auto mt-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Kelola issuer & lihat informasi kontrak</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('issuers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-all ${
            activeTab === 'issuers' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={16} />
          Kelola Issuer
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-all ${
            activeTab === 'info' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info size={16} />
          Info Kontrak
        </button>
      </div>

      {/* Tab: Kelola Issuer */}
      {activeTab === 'issuers' && (
        <div className="space-y-6">
          {/* Add Issuer */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-green-400" />
              Tambah Issuer Baru
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Alamat Wallet Issuer"
                  placeholder="0x..."
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleAddIssuer}
                loading={loading}
                className="flex items-center gap-2"
              >
                <UserPlus size={16} />
                Add Issuer
              </Button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Issuer dapat menerbitkan sertifikat baru. Pastikan alamat wallet benar.
            </p>
          </Card>

          {/* Remove Issuer */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <UserMinus size={20} className="text-red-400" />
              Hapus Issuer
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Alamat Wallet Issuer"
                  placeholder="0x..."
                  value={removeAddress}
                  onChange={(e) => setRemoveAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                variant="danger"
                onClick={handleRemoveIssuer}
                loading={loading}
                className="flex items-center gap-2"
              >
                <UserMinus size={16} />
                Remove Issuer
              </Button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Issuer yang dihapus tidak bisa lagi menerbitkan sertifikat baru.
            </p>
          </Card>

          {/* Daftar Issuer */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              Daftar Issuer Saat Ini
            </h3>

            {issuersLoading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner />
              </div>
            ) : issuers.length > 0 ? (
              <div className="space-y-2">
                {issuers.map((issuer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        issuer.isOwner ? 'bg-purple-400' : 'bg-green-400'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-200 font-mono text-sm">
                            {formatAddress(issuer.address)}
                          </span>
                          {issuer.isOwner && (
                            <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full border border-purple-700">
                              Owner
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/address/${issuer.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 text-sm">Belum ada issuer terdaftar.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Info Kontrak */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Contract Info */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-400" />
              Informasi Smart Contract
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Contract Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-mono text-sm">
                    {formatAddress(contractAddress)}
                  </span>
                  <button
                    onClick={() => handleCopy(contractAddress, 'Contract Address')}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {copiedAddress === 'Contract Address' ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Owner Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-mono text-sm">
                    {formatAddress(account)}
                  </span>
                  <button
                    onClick={() => handleCopy(account, 'Owner Address')}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {copiedAddress === 'Owner Address' ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Network</span>
                <span className="text-slate-200 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Sepolia Testnet (Chain ID: 11155111)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Total Sertifikat</span>
                <span className="text-slate-200 font-semibold">
                  {totalCertificates} sertifikat
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Status</span>
                <span className="text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle size={14} />
                  Active
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <Card>
            <h3 className="text-lg font-medium text-slate-200 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-all"
              >
                <ExternalLink size={16} />
                Etherscan Contract
              </a>
              <a
                href={`https://sepolia.etherscan.io/address/${contractAddress}#writeContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-all"
              >
                <ExternalLink size={16} />
                Write Contract
              </a>
              <a
                href={`https://sepolia.etherscan.io/address/${contractAddress}#readContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-all"
              >
                <ExternalLink size={16} />
                Read Contract
              </a>
              <a
                href={`https://sepolia.etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-all"
              >
                <ExternalLink size={16} />
                Wallet History
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Admin