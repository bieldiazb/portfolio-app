import { COLORS, FONTS } from './design-tokens'

// FONTS.sans = Geist (UI)
// FONTS.mono = Geist Mono (tickers, codis)  
// FONTS.num  = DM Sans (números i valors)

const FEATURES = [
  { icon:'📈', title:'Preus en temps real',      desc:'ETFs, accions, crypto i matèries primeres via Yahoo Finance i CoinGecko.',       color:COLORS.neonCyan,   bg:'rgba(0,212,255,0.08)'   },
  { icon:'🏆', title:'Benchmark vs mercat',       desc:'Compara el teu rendiment amb el S&P 500, MSCI World i FTSE All-World.',         color:COLORS.neonAmber,  bg:'rgba(255,149,0,0.08)'   },
  { icon:'🔮', title:'Projeccions de futur',      desc:'Simula quant valdrà el teu portfoli en 5, 10 o 20 anys.',                        color:COLORS.neonPurple, bg:'rgba(123,97,255,0.08)'  },
  { icon:'💰', title:'Dividends i rendes',        desc:'Calendari de dividends i estimació d\'ingressos passius mensuals.',               color:COLORS.neonGreen,  bg:'rgba(0,255,136,0.08)'   },
  { icon:'⚖️', title:'Rebalanceig intel·ligent',  desc:'Detecta desviacions i rep suggeriments per ajustar la distribució.',             color:'#c8961a',          bg:'rgba(200,150,26,0.08)'  },
  { icon:'🤖', title:'Assessor AI integrat',      desc:'Analitza el teu portfoli amb Claude: riscos, alternatives i estratègia.',        color:COLORS.neonPurple, bg:'rgba(123,97,255,0.08)'  },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lg {
    min-height: 100dvh;
    background: #080808;
    color: var(--c-text-primary);
    font-family: ${FONTS.sans};
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ─── HEADER ─── */
  .lg-nav {
    width: 100%; max-width: 800px;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lg-logo-box {
    width: 30px; height: 30px;
    background: ${COLORS.neonGreen};
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .lg-logo-name {
    font-family: ${FONTS.sans};
    font-size: 16px;
    font-weight: 600;
    color: var(--c-text-primary);
    letter-spacing: -0.3px;
  }
  .lg-logo-tag {
    font-family: ${FONTS.mono};
    font-size: 9px;
    font-weight: 500;
    color: ${COLORS.neonGreen};
    background: rgba(0,255,136,0.09);
    border: 1px solid rgba(0,255,136,0.22);
    padding: 2px 7px;
    border-radius: 10px;
    letter-spacing: 0.04em;
  }

  /* ─── HERO ─── */
  .lg-hero {
    width: 100%; max-width: 580px;
    padding: 48px 24px 40px;
    text-align: center;
    position: relative;
  }
  .lg-hero::before {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 480px; height: 260px;
    background: radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.07) 0%, transparent 65%);
    pointer-events: none;
  }

  /* Pill live */
  .lg-live {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: ${FONTS.sans};
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.45);
    background: var(--c-border);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 5px 14px; border-radius: 20px;
    margin-bottom: 28px;
    letter-spacing: 0.01em;
  }
  .lg-live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: ${COLORS.neonGreen};
    animation: lgpulse 2s ease-in-out infinite;
  }
  @keyframes lgpulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

  /* Headline */
  .lg-h1 {
    font-family: ${FONTS.sans};
    font-size: clamp(36px, 7vw, 56px);
    font-weight: 300;
    color: var(--c-text-primary);
    letter-spacing: -2px;
    line-height: 1.08;
    margin-bottom: 18px;
  }
  .lg-h1 strong {
    font-weight: 600;
    color: var(--c-text-primary);
  }
  .lg-h1 .accent {
    font-weight: 300;
    color: ${COLORS.neonGreen};
  }

  /* Subtítol */
  .lg-desc {
    font-family: ${FONTS.sans};
    font-size: 15px;
    font-weight: 400;
    color: rgba(255,255,255,0.35);
    line-height: 1.7;
    max-width: 420px;
    margin: 0 auto 32px;
    letter-spacing: 0.01em;
  }

  /* Stats en línia */
  .lg-stats {
    display: flex; align-items: center; justify-content: center;
    gap: 0; margin-bottom: 36px;
  }
  .lg-stat {
    text-align: center; padding: 0 20px;
    position: relative;
  }
  .lg-stat:not(:last-child)::after {
    content: ''; position: absolute; right: 0; top: 15%; height: 70%;
    width: 1px; background: var(--c-surface);
  }
  .lg-stat-v {
    font-family: ${FONTS.num};
    font-size: 20px; font-weight: 500;
    color: var(--c-text-primary); letter-spacing: -0.5px;
    margin-bottom: 2px;
  }
  .lg-stat-l {
    font-family: ${FONTS.sans};
    font-size: 10px; font-weight: 400;
    color: rgba(255,255,255,0.28);
    letter-spacing: 0.02em;
  }

  /* CTA */
  .lg-cta { display: flex; flex-direction: column; align-items: center; gap: 10px; }

  .lg-btn-google {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; color: #000;
    border: none; border-radius: 12px;
    padding: 14px 32px;
    font-family: ${FONTS.sans};
    font-size: 15px; font-weight: 600;
    letter-spacing: -0.2px;
    cursor: pointer;
    width: 100%; max-width: 310px;
    transition: opacity 100ms, transform 80ms;
    -webkit-tap-highlight-color: transparent;
  }
  .lg-btn-google:hover { opacity: 0.88; }
  .lg-btn-google:active { transform: scale(0.98); }

  .lg-privacy {
    display: flex; align-items: center; gap: 5px;
    font-family: ${FONTS.sans};
    font-size: 11px; font-weight: 400;
    color: rgba(255,255,255,0.18);
  }

  .lg-error {
    font-family: ${FONTS.sans};
    font-size: 12px;
    color: ${COLORS.neonRed};
    background: rgba(255,59,59,0.08);
    border: 1px solid rgba(255,59,59,0.22);
    border-radius: 8px;
    padding: 10px 16px;
    max-width: 310px; width: 100%;
    text-align: center;
  }

  /* ─── DIVISOR ─── */
  .lg-sep {
    display: flex; align-items: center; gap: 14px;
    width: 100%; max-width: 640px;
    padding: 0 24px; margin: 8px 0 28px;
  }
  .lg-sep::before, .lg-sep::after {
    content: ''; flex: 1; height: 1px;
    background: var(--c-border);
  }
  .lg-sep-text {
    font-family: ${FONTS.sans};
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.18);
    white-space: nowrap;
    letter-spacing: 0.04em;
  }

  /* ─── FEATURES ─── */
  .lg-grid {
    width: 100%; max-width: 720px;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 36px;
  }
  @media (min-width: 600px) {
    .lg-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .lg-feat {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 12px;
    padding: 16px 16px 14px;
    transition: border-color 150ms;
  }
  .lg-feat:hover { border-color: rgba(255,255,255,0.11); }

  .lg-feat-icon {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; margin-bottom: 10px;
  }
  .lg-feat-title {
    font-family: ${FONTS.sans};
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.85);
    letter-spacing: -0.2px;
    margin-bottom: 5px;
  }
  .lg-feat-desc {
    font-family: ${FONTS.sans};
    font-size: 11px; font-weight: 400;
    color: rgba(255,255,255,0.30);
    line-height: 1.65;
  }

  /* ─── CTA FINAL ─── */
  .lg-final {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 0 24px; width: 100%; max-width: 360px;
  }
  .lg-final-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: ${COLORS.neonGreen}; color: #000;
    border: none; border-radius: 12px;
    padding: 14px 28px;
    font-family: ${FONTS.sans};
    font-size: 15px; font-weight: 700;
    cursor: pointer; width: 100%;
    transition: opacity 100ms, transform 80ms;
    -webkit-tap-highlight-color: transparent;
  }
  .lg-final-btn:hover { opacity: 0.85; }
  .lg-final-btn:active { transform: scale(0.98); }

  /* ─── FOOTER ─── */
  .lg-footer {
    padding: 24px 24px 44px;
    text-align: center;
    font-family: ${FONTS.sans};
    font-size: 11px; font-weight: 400;
    color: rgba(255,255,255,0.14);
    line-height: 1.7;
  }
`

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginScreen({ onLogin, error }) {
  return (
    <div className="lg">
      <style>{styles}</style>

      {/* Nav */}
      <nav className="lg-nav">
        <div className="lg-logo-box">
          {/* <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg> */}
          <img src="/logo_black.png" alt="Cartera" style={{ width: 22, height: 22 }}/>
        </div>
        <span className="lg-logo-name">Cartera</span>
        <span className="lg-logo-tag">Beta</span>
      </nav>

      {/* Hero */}
      <section className="lg-hero">
        {/* Pill live */}
        <div className="lg-live">
          <div className="lg-live-dot"/>
          Preus en temps real · Actualitzat ara
        </div>

        {/* Headline */}
        <h1 className="lg-h1">
          El teu portfoli,<br/>
          <strong>sempre a punt.</strong><br/>
          <span className="accent">Inverteix amb dades.</span>
        </h1>

        {/* Subtítol */}
        <p className="lg-desc">
          Segueix totes les teves inversions en temps real.
          Compara amb el mercat, projecta el futur i rep
          anàlisi personalitzada amb intel·ligència artificial.
        </p>

        {/* Stats */}
        <div className="lg-stats">
          {[
            { v:'6+',  l:"tipus d'actius" },
            { v:'RT',  l:'preus en viu'   },
            { v:'AI',  l:'assessor'        },
          ].map(s => (
            <div key={s.l} className="lg-stat">
              <p className="lg-stat-v">{s.v}</p>
              <p className="lg-stat-l">{s.l}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="lg-cta">
          {error && <div className="lg-error">{error}</div>}
          <button className="lg-btn-google" onClick={onLogin}>
            <GoogleIcon/>
            Accedir amb Google
          </button>
          <span className="lg-privacy">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Les teves dades, al teu compte. Accés privat.
          </span>
        </div>
      </section>

      {/* Divisor */}
      <div className="lg-sep">
        <span className="lg-sep-text">Funcionalitats incloses</span>
      </div>

      {/* Grid de features */}
      <div className="lg-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="lg-feat">
            <div className="lg-feat-icon" style={{background:f.bg}}>{f.icon}</div>
            <p className="lg-feat-title">{f.title}</p>
            <p className="lg-feat-desc">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA final verd */}
      <div className="lg-final">
        <button className="lg-final-btn" onClick={onLogin}>
          <GoogleIcon/>
          Comença ara, és gratuït
        </button>
      </div>

      {/* Footer */}
      <footer className="lg-footer">
        Dades sincronitzades amb Google · Accés segur via OAuth 2.0<br/>
        Fet amb ❤️ per gestionar el teu futur financer
      </footer>
    </div>
  )
}