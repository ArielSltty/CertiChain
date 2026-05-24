import { Link, useLocation } from 'react-router-dom'
import WalletConnector from './WalletConnector'
import useMetaMask from '../hooks/useMetaMask'
import useRoleCheck from '../hooks/useRoleCheck'

const Layout = ({ children }) => {
  const location = useLocation()
  const { isConnected, account, provider } = useMetaMask()
  const { isIssuer, isOwner } = useRoleCheck(provider, account)

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    ...(isIssuer || isOwner ? [{ path: '/issue', label: 'Issue' }] : []),
    { path: '/verify', label: 'Verify' },
    ...(isOwner ? [{ path: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="text-lg font-semibold text-slate-100 tracking-tight">
              CertiChain
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Wallet */}
          <WalletConnector />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2025 CertiChain — Verifikasi Ijazah Digital Berbasis Blockchain</p>
          <p className="mt-1 text-slate-600">Powered by Ethereum Sepolia & IPFS</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout