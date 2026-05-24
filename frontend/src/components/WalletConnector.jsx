import { useState, useRef, useEffect } from 'react'
import useMetaMask from '../hooks/useMetaMask'

const WalletConnector = () => {
  const {
    isConnected,
    account,
    balance,
    chainId,
    error,
    connectWallet,
    disconnectWallet,
  } = useMetaMask()

  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const isSepolia = chainId === 11155111

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Format address: 0x1234...5678
  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Format balance to 4 decimal places
  const formatBalance = (bal) => {
    if (!bal) return '0'
    return parseFloat(bal).toFixed(4)
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200"
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm rounded-lg px-3 py-2 transition-all duration-200"
      >
        {/* Network Indicator */}
        <span className={`w-2 h-2 rounded-full ${isSepolia ? 'bg-green-400' : 'bg-red-400'}`} />
        
        {/* Address */}
        <span className="text-slate-200 font-medium">
          {formatAddress(account)}
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Account Info */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Connected as</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isSepolia 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : 'bg-red-900/50 text-red-400 border border-red-700'
              }`}>
                {isSepolia ? 'Sepolia' : 'Wrong Network'}
              </span>
            </div>
            <p className="text-slate-100 font-mono text-sm">{formatAddress(account)}</p>
          </div>

          {/* Balance */}
          <div className="p-4 border-b border-slate-700">
            <span className="text-xs text-slate-400">Balance</span>
            <p className="text-slate-100 font-medium">
              {formatBalance(balance)} {isSepolia ? 'SepoliaETH' : 'ETH'}
            </p>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={() => {
              disconnectWallet()
              setShowDropdown(false)
            }}
            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

export default WalletConnector