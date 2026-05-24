const Navbar = () => {
  return (
    <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-xl font-semibold text-slate-100 tracking-tight">
          🎓 CertiChain
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/issue" className="text-slate-400 hover:text-slate-200 transition-colors">Issue</a>
          <a href="/verify" className="text-slate-400 hover:text-slate-200 transition-colors">Verify</a>
          <a href="/revoke" className="text-slate-400 hover:text-slate-200 transition-colors">Revoke</a>
          <button className="btn-primary text-sm">Connect Wallet</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar