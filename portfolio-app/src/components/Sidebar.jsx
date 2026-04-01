// ─── Sidebar.v3.jsx — Cartera v3 ─────────────────────────────────────────────
import { SHARED_STYLES, COLORS, FONTS, RADIUS } from './design-tokens'

const NAV_MAIN = [
  { id:'investments', label:'Inversions', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { id:'savings',     label:'Estalvis',   icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { id:'crypto',      label:'Crypto',     icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 8h5a2 2 0 0 1 0 4H9v4h5a2 2 0 0 0 0-4"/></svg> },
  { id:'movements',   label:'Moviments',  icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { id:'dividends',   label:'Dividends',    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { id:'commodities', label:'Mat. primeres', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c0 0 4 4 4 9s-4 9-4 9"/><path d="M3 12h18"/><path d="M12 3c0 0-4 4-4 9s4 9 4 9"/></svg> },
]
const NAV_ANALYSIS = [
  { id:'timeline',    label:'Evolució',    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M3 15l5-5 4 4 5-7"/></svg> },
  { id:'projections', label:'Projeccions', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { id:'chart',       label:'Distribució', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12V2z"/></svg> },
  { id:'benchmark',   label:'Benchmark',   icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id:'rebalancing', label:'Rebalanceig', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6 3 3 0 0 1 0 6"/><path d="M6 21a3 3 0 0 1 0-6h12a3 3 0 0 1 0 6 3 3 0 0 1 0-6"/></svg> },
]
const NAV_TOOLS = [
  { id:'alerts', label:'Alertes',    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id:'report',  label:'Informe PDF', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
]

const sbStyles = `
  .sb-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.70); z-index:29; opacity:0; pointer-events:none; transition:opacity 200ms; }
  .sb-overlay.on { opacity:1; pointer-events:all; }

  .sb {
    font-family: ${FONTS.sans};
    position: fixed; top:0; left:0; bottom:0;
    width: 220px;
    background: #0d0d0d;
    border-right: 1px solid ${COLORS.border};
    display: flex; flex-direction: column;
    z-index: 30;
    transition: transform 260ms cubic-bezier(0.32,0.72,0,1);
  }
  @media (max-width:1023px) {
    .sb { transform:translateX(-100%); }
    .sb.open { transform:translateX(0); }
  }

  /* Logo */
  .sb-logo {
    padding: 16px 16px 14px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid ${COLORS.border};
    flex-shrink: 0;
  }
  .sb-logo-mark {
    width: 24px; height: 24px;
    border: 1px solid ${COLORS.neonPurple};
    border-radius: ${RADIUS.sm};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sb-logo-name {
    font-size: 14px; font-weight: 500;
    color: ${COLORS.textPrimary};
    letter-spacing: -0.2px;
  }
  .sb-close {
    margin-left: auto; width: 22px; height: 22px;
    background: transparent; border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.sm};
    color: ${COLORS.textMuted}; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-family: inherit; transition: all 100ms;
  }
  .sb-close:hover { color: ${COLORS.textPrimary}; border-color: ${COLORS.borderHi}; }
  @media (min-width:1024px) { .sb-close { display:none; } }

  /* Nav */
  .sb-nav { flex:1; padding:10px 8px; overflow-y:auto; display:flex; flex-direction:column; gap:1px; }

  .sb-group {
    font-size: 10px; font-weight: 500;
    color: ${COLORS.textMuted};
    text-transform: uppercase; letter-spacing: 0.14em;
    padding: 10px 8px 4px;
  }

  .sb-sep { height:1px; background:${COLORS.border}; margin:4px 0; }

  .sb-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 8px 7px 6px;
    border-radius: ${RADIUS.md};
    font-size: 13px; font-weight: 400;
    color: ${COLORS.textMuted};
    background: transparent; border: none;
    cursor: pointer; width: 100%; text-align: left;
    transition: color 100ms, background 100ms;
    font-family: ${FONTS.sans};
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .sb-btn:hover { color: ${COLORS.textSecondary}; background: ${COLORS.elevated}; }
  .sb-btn.active {
    color: ${COLORS.textPrimary};
    background: ${COLORS.elevated};
    border-left: 2px solid ${COLORS.neonPurple};
    padding-left: 4px;
  }
  .sb-btn-ico { flex-shrink:0; opacity:0.35; display:flex; align-items:center; transition:opacity 100ms; }
  .sb-btn:hover .sb-btn-ico { opacity:0.70; }
  .sb-btn.active .sb-btn-ico { opacity:1; color:${COLORS.neonPurple}; }

  /* Badge alertes */
  .sb-badge {
    margin-left: auto;
    min-width: 16px; height: 16px;
    border-radius: 2px;
    background: ${COLORS.bgAmber};
    border: 1px solid ${COLORS.borderAmber};
    color: ${COLORS.neonAmber};
    font-size: 9px; font-weight: 500;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
    font-family: ${FONTS.mono};
  }

  /* Footer */
  .sb-foot {
    padding: 8px 8px 14px;
    border-top: 1px solid ${COLORS.border};
    flex-shrink: 0;
  }
  .sb-user {
    display: flex; align-items: center; gap: 8px;
    padding: 8px;
    border-radius: ${RADIUS.md};
    background: ${COLORS.elevated};
    border: 1px solid ${COLORS.border};
    margin-bottom: 4px;
    cursor: default;
  }
  .sb-av {
    width: 24px; height: 24px; border-radius: 50%;
    background: ${COLORS.bgPurple};
    border: 1px solid ${COLORS.borderPurple};
    color: ${COLORS.neonPurple};
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 600;
    flex-shrink: 0; overflow: hidden;
    font-family: ${FONTS.mono};
  }
  .sb-av img { width:100%; height:100%; object-fit:cover; }
  .sb-uname { font-size:12px; font-weight:500; color:${COLORS.textSecondary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-uemail { font-size:10px; color:${COLORS.textMuted}; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:${FONTS.mono}; }
  .sb-logout {
    display: flex; align-items: center; gap: 7px;
    width: 100%; padding: 6px 8px;
    border-radius: ${RADIUS.md}; border: none;
    background: transparent;
    font-family: ${FONTS.sans}; font-size: 12px;
    color: ${COLORS.textMuted};
    cursor: pointer; transition: all 100ms; text-align: left;
  }
  .sb-logout:hover { color: ${COLORS.neonRed}; background: rgba(255,59,59,0.05); }
`

export default function Sidebar({ active, onChange, user, onLogout, isOpen=false, onClose, activeAlertsCount=0 }) {
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
    : '?'

  const handleNav = id => { onChange(id); onClose?.() }

  const NavBtn = ({ item }) => (
    <button className={`sb-btn${active===item.id?' active':''}`} onClick={()=>handleNav(item.id)}>
      <span className="sb-btn-ico">{item.icon}</span>
      {item.label}
      {item.id==='alerts' && activeAlertsCount>0 && (
        <span className="sb-badge">{activeAlertsCount>9?'9+':activeAlertsCount}</span>
      )}
    </button>
  )

  return (
    <>
      <style>{`${SHARED_STYLES}${sbStyles}`}</style>
      <div className={`sb-overlay${isOpen?' on':''}`} onClick={onClose} />
      <aside className={`sb${isOpen?' open':''}`}>

        <div className="sb-logo">
          <div className="sb-logo-mark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonPurple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span className="sb-logo-name">Cartera</span>
          <button className="sb-close" onClick={onClose}>×</button>
        </div>

        <nav className="sb-nav">
          <div className="sb-group">Principal</div>
          {NAV_MAIN.map(item => <NavBtn key={item.id} item={item} />)}

          <div className="sb-sep" style={{marginTop:8}} />
          <div className="sb-group">Anàlisi</div>
          {NAV_ANALYSIS.map(item => <NavBtn key={item.id} item={item} />)}

          <div className="sb-sep" style={{marginTop:8}} />
          <div className="sb-group">Eines</div>
          {NAV_TOOLS.map(item => <NavBtn key={item.id} item={item} />)}
        </nav>

        {user && (
          <div className="sb-foot">
            <div className="sb-user">
              <div className="sb-av">
                {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : initials}
              </div>
              <div style={{minWidth:0,flex:1}}>
                <div className="sb-uname">{user.displayName?.split(' ')[0] || 'Usuari'}</div>
                <div className="sb-uemail">{user.email}</div>
              </div>
            </div>
            <button className="sb-logout" onClick={onLogout}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Tancar sessió
            </button>
          </div>
        )}
      </aside>
    </>
  )
}