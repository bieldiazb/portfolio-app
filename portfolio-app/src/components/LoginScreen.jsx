import { COLORS, FONTS } from './design-tokens'

const styles = `
  .login-wrap {
    min-height: 100dvh;
    background: ${COLORS.bg};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: ${FONTS.sans};
  }

  .login-box { width: 100%; max-width: 340px; }

  .login-logo {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 40px;
  }
  .login-logo-mark {
    width: 22px; height: 22px;
    border: 1px solid ${COLORS.neonPurple};
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .login-logo-name {
    font-size: 14px; font-weight: 500;
    color: ${COLORS.textPrimary}; letter-spacing: -0.2px;
  }
  .login-logo-v {
    font-family: ${FONTS.mono};
    font-size: 9px; color: ${COLORS.textMuted};
    background: ${COLORS.elevated};
    border: 1px solid ${COLORS.border};
    padding: 2px 5px; border-radius: 2px;
  }

  .login-headline {
    font-size: clamp(24px, 5vw, 30px);
    font-weight: 300;
    color: ${COLORS.textPrimary};
    letter-spacing: -1px;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  .login-headline strong {
    font-weight: 500;
    color: ${COLORS.neonPurple};
  }
  .login-sub {
    font-size: 13px;
    color: ${COLORS.textMuted};
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .login-features {
    display: flex; flex-direction: column; gap: 8px;
    margin-bottom: 32px;
    padding: 14px 16px;
    border: 1px solid ${COLORS.border};
    border-radius: 6px;
    background: ${COLORS.elevated};
  }
  .login-feat {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; color: ${COLORS.textSecondary};
  }
  .login-feat-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: ${COLORS.neonGreen}; flex-shrink: 0;
  }

  .login-error {
    background: ${COLORS.bgRed};
    border: 1px solid ${COLORS.borderRed};
    color: ${COLORS.neonRed};
    border-radius: 5px;
    padding: 10px 13px;
    font-size: 12px;
    margin-bottom: 14px;
    line-height: 1.5;
  }

  .login-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: ${COLORS.neonPurple};
    color: #fff;
    border: none; border-radius: 5px;
    padding: 12px 16px;
    font-family: ${FONTS.sans};
    font-size: 14px; font-weight: 500;
    cursor: pointer;
    transition: opacity 120ms, transform 80ms;
    letter-spacing: -0.1px;
    -webkit-tap-highlight-color: transparent;
  }
  .login-btn:hover { opacity: 0.85; }
  .login-btn:active { transform: scale(0.98); }

  .login-divider {
    display: flex; align-items: center; gap: 10px;
    margin: 18px 0;
    color: ${COLORS.textMuted};
    font-size: 10px; font-family: ${FONTS.mono};
    text-transform: uppercase; letter-spacing: 0.10em;
  }
  .login-divider::before, .login-divider::after {
    content: ''; flex: 1; height: 1px;
    background: ${COLORS.border};
  }

  .login-note {
    text-align: center;
    font-size: 11px;
    color: ${COLORS.textMuted};
    line-height: 1.6;
  }
`

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
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

      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-mark">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonPurple} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="login-logo-name">Cartera</span>
          <span className="login-logo-v">v3</span>
        </div>

        <h1 className="login-headline">
          Les teves inversions,<br/>
          <strong>sempre a mà.</strong>
        </h1>
        <p className="login-sub">
          Segueix el teu portfoli en temps real, compara amb el mercat i projecta el futur.
        </p>

        <div className="login-features">
          {[
            'Preus en temps real via Yahoo Finance',
            'Benchmark vs S&P 500 i MSCI World',
            'Projeccions i rebalanceig intel·ligent',
            'Informe PDF mensual automàtic',
          ].map(f => (
            <div key={f} className="login-feat">
              <div className="login-feat-dot"/>
              {f}
            </div>
          ))}
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" onClick={onLogin}>
          <GoogleIcon/>
          Continuar amb Google
        </button>

        <div className="login-divider">accés privat</div>

        <p className="login-note">
          Les teves dades es guarden al teu compte de Google.<br/>
          Ningú més hi té accés.
        </p>
      </div>
    </div>
  )
}