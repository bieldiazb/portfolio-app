const NAV_MAIN = [
  { id: 'investments', label: 'Inversions',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { id: 'savings',     label: 'Estalvis',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { id: 'crypto',      label: 'Crypto',      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 8h5a2 2 0 0 1 0 4H9v4h5a2 2 0 0 0 0-4"/></svg> },
]
const NAV_ANALYSIS = [
  { id: 'projections', label: 'Projeccions', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { id: 'chart',       label: 'Distribució', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12V2z"/></svg> },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  .sb {
    font-family: 'Geist', sans-serif;
    position: fixed; left: 0; top: 0;
    width: 200px; height: 100vh;
    background: #080808;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
    z-index: 20;
  }

  .sb-logo {
    padding: 18px 16px 16px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sb-logo-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sb-logo-name { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.88); letter-spacing: -0.3px; }
  .sb-logo-v {
    margin-left: auto;
    font-family: 'Geist Mono', monospace;
    font-size: 9px; color: rgba(255,255,255,0.18);
    letter-spacing: 0.06em;
    background: rgba(255,255,255,0.04);
    padding: 2px 5px; border-radius: 3px;
  }

  .sb-nav {
    flex: 1; padding: 8px;
    display: flex; flex-direction: column; gap: 1px;
    overflow-y: auto;
  }

  .sb-group {
    font-size: 10px; font-weight: 400;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.09em; text-transform: uppercase;
    padding: 10px 8px 4px;
  }

  .sb-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 8px; border-radius: 5px;
    font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,0.4);
    background: transparent; border: none;
    cursor: pointer; width: 100%; text-align: left;
    transition: color 100ms, background 100ms;
    font-family: 'Geist', sans-serif;
    letter-spacing: -0.1px; position: relative;
  }
  .sb-btn:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.04);
  }
  .sb-btn.active {
    color: rgba(255,255,255,0.88);
    background: rgba(255,255,255,0.06);
    font-weight: 500;
  }
  .sb-btn.active::before {
    content: '';
    position: absolute; left: 0; top: 22%; height: 56%;
    width: 1.5px; background: rgba(255,255,255,0.45);
    border-radius: 0 1px 1px 0;
  }
  .sb-ico {
    opacity: 0.45; flex-shrink: 0;
    display: flex; align-items: center;
    transition: opacity 100ms;
  }
  .sb-btn:hover .sb-ico,
  .sb-btn.active .sb-ico { opacity: 1; }

  .sb-foot {
    padding: 8px 8px 12px;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sb-user {
    display: flex; align-items: center; gap: 8px;
    padding: 8px; border-radius: 5px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 3px; cursor: default;
    transition: background 100ms;
  }
  .sb-user:hover { background: rgba(255,255,255,0.05); }
  .sb-av {
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.55);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 500; flex-shrink: 0; overflow: hidden;
  }
  .sb-av img { width: 100%; height: 100%; object-fit: cover; }
  .sb-uname { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.68); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-uemail { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .sb-logout {
    display: flex; align-items: center; gap: 7px;
    width: 100%; padding: 6px 8px; border-radius: 5px;
    border: none; background: transparent;
    font-family: 'Geist', sans-serif; font-size: 12px;
    color: rgba(255,255,255,0.24); cursor: pointer;
    transition: all 100ms; text-align: left;
  }
  .sb-logout:hover {
    color: rgba(255,80,60,0.65);
    background: rgba(255,50,30,0.05);
  }
`

export default function Sidebar({ active = 'investments', onChange = () => {}, user = null, onLogout = () => {} }) {
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <style>{styles}</style>
      <aside className="sb">
        {/* Logo */}
        <div className="sb-logo">
          <span className="sb-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="sb-logo-name">Cartera</span>
          <span className="sb-logo-v">v2</span>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <div className="sb-group">Principal</div>
          {NAV_MAIN.map(item => (
            <button key={item.id} className={`sb-btn${active === item.id ? ' active' : ''}`} onClick={() => onChange(item.id)}>
              <span className="sb-ico">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="sb-group" style={{ marginTop: 8 }}>Anàlisi</div>
          {NAV_ANALYSIS.map(item => (
            <button key={item.id} className={`sb-btn${active === item.id ? ' active' : ''}`} onClick={() => onChange(item.id)}>
              <span className="sb-ico">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="sb-foot">
            <div className="sb-user">
              <div className="sb-av">
                {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="sb-uname">{user.displayName?.split(' ')[0] || 'Usuari'}</div>
                <div className="sb-uemail">{user.email}</div>
              </div>
            </div>
            <button className="sb-logout" onClick={onLogout}>
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