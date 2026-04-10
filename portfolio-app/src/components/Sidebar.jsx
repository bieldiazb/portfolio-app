// ─── components/Sidebar.v4.jsx ────────────────────────────────────────────────
import { useState } from 'react'
import { COLORS, FONTS } from './design-tokens'

const styles = `
  .sb4 {
    position: fixed; top: 0; left: 0; bottom: 0; width: 220px;
    background: #0a0a0a; border-right: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column; z-index: 30;
    transition: transform 200ms cubic-bezier(0.4,0,0.2,1);
    font-family: ${FONTS.sans};
  }
  @media (max-width:1023px) {
    .sb4 { transform: translateX(-100%); }
    .sb4.open { transform: translateX(0); box-shadow: 20px 0 60px rgba(0,0,0,0.8); }
  }

  .sb4-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    z-index: 29; display: none;
    backdrop-filter: blur(4px);
  }
  @media (max-width:1023px) { .sb4-overlay.show { display: block; } }

  .sb4-logo {
    padding: 20px 16px 16px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sb4-logo-mark {
    width: 28px; height: 28px; border-radius: 7px;
    background: #fff; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sb4-logo-text { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.3px; }
  .sb4-logo-sub  { font-size: 10px; color: rgba(255,255,255,0.30); font-weight: 400; display:block; }

  .sb4-nav { flex: 1; overflow-y: auto; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  .sb4-nav::-webkit-scrollbar { display: none; }

  .sb4-group { margin-bottom: 6px; }
  .sb4-group-label {
    font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.20);
    text-transform: uppercase; letter-spacing: 0.14em;
    padding: 6px 8px 4px; display: block;
  }

  .sb4-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 7px;
    border: none; background: transparent; width: 100%;
    cursor: pointer; text-align: left;
    transition: background 80ms;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  .sb4-item:hover { background: rgba(255,255,255,0.05); }
  .sb4-item.active { background: rgba(255,255,255,0.07); }
  .sb4-item-ico { color: rgba(255,255,255,0.35); flex-shrink:0; transition: color 100ms; display:flex; }
  .sb4-item.active .sb4-item-ico { color: ${COLORS.neonPurple}; }
  .sb4-item:hover .sb4-item-ico { color: rgba(255,255,255,0.60); }
  .sb4-item-label { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.55); transition: color 100ms; }
  .sb4-item.active .sb4-item-label { color: #fff; font-weight: 600; }
  .sb4-item:hover .sb4-item-label { color: rgba(255,255,255,0.80); }
  .sb4-item-bar {
    position: absolute; left: 0; top: 25%; bottom: 25%;
    width: 2px; border-radius: 0 2px 2px 0;
    background: ${COLORS.neonPurple}; opacity: 0; transition: opacity 100ms;
  }
  .sb4-item.active .sb4-item-bar { opacity: 1; }

  .sb4-badge {
    margin-left: auto; min-width: 16px; height: 16px;
    border-radius: 8px; background: ${COLORS.neonRed};
    color: #fff; font-size: 9px; font-weight: 700;
    font-family: ${FONTS.mono}; display: flex;
    align-items: center; justify-content: center; padding: 0 4px;
  }

  /* Peu — FIX mòbil: padding extra per no quedar tapat pel BottomNav */
  .sb4-footer {
    padding: 12px 10px;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  @media (max-width:1023px) {
    .sb4-footer {
      padding-bottom: calc(12px + 60px + env(safe-area-inset-bottom));
    }
  }

  .sb4-user {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 7px; cursor: pointer;
    transition: background 80ms; border:none; background:transparent; width:100%;
  }
  .sb4-user:hover { background: rgba(255,255,255,0.05); }
  .sb4-user-av {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.5); display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 500; overflow:hidden; flex-shrink:0;
  }
  .sb4-user-av img { width:100%; height:100%; object-fit:cover; }
  .sb4-user-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.60); }
  .sb4-user-role { font-size: 10px; color: rgba(255,255,255,0.25); }
  .sb4-logout {
    display:flex; align-items:center; gap:6px; padding: 8px 10px;
    border-radius: 6px; border: none; background: transparent;
    width: 100%; cursor: pointer; margin-top: 4px;
    transition: background 80ms; color: rgba(255,255,255,0.25);
    font-family: ${FONTS.sans}; font-size: 12px;
  }
  .sb4-logout:hover { background: rgba(255,59,59,0.08); color: ${COLORS.neonRed}; }
`

const I = {
  home:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  inv:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  sav:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  crypto:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5h3a1.5 1.5 0 0 1 0 3h-3v3h4a1.5 1.5 0 0 0 0-3"/><line x1="9.5" y1="8" x2="9.5" y2="16"/></svg>,
  com:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg>,
  div:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  chart:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10H12V2z"/><circle cx="12" cy="12" r="10"/></svg>,
  bench:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  proj:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  move:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  goal:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  news:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M18 18h-8M18 10h-8"/></svg>,
  alert:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  reb:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  rep:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  logout:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard',   label: 'Inici',        icon: I.home   },
      { id: 'investments', label: 'Inversions',    icon: I.inv    },
      { id: 'savings',     label: 'Estalvis',      icon: I.sav    },
      { id: 'crypto',      label: 'Crypto',        icon: I.crypto },
      { id: 'commodities', label: 'Mat. primeres', icon: I.com    },
      { id: 'dividends',   label: 'Dividends',     icon: I.div    },
    ],
  },
  {
    label: 'Anàlisi',
    items: [
      { id: 'chart',       label: 'Distribució',   icon: I.chart  },
      { id: 'benchmark',   label: 'Benchmark',     icon: I.bench  },
      { id: 'projections', label: 'Projeccions',   icon: I.proj   },
      { id: 'timeline',    label: 'Evolució',      icon: I.move   },
    ],
  },
  {
    label: 'Eines',
    items: [
      { id: 'goals',       label: 'Objectius',     icon: I.goal   },
      { id: 'news',        label: 'Notícies',      icon: I.news   },
      { id: 'movements',   label: 'Moviments',     icon: I.move   },
      { id: 'rebalancing', label: 'Rebalanceig',   icon: I.reb    },
      { id: 'alerts',      label: 'Alertes',       icon: I.alert, badge: true },
      { id: 'report',      label: 'Informe PDF',   icon: I.rep    },
    ],
  },
]

export default function Sidebar({ active, onChange, user, onLogout, isOpen, onClose, activeAlertsCount = 0 }) {
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <style>{styles}</style>
      <div className={`sb4-overlay${isOpen ? ' show' : ''}`} onClick={onClose}/>

      <aside className={`sb4${isOpen ? ' open' : ''}`}>
        <div className="sb4-logo">
          <div className="sb4-logo-mark">
            <img src="/logo_black.png" alt="Cartera" style={{ width: 20, height: 20 }}/>
          </div>
          <div>
            <span className="sb4-logo-text">Cartera</span>
            <span className="sb4-logo-sub">Gestor financer</span>
          </div>
        </div>

        <nav className="sb4-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="sb4-group">
              <span className="sb4-group-label">{group.label}</span>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`sb4-item${active === item.id ? ' active' : ''}`}
                  onClick={() => { onChange(item.id); onClose?.() }}
                >
                  <div className="sb4-item-bar"/>
                  <span className="sb4-item-ico">{item.icon}</span>
                  <span className="sb4-item-label">{item.label}</span>
                  {item.badge && activeAlertsCount > 0 && (
                    <span className="sb4-badge">{activeAlertsCount}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sb4-footer">
          <div className="sb4-user">
            <div className="sb4-user-av">
              {user?.photoURL
                ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer"/>
                : initials
              }
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <p className="sb4-user-name">{user?.displayName || user?.email?.split('@')[0] || 'Usuari'}</p>
              <p className="sb4-user-role">Compte personal</p>
            </div>
          </div>
          <button className="sb4-logout" onClick={onLogout}>
            {I.logout} Tancar sessió
          </button>
        </div>
      </aside>
    </>
  )
}