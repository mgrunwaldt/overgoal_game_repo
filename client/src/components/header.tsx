export function Header() {
  return (
    <div className="text-center mb-12">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30">
        <span className="text-white text-4xl font-bold">⛩</span>
      </div>
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 via-white to-blue-600 bg-clip-text text-transparent">
        Dojo Game Starter
      </h1>
      <p className="text-xl text-slate-300 max-w-2xl mx-auto">
        Complete onchain gaming template for Starknet ecosystem
      </p>
    </div>
  )
}
