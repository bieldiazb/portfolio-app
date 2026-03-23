export default function Header({ user, onLogout }) {
  const today = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Cartera Personal</h1>
            <p className="text-xs text-gray-400 capitalize">{today}</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-gray-100" referrerPolicy="no-referrer" />
            )}
            <span className="text-sm text-gray-600 hidden sm:block">{user.displayName?.split(' ')[0]}</span>
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              Sortir
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
