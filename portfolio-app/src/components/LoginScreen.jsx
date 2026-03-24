const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  .login-wrap {
    min-height: 100dvh;
    background: #080808;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Geist', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Gradient ambient de fons */
  .login-wrap::before {
    content: '';
    position: absolute;
    top: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(ellipse, rgba(80,210,110,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .login-box {
    width: 100%;
    max-width: 360px;
    position: relative;
    z-index: 1;
  }

  /* Logo */
  .login-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 40px;
  }
  .login-logo-name {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255,255,255,0.80);
    letter-spacing: -0.3px;
  }
  .login-logo-v {
    font-family: 'Geist Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    padding: 2px 5px;
    border-radius: 3px;
  }

  /* Headline */
  .login-headline {
    font-size: clamp(26px, 5vw, 34px);
    font-weight: 300;
    color: rgba(255,255,255,0.88);
    letter-spacing: -1.2px;
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .login-headline strong {
    font-weight: 500;
    color: rgba(255,255,255,0.95);
  }
  .login-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.30);
    line-height: 1.6;
    margin-bottom: 36px;
  }

  /* Features mini-list */
  .login-features {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 36px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
  }
  .login-feat {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: rgba(255,255,255,0.38);
  }
  .login-feat-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(80,210,110,0.60);
    flex-shrink: 0;
  }

  /* Error */
  .login-error {
    background: rgba(220,50,40,0.08);
    border: 1px solid rgba(220,50,40,0.18);
    color: rgba(255,100,90,0.90);
    border-radius: 7px;
    padding: 10px 13px;
    font-size: 12px;
    margin-bottom: 14px;
    line-height: 1.5;
  }

  /* Botó Google */
  .login-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255,255,255,0.92);
    color: #111;
    border: none;
    border-radius: 8px;
    padding: 13px 16px;
    font-family: 'Geist', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 120ms, transform 80ms;
    letter-spacing: -0.2px;
    -webkit-tap-highlight-color: transparent;
  }
  .login-btn:hover { background: #fff; }
  .login-btn:active { transform: scale(0.98); background: rgba(255,255,255,0.85); }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 20px 0;
    color: rgba(255,255,255,0.12);
    font-size: 11px;
  }
  .login-divider::before,
  .login-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }

  .login-note {
    text-align: center;
    font-size: 11px;
    color: rgba(255,255,255,0.18);
    line-height: 1.6;
  }
  .login-note a {
    color: rgba(255,255,255,0.28);
    text-decoration: none;
  }

  /* Decoració ambient inferior */
  .login-ambient {
    position: absolute;
    bottom: -20%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(100,155,255,0.04) 0%, transparent 70%);
    pointer-events: none;
  }
`

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginScreen({ onLogin, error }) {
  return (
    <div className="login-wrap">
      <style>{styles}</style>
      <div className="login-ambient" />

      <div className="login-box">
        {/* Logo */}
        <div className="login-logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"
              stroke="rgba(80,210,110,0.80)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 7 22 7 22 13"
              stroke="rgba(80,210,110,0.80)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="login-logo-name">Cartera</span>
          <span className="login-logo-v">v2</span>
        </div>

        {/* Headline */}
        <h1 className="login-headline">
          Les teves inversions,<br />
          <strong>sempre a mà.</strong>
        </h1>
        <p className="login-sub">
          Segueix el teu portfoli en temps real, compara amb el mercat i projecta el futur.
        </p>

        {/* Features */}
        <div className="login-features">
          {[
            'Preus en temps real via Yahoo Finance',
            'Benchmark vs S&P 500 i MSCI World',
            'Projeccions i rebalanceig intel·ligent',
            'Informe PDF mensual automàtic',
          ].map(f => (
            <div key={f} className="login-feat">
              <div className="login-feat-dot" />
              {f}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {/* Botó */}
        <button className="login-btn" onClick={onLogin}>
          <GoogleIcon />
          Continuar amb Google
        </button>

        <div className="login-divider">accés privat</div>

        <p className="login-note">
          Les teves dades es guarden al teu compte de Google.<br />
          Ningú més hi té accés.
        </p>
      </div>
    </div>
  )
}