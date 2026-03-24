export default function LoginScreen({ onLogin, error }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-8">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="hsl(142 71% 40%)"/>
            </svg>
            <span className="text-xl font-bold text-foreground tracking-tight">Cartera</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight mb-2">
            Les teves inversions,<br />sempre a mà.
          </h1>
          <p className="text-muted-foreground text-sm">Segueix el teu portfoli en temps real.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-medium mb-4">
            {error}
          </div>
        )}

        <button onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-foreground hover:bg-foreground/90 text-white font-semibold py-3.5 px-4 rounded-xl transition-all text-sm">
          <GoogleIcon />
          Continuar amb Google
        </button>

        <p className="text-xs text-muted-foreground mt-6 text-center">Accés privat · només per a tu</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="white"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="white"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="white"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="white"/>
    </svg>
  )
}