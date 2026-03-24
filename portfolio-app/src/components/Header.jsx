export default function Header({ user, onLogout, title }) {
  const today = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <header className="bg-card border-b border-border px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
      <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground hidden sm:block capitalize">{today}</span>
        {user?.photoURL && (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full opacity-80" referrerPolicy="no-referrer" />
        )}
      </div>
    </header>
  )
}