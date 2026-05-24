const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card