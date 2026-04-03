// ─── components/BottomNav.jsx ─────────────────────────────────────────────────
// Bottom navigation bar per a mòbil (visible només <1024px)
// 5 tabs: Inici · Cartera · Anàlisi · Dividends · Més
import { useState } from 'react'
import { COLORS, FONTS } from './design-tokens'

// Icones inline — sense dependències extra
const IcoHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IcoPortfolio = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
)
const IcoChart = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IcoDividend = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoMore = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
)

// Mapa de tab → pàgines que pertanyen a aquell tab
export const TAB_MAP = {
  home:      ['dashboard'],
  portfolio: ['investments', 'savings', 'crypto', 'commodities'],
  analysis:  ['chart', 'benchmark', 'projections', 'rebalancing', 'timeline'],
  dividends: ['dividends'],
  more:      ['movements', 'goals', 'news', 'alerts', 'report'],
}

// Retorna quin tab és actiu donada la pàgina activa
export function pageToTab(page) {
  for (const [tab, pages] of Object.entries(TAB_MAP)) {
    if (pages.includes(page)) return tab
  }
  return 'home'
}

const TABS = [
  { id: 'home',      label: 'Inici',    Icon: IcoHome },
  { id: 'portfolio', label: 'Cartera',  Icon: IcoPortfolio },
  { id: 'analysis',  label: 'Anàlisi',  Icon: IcoChart },
  { id: 'dividends', label: 'Dividends',Icon: IcoDividend },
  { id: 'more',      label: 'Més',      Icon: IcoMore },
]

const styles = `
  .bnav {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: rgba(10,10,10,0.96);
    border-top: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex; align-items: stretch;
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(60px + env(safe-area-inset-bottom));
  }
  @media (min-width: 1024px) { .bnav { display: none; } }

  .bnav-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; border: none; background: transparent; cursor: pointer;
    padding: 8px 4px 4px; position: relative;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 80ms;
  }
  .bnav-tab:active { opacity: 0.7; }

  .bnav-tab-label {
    font-family: ${FONTS.sans};
    font-size: 9px; font-weight: 500;
    letter-spacing: 0.02em;
    transition: color 150ms;
  }
  .bnav-tab.active .bnav-tab-label { color: #fff; font-weight: 600; }
  .bnav-tab:not(.active) .bnav-tab-label { color: rgba(255,255,255,0.35); }
  .bnav-tab.active svg { color: #fff; }
  .bnav-tab:not(.active) svg { color: rgba(255,255,255,0.35); }

  /* Indicador actiu */
  .bnav-dot {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 20px; height: 2px; border-radius: 0 0 2px 2px;
    background: ${COLORS.neonPurple};
    transition: opacity 150ms;
  }
  .bnav-tab:not(.active) .bnav-dot { opacity: 0; }

  /* Badge alertes */
  .bnav-badge {
    position: absolute; top: 6px; right: calc(50% - 14px);
    min-width: 14px; height: 14px; border-radius: 7px;
    background: ${COLORS.neonRed}; color: #fff;
    font-size: 8px; font-weight: 700; font-family: ${FONTS.mono};
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
  }
`

// Drawer "Més" — apareix quan cliques el tab Més
const MORE_ITEMS = [
  { page: 'movements', label: 'Moviments',   emoji: '📋' },
  { page: 'goals',     label: 'Objectius',   emoji: '🎯' },
  { page: 'news',      label: 'Notícies',    emoji: '📰' },
  { page: 'alerts',    label: 'Alertes',     emoji: '🔔' },
  { page: 'rebalancing',label:'Rebalanceig', emoji: '⚖️' },
  { page: 'report',    label: 'Informe PDF', emoji: '📄' },
]

const drawerStyles = `
  .bnav-drawer-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 49; backdrop-filter: blur(4px);
    animation: drawerFadeIn 150ms ease;
  }
  @keyframes drawerFadeIn { from { opacity:0 } to { opacity:1 } }

  .bnav-drawer {
    position: fixed; bottom: calc(60px + env(safe-area-inset-bottom));
    left: 0; right: 0; z-index: 49;
    background: #111; border-top: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px 16px 0 0;
    padding: 16px 0 8px;
    animation: drawerSlideUp 200ms cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes drawerSlideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }

  .bnav-drawer-handle {
    width: 32px; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.12); margin: 0 auto 16px;
  }
  .bnav-drawer-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
    padding: 0 8px;
  }
  .bnav-drawer-item {
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; padding: 14px 8px; border-radius: 10px;
    border: none; background: transparent; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 100ms;
  }
  .bnav-drawer-item:active { background: rgba(255,255,255,0.06); }
  .bnav-drawer-emoji { font-size: 22px; }
  .bnav-drawer-label {
    font-family: ${FONTS.sans}; font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.65); text-align: center;
  }
`

export default function BottomNav({ activePage, onNavigate, alertsCount = 0 }) {
  const [showMore, setShowMore] = useState(false)
  const activeTab = pageToTab(activePage)

  const handleTab = (tabId) => {
    if (tabId === 'more') {
      setShowMore(v => !v)
      return
    }
    setShowMore(false)
    // Navega a la primera pàgina del tab
    const firstPage = TAB_MAP[tabId][0]
    onNavigate(firstPage)
  }

  const handleMoreItem = (page) => {
    setShowMore(false)
    onNavigate(page)
  }

  return (
    <>
      <style>{`${styles}${drawerStyles}`}</style>

      {showMore && (
        <>
          <div className="bnav-drawer-overlay" onClick={() => setShowMore(false)}/>
          <div className="bnav-drawer">
            <div className="bnav-drawer-handle"/>
            <div className="bnav-drawer-grid">
              {MORE_ITEMS.map(item => (
                <button key={item.page} className="bnav-drawer-item" onClick={() => handleMoreItem(item.page)}>
                  <span className="bnav-drawer-emoji">{item.emoji}</span>
                  <span className="bnav-drawer-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="bnav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`bnav-tab${activeTab === id || (id === 'more' && showMore) ? ' active' : ''}`}
            onClick={() => handleTab(id)}
          >
            <div className="bnav-dot"/>
            <Icon active={activeTab === id || (id === 'more' && showMore)} />
            <span className="bnav-tab-label">{label}</span>
            {id === 'more' && alertsCount > 0 && (
              <span className="bnav-badge">{alertsCount}</span>
            )}
          </button>
        ))}
      </nav>
    </>
  )
}