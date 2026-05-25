const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  loading = false,
  disabled = false,
  ...props 
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600',
    danger: 'bg-red-600/80 hover:bg-red-500 text-white border-red-600',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 border-transparent',
  }

  return (
    <button
      className={`
        font-medium py-2 px-4 rounded-lg border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
          Loading...
        </span>
      ) : children}
    </button>
  )
}

export default Button