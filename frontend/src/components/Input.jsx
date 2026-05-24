const Input = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`
          w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5
          text-slate-100 placeholder-slate-500
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}

export default Input