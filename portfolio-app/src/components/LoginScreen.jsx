import { COLORS, FONTS } from './design-tokens'
import { useTheme } from '../hooks/useTheme'

const FEATURES = [
  { icon:'📈', label:'Preus en temps real'     },
  { icon:'🏆', label:'Benchmark vs mercat'      },
  { icon:'🔮', label:'Projeccions de futur'     },
  { icon:'💰', label:'Dividends i rendes'       },
  { icon:'⚖️', label:'Rebalanceig automàtic'   },
  { icon:'🤖', label:'Assessor AI integrat'     },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,300;9..40,400;9..40,500;9..40,600&family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lg {
    min-height: 100dvh;
    background: var(--c-bg);
    color: var(--c-text-primary);
    font-family: 'DM Sans', sans-serif;
    display: flex; flex-direction: column;
    transition: background-color 220ms ease, color 220ms ease;
  }

  /* ── Nav ── */
  .lg-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 48px;
    border-bottom: 1px solid var(--c-border);
  }
  @media (max-width: 640px) { .lg-nav { padding: 18px 24px; } }

  .lg-nav-right { display: flex; align-items: center; gap: 10px; }

  .lg-brand { display: flex; align-items: center; gap: 10px; }
  .lg-brand-mark {
    width: 30px; height: 30px; border-radius: 7px;
    background: var(--c-text-primary);
    display: flex; align-items: center; justify-content: center;
    transition: background-color 220ms ease;
  }
  .lg-brand-name { font-size: 16px; font-weight: 500; color: var(--c-text-primary); letter-spacing: -0.3px; }
  .lg-nav-pill {
    font-family: 'Geist Mono', monospace;
    font-size: 10px; color: var(--c-text-muted);
    border: 1px solid var(--c-border);
    padding: 3px 10px; border-radius: 20px; letter-spacing: 0.03em;
  }

  /* ── Theme toggle ── */
  .lg-theme-btn {
    width: 34px; height: 34px; border-radius: 8px;
    background: var(--c-elevated);
    border: 1px solid var(--c-border);
    color: var(--c-text-secondary);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 120ms; flex-shrink: 0;
  }
  .lg-theme-btn:hover { border-color: var(--c-border-hi); color: var(--c-text-primary); background: var(--c-border); }

  /* ── Layout ── */
  .lg-main {
    flex: 1;
    display: grid; grid-template-columns: 1fr 1fr;
    max-width: 1200px; margin: 0 auto; width: 100%;
    padding: 0 48px; gap: 96px; align-items: center;
  }
  @media (max-width: 900px) {
    .lg-main { grid-template-columns: 1fr; gap: 48px; padding: 48px 24px 40px; }
  }

  /* ── Left ── */
  .lg-left { display: flex; flex-direction: column; }

  .lg-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: 'Geist Mono', monospace;
    font-size: 10px; color: var(--c-text-muted);
    letter-spacing: 0.10em; text-transform: uppercase;
    margin-bottom: 24px;
  }
  .lg-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #22c55e; animation: lgblink 2.4s ease-in-out infinite;
  }
  @keyframes lgblink { 0%,100%{opacity:1} 50%{opacity:0.25} }

  .lg-h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: clamp(40px, 4.8vw, 64px);
    font-weight: 400; line-height: 1.06;
    letter-spacing: -1.5px; color: var(--c-text-primary); margin-bottom: 22px;
  }
  .lg-h1 em { font-style: italic; color: var(--c-text-secondary); }

  .lg-desc {
    font-size: 15px; font-weight: 400; color: var(--c-text-secondary);
    line-height: 1.7; max-width: 380px; margin-bottom: 36px;
  }

  /* Stats */
  .lg-stats {
    display: flex; gap: 0;
    border: 1px solid var(--c-border); border-radius: 12px;
    overflow: hidden; margin-bottom: 36px;
    background: var(--c-surface);
  }
  .lg-stat { flex: 1; padding: 16px 20px; text-align: center; }
  .lg-stat:not(:last-child) { border-right: 1px solid var(--c-border); }
  .lg-stat-v {
    font-family: ${FONTS.mono};
    font-size: 24px; font-weight: 500; color: var(--c-text-primary);
    letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px;
  }
  .lg-stat-l { font-size: 10px; font-weight: 400; color: var(--c-text-muted); }

  .lg-error {
    font-size: 13px; color: var(--c-red);
    background: var(--c-bg-red); border: 1px solid var(--c-border-red);
    border-radius: 8px; padding: 11px 16px; margin-bottom: 16px;
  }

  /* CTA */
  .lg-btn {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--c-text-primary); color: var(--c-bg);
    border: none; border-radius: 10px; padding: 15px 28px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 500; letter-spacing: -0.2px;
    cursor: pointer; width: fit-content;
    transition: opacity 150ms, transform 80ms;
  }
  .lg-btn:hover  { opacity: 0.82; }
  .lg-btn:active { transform: scale(0.98); }

  .lg-secure {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--c-text-muted); margin-top: 14px;
  }

  /* ── Right ── */
  .lg-right { display: flex; flex-direction: column; gap: 10px; }

  .lg-preview {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 16px; padding: 28px;
  }
  .lg-preview-hdr {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .lg-preview-label { font-size: 11px; font-weight: 500; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .lg-live-badge {
    display: flex; align-items: center; gap: 5px;
    font-family: 'Geist Mono', monospace; font-size: 10px; color: #16a34a;
    background: var(--c-bg-green); border: 1px solid var(--c-border-green);
    padding: 3px 9px; border-radius: 20px;
  }
  .lg-live-dot { width: 4px; height: 4px; border-radius: 50%; background: #22c55e; animation: lgblink 2.4s ease-in-out infinite; }

  .lg-preview-val {
    font-family: ${FONTS.num};
    font-size: 44px; font-weight: 600; color: var(--c-text-primary);
    letter-spacing: -1.5px; line-height: 1; margin-bottom: 8px;
  }
  .lg-preview-gain {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 500; color: #16a34a;
    background: var(--c-bg-green); border: 1px solid var(--c-border-green);
    padding: 4px 10px; border-radius: 20px; margin-bottom: 22px;
  }

  .lg-bar { display: flex; height: 4px; border-radius: 3px; overflow: hidden; gap: 2px; margin-bottom: 12px; }
  .lg-bar-seg { border-radius: 2px; }
  .lg-legend { display: flex; gap: 16px; flex-wrap: wrap; }
  .lg-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--c-text-secondary); }
  .lg-legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* Feature chips */
  .lg-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .lg-chip {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 10px; padding: 12px 14px;
    display: flex; align-items: center; gap: 9px;
    font-size: 12px; font-weight: 500; color: var(--c-text-secondary);
    transition: border-color 120ms, color 120ms;
  }
  .lg-chip:hover { border-color: var(--c-border-mid); color: var(--c-text-primary); }
  .lg-chip-icon { font-size: 15px; flex-shrink: 0; }

  /* Footer */
  .lg-footer {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
    padding: 18px 48px; border-top: 1px solid var(--c-border);
  }
  @media (max-width: 640px) { .lg-footer { padding: 14px 24px; } }
  .lg-footer-l { font-size: 12px; color: var(--c-text-muted); }
  .lg-footer-r { font-family: 'Geist Mono', monospace; font-size: 10px; color: var(--c-text-disabled); letter-spacing: 0.05em; }
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

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="2"  x2="12" y2="4"/>  <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12" x2="4" y2="12"/>   <line x1="20" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/> <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

export default function LoginScreen({ onLogin, error }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="lg">
      <style>{styles}</style>

      <nav className="lg-nav">
        <div className="lg-brand">
          <div className="lg-brand-mark">
            <img src="/logo_black.png" alt="" style={{ width: 20, height: 20, filter: isDark ? 'invert(0)' : 'invert(1)' }}/>
          </div>
          <span className="lg-brand-name">Cartera</span>
        </div>
        <div className="lg-nav-right">
          <span className="lg-nav-pill">Beta privada</span>
          <button
            className="lg-theme-btn"
            onClick={toggleTheme}
            title={isDark ? 'Canviar a mode clar' : 'Canviar a mode fosc'}
          >
            {isDark ? <SunIcon/> : <MoonIcon/>}
          </button>
        </div>
      </nav>

      <main className="lg-main">
        <div className="lg-left">
          <div className="lg-eyebrow">
            <div className="lg-eyebrow-dot"/>
            Gestió de portfoli personal
          </div>

          <h1 className="lg-h1">
            Les teves inversions,<br/>
            <em>sempre sota control.</em>
          </h1>

          <p className="lg-desc">
            Segueix tots els teus actius en temps real, compara el rendiment
            amb el mercat i rep anàlisi personalitzada amb intel·ligència artificial.
          </p>

          <div className="lg-stats">
            <div className="lg-stat"><p className="lg-stat-v">6+</p><p className="lg-stat-l">Tipus d'actius</p></div>
            <div className="lg-stat"><p className="lg-stat-v">RT</p><p className="lg-stat-l">Preus en viu</p></div>
            <div className="lg-stat"><p className="lg-stat-v">AI</p><p className="lg-stat-l">Assessor inclòs</p></div>
          </div>

          {error && <div className="lg-error">{error}</div>}

          <button className="lg-btn" onClick={onLogin}>
            <GoogleIcon/>
            Accedir amb Google
          </button>

          <p className="lg-secure">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Accés segur via Google OAuth · Les teves dades, al teu compte.
          </p>
        </div>

        <div className="lg-right">
          <div className="lg-preview">
            <div className="lg-preview-hdr">
              <span className="lg-preview-label">Portfoli total</span>
              <span className="lg-live-badge"><span className="lg-live-dot"/>En viu</span>
            </div>
            <p className="lg-preview-val">124.830 €</p>
            <div className="lg-preview-gain">↑ +18.4% · +€19.380 acumulat</div>
            <div className="lg-bar">
              <div className="lg-bar-seg" style={{flex:52, background:'var(--c-text-primary)'}}/>
              <div className="lg-bar-seg" style={{flex:23, background:'#4ade80'}}/>
              <div className="lg-bar-seg" style={{flex:14, background:'#f59e0b'}}/>
              <div className="lg-bar-seg" style={{flex:11, background:'#60a5fa'}}/>
            </div>
            <div className="lg-legend">
              {[
                { color:'var(--c-text-primary)', label:'ETFs · 52%'     },
                { color:'#4ade80',               label:'Estalvis · 23%' },
                { color:'#f59e0b',               label:'Crypto · 14%'   },
                { color:'#60a5fa',               label:'Accions · 11%'  },
              ].map(d => (
                <div key={d.label} className="lg-legend-item">
                  <div className="lg-legend-dot" style={{background: d.color}}/>{d.label}
                </div>
              ))}
            </div>
          </div>

          <div className="lg-chips">
            {FEATURES.map(f => (
              <div key={f.label} className="lg-chip">
                <span className="lg-chip-icon">{f.icon}</span>{f.label}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="lg-footer">
        <span className="lg-footer-l">Fet per gestionar el teu futur financer</span>
        <span className="lg-footer-r">CARTERA © 2026</span>
      </footer>
    </div>
  )
}