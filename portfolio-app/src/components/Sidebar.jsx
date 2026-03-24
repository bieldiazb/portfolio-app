// ─── Sidebar.v3.jsx ─────────────────────────────────────────────────────────
// Sidebar universal: fixed en desktop, drawer lliscant en mòbil.
// Substitueix Sidebar.v2.jsx + BottomNav.jsx completament.
//
// En desktop (≥1024px): barra fixa a l'esquerra, sempre visible.
// En mòbil (<1024px):   ocult per defecte, s'obre amb el botó ☰ del header.
//
// Props:
//   active    — id de la pàgina activa
//   onChange  — callback quan es canvia de pàgina
//   user      — objecte Firebase user
//   onLogout  — callback per tancar sessió
//   isOpen    — (mòbil) si el drawer és obert
//   onClose   — (mòbil) callback per tancar el drawer

const NAV_MAIN = [
  {
    id: 'investments', label: 'Inversions',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>,
  },
  {
    id: 'savings', label: 'Estalvis',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>,
  },
  {
    id: 'crypto', label: 'Crypto',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9 8h5a2 2 0 0 1 0 4H9v4h5a2 2 0 0 0 0-4"/>
    </svg>,
  },
  {
    id: 'movements', label: 'Moviments',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>,
  },
]

const NAV_ANALYSIS = [
  {
    id: 'projections', label: 'Projeccions',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>,
  },
  {
    id: 'chart', label: 'Distribució',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12V2z"/>
    </svg>,
  },
  {
    id: 'benchmark', label: 'Benchmark',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>,
  },
  {
    id: 'rebalancing', label: 'Rebalanceig',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6 3 3 0 0 1 0 6"/>
      <path d="M6 21a3 3 0 0 1 0-6h12a3 3 0 0 1 0 6 3 3 0 0 1 0-6"/>
    </svg>,
  },
]

const sbStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  /* ── Overlay (mòbil) ── */
  .sb-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(3px);
    z-index: 29;
    opacity: 0; pointer-events: none;
    transition: opacity 250ms ease;
  }
  .sb-overlay.visible { opacity: 1; pointer-events: all; }

  /* ── Sidebar base ── */
  .sb-v3 {
    font-family: 'Geist', sans-serif;
    position: fixed; top: 0; left: 0; bottom: 0;
    width: 220px;
    background: #0a0a0a;
    border-right: 1px solid rgba(255,255,255,0.07);
    display: flex; flex-direction: column;
    z-index: 30;

    /* Desktop: sempre visible */
    transform: translateX(0);
    transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  /* Mòbil: ocult per defecte, obert quan .drawer-open */
  @media (max-width: 1023px) {
    .sb-v3 { transform: translateX(-100%); }
    .sb-v3.drawer-open { transform: translateX(0); }
  }

  /* ── Logo ── */
  .sb-v3-logo {
    padding: 18px 16px 16px;
    display: flex; align-items: center; gap: 9px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sb-v3-logo-name { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .sb-v3-logo-v {
    font-family: 'Geist Mono', monospace;
    font-size: 9px; color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
    padding: 2px 5px; border-radius: 3px;
  }
  .sb-v3-close {
    margin-left: auto;
    width: 26px; height: 26px; border-radius: 5px;
    background: rgba(255,255,255,0.06); border: none;
    color: rgba(255,255,255,0.40); font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; line-height: 1; font-family: inherit;
    transition: all 100ms;
  }
  .sb-v3-close:hover { background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.70); }
  /* Amaga el close en desktop */
  @media (min-width: 1024px) { .sb-v3-close { display: none; } }

  /* ── Nav ── */
  .sb-v3-nav {
    flex: 1; padding: 8px;
    display: flex; flex-direction: column; gap: 1px;
    overflow-y: auto;
  }

  .sb-v3-group {
    font-size: 10px; font-weight: 400;
    color: rgba(255,255,255,0.20);
    letter-spacing: 0.09em; text-transform: uppercase;
    padding: 10px 8px 4px;
  }

  .sb-v3-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 8px 8px; border-radius: 5px;
    font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,0.42);
    background: transparent; border: none;
    cursor: pointer; width: 100%; text-align: left;
    transition: color 100ms, background 100ms;
    font-family: 'Geist', sans-serif;
    letter-spacing: -0.1px; position: relative;
  }
  .sb-v3-btn:hover {
    color: rgba(255,255,255,0.72);
    background: rgba(255,255,255,0.04);
  }
  .sb-v3-btn.active {
    color: rgba(255,255,255,0.88);
    background: rgba(255,255,255,0.06);
    font-weight: 500;
  }
  .sb-v3-btn.active::before {
    content: '';
    position: absolute; left: 0; top: 22%; height: 56%;
    width: 1.5px; background: rgba(255,255,255,0.45);
    border-radius: 0 1px 1px 0;
  }
  .sb-v3-ico {
    opacity: 0.45; flex-shrink: 0;
    display: flex; align-items: center;
    transition: opacity 100ms;
  }
  .sb-v3-btn:hover .sb-v3-ico,
  .sb-v3-btn.active .sb-v3-ico { opacity: 1; }

  /* ── User ── */
  .sb-v3-foot {
    padding: 8px 8px 14px;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sb-v3-user {
    display: flex; align-items: center; gap: 8px;
    padding: 8px; border-radius: 5px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 3px;
    cursor: default;
  }
  .sb-v3-av {
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.55);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 500; flex-shrink: 0; overflow: hidden;
  }
  .sb-v3-av img { width: 100%; height: 100%; object-fit: cover; }
  .sb-v3-uname { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-v3-uemail { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-v3-logout {
    display: flex; align-items: center; gap: 7px;
    width: 100%; padding: 6px 8px; border-radius: 5px;
    border: none; background: transparent;
    font-family: 'Geist', sans-serif; font-size: 12px;
    color: rgba(255,255,255,0.24); cursor: pointer;
    transition: all 100ms; text-align: left;
  }
  .sb-v3-logout:hover { color: rgba(255,80,60,0.65); background: rgba(255,50,30,0.05); }
`

export default function Sidebar({ active, onChange, user, onLogout, isOpen = false, onClose }) {
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleNav = (id) => {
    onChange(id)
    onClose?.() // Tanca el drawer en mòbil després de navegar
  }

  return (
    <>
      <style>{sbStyles}</style>

      {/* Overlay — només visible en mòbil quan el drawer és obert */}
      <div
        className={`sb-overlay${isOpen ? ' visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sb-v3${isOpen ? ' drawer-open' : ''}`}>
        {/* Logo */}
        <div className="sb-v3-logo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="rgba(255,255,255,0.60)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 7 22 7 22 13" stroke="rgba(255,255,255,0.60)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sb-v3-logo-name">Cartera</span>
          <span className="sb-v3-logo-v">v2</span>
          <button className="sb-v3-close" onClick={onClose}>×</button>
        </div>

        {/* Nav */}
        <nav className="sb-v3-nav">
          <div className="sb-v3-group">Principal</div>
          {NAV_MAIN.map(item => (
            <button
              key={item.id}
              className={`sb-v3-btn${active === item.id ? ' active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="sb-v3-ico">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="sb-v3-group" style={{ marginTop: 6 }}>Anàlisi</div>
          {NAV_ANALYSIS.map(item => (
            <button
              key={item.id}
              className={`sb-v3-btn${active === item.id ? ' active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="sb-v3-ico">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="sb-v3-foot">
            <div className="sb-v3-user">
              <div className="sb-v3-av">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                  : initials
                }
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sb-v3-uname">{user.displayName?.split(' ')[0] || 'Usuari'}</div>
                <div className="sb-v3-uemail">{user.email}</div>
              </div>
            </div>
            <button className="sb-v3-logout" onClick={onLogout}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Tancar sessió
            </button>
          </div>
        )}
      </aside>
    </>
  )
}