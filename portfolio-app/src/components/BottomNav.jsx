// ─── components/BottomNav.jsx ─────────────────────────────────────────────────
import { useState } from 'react'
import { COLORS, FONTS } from './design-tokens'

const IcoHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IcoPortfolio = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
)
const IcoChart = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IcoDividend = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IcoMore = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
  </svg>
)

export const TAB_MAP = {
  home:      ['dashboard'],
  portfolio: ['investments', 'savings', 'crypto', 'commodities'],
  analysis:  ['chart', 'benchmark', 'projections', 'rebalancing', 'timeline'],
  dividends: ['dividends'],
  more:      ['movements', 'goals', 'news', 'alerts', 'report'],
}

export function pageToTab(page) {
  for (const [tab, pages] of Object.entries(TAB_MAP)) {
    if (pages.includes(page)) return tab
  }
  return 'home'
}

const TABS = [
  { id:'home',      label:'Inici',     Icon:IcoHome      },
  { id:'portfolio', label:'Cartera',   Icon:IcoPortfolio },
  { id:'analysis',  label:'Anàlisi',   Icon:IcoChart     },
  { id:'dividends', label:'Dividends', Icon:IcoDividend  },
  { id:'more',      label:'Més',       Icon:IcoMore      },
]

const PORTFOLIO_ITEMS = [
  { page:'investments', label:'Inversions',    emoji:'📈' },
  { page:'savings',     label:'Estalvis',      emoji:'🏦' },
  { page:'crypto',      label:'Crypto',        emoji:'🔶' },
  { page:'commodities', label:'Mat. primeres', emoji:'🥇' },
]
const ANALYSIS_ITEMS = [
  { page:'chart',       label:'Distribució',   emoji:'🥧' },
  { page:'projections', label:'Projeccions',   emoji:'📊' },
  { page:'timeline',    label:'Evolució',      emoji:'📈' },
  { page:'benchmark',   label:'Benchmark',     emoji:'⚡' },
  { page:'rebalancing', label:'Rebalanceig',   emoji:'⚖️' },
]
const MORE_ITEMS = [
  { page:'dividends',   label:'Dividends',     emoji:'💰' },
  { page:'movements',   label:'Moviments',     emoji:'📋' },
  { page:'goals',       label:'Objectius',     emoji:'🎯' },
  { page:'news',        label:'Notícies',      emoji:'📰' },
  { page:'alerts',      label:'Alertes',       emoji:'🔔' },
  { page:'report',      label:'Informe PDF',   emoji:'📄' },
]

const styles = `
  .bnav {
    position: fixed; bottom: 12px; left: 8px; right: 8px; z-index: 50;
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex; align-items: stretch;
    height: 64px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15);
    transition: background-color 220ms ease, border-color 220ms ease;
  }
  @media (min-width: 1024px) { .bnav { display: none; } }

  .bnav-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; border: none; background: transparent; cursor: pointer;
    padding: 8px 4px; position: relative; border-radius: 16px;
    -webkit-tap-highlight-color: transparent;
    transition: background 120ms;
    margin: 4px 2px;
  }
  .bnav-tab:active { background: var(--c-border); }
  .bnav-tab.active { background: var(--c-bg-green); }

  .bnav-tab-label {
    font-family: ${FONTS.sans};
    font-size: 9px; font-weight: 500; letter-spacing: 0.02em;
    transition: color 150ms; line-height: 1;
  }
  .bnav-tab.active .bnav-tab-label      { color: ${COLORS.neonGreen}; font-weight: 600; }
  .bnav-tab:not(.active) .bnav-tab-label { color: var(--c-text-muted); }
  .bnav-tab.active svg                   { color: ${COLORS.neonGreen}; }
  .bnav-tab:not(.active) svg             { color: var(--c-text-muted); }

  /* Badge */
  .bnav-badge {
    position: absolute; top: 4px; right: calc(50% - 16px);
    min-width: 14px; height: 14px; border-radius: 7px;
    background: ${COLORS.neonRed}; color: #fff;
    font-size: 8px; font-weight: 700; font-family: ${FONTS.mono};
    display: flex; align-items: center; justify-content: center; padding: 0 3px;
  }
`

const drawerStyles = `
  .bnav-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.55);
    z-index: 48; backdrop-filter: blur(6px);
    animation: bnFadeIn 150ms ease;
  }
  @keyframes bnFadeIn { from { opacity:0 } to { opacity:1 } }

  .bnav-drawer {
    position: fixed; bottom: 90px; left: 8px; right: 8px; z-index: 49;
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    border-radius: 18px;
    padding: 16px 12px 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.30);
    animation: bnSlideUp 220ms cubic-bezier(0.34,1.2,0.64,1);
    transition: background-color 220ms ease, border-color 220ms ease;
  }
  @keyframes bnSlideUp { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }

  .bnav-drawer-title {
    font-family: ${FONTS.sans}; font-size: 10px; font-weight: 600;
    color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.14em;
    margin-bottom: 12px; padding: 0 4px;
  }
  .bnav-drawer-grid { display: grid; gap: 4px; }
  .bnav-drawer-grid.col2 { grid-template-columns: 1fr 1fr; }
  .bnav-drawer-grid.col3 { grid-template-columns: 1fr 1fr 1fr; }

  .bnav-drawer-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 12px; border-radius: 10px;
    border: 1px solid var(--c-border);
    background: var(--c-elevated);
    cursor: pointer; -webkit-tap-highlight-color: transparent;
    transition: background 100ms; text-align: left;
  }
  .bnav-drawer-item:active { background: var(--c-border); }
  .bnav-drawer-item.active-page { background: var(--c-bg-green); border-color: var(--c-border-green); }

  .bnav-drawer-emoji { font-size: 18px; flex-shrink: 0; width: 22px; text-align: center; }
  .bnav-drawer-label {
    font-family: ${FONTS.sans}; font-size: 13px; font-weight: 500;
    color: var(--c-text-secondary);
  }
  .bnav-drawer-item.active-page .bnav-drawer-label { color: ${COLORS.neonGreen}; }
`

function Drawer({ title, items, activePage, onNavigate, onClose, cols=2 }) {
  return (
    <>
      <div className="bnav-overlay" onClick={onClose}/>
      <div className="bnav-drawer">
        {title && <p className="bnav-drawer-title">{title}</p>}
        <div className={`bnav-drawer-grid col${cols}`}>
          {items.map(item => (
            <button
              key={item.page}
              className={`bnav-drawer-item${activePage === item.page ? ' active-page' : ''}`}
              onClick={() => { onNavigate(item.page); onClose() }}
            >
              <span className="bnav-drawer-emoji">{item.emoji}</span>
              <span className="bnav-drawer-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function BottomNav({ activePage, onNavigate, alertsCount = 0 }) {
  const [openDrawer, setOpenDrawer] = useState(null)
  const activeTab = pageToTab(activePage)

  const handleTab = (tabId) => {
    if (openDrawer === tabId) { setOpenDrawer(null); return }
    if (tabId === 'home') { setOpenDrawer(null); onNavigate('dashboard'); return }
    if (tabId === 'dividends') { setOpenDrawer(null); onNavigate('dividends'); return }
    setOpenDrawer(tabId)
  }

  const closeDrawer = () => setOpenDrawer(null)

  return (
    <>
      <style>{`${styles}${drawerStyles}`}</style>

      {openDrawer === 'portfolio' && (
        <Drawer title="Cartera" items={PORTFOLIO_ITEMS} activePage={activePage} onNavigate={onNavigate} onClose={closeDrawer} cols={2}/>
      )}
      {openDrawer === 'analysis' && (
        <Drawer title="Anàlisi" items={ANALYSIS_ITEMS} activePage={activePage} onNavigate={onNavigate} onClose={closeDrawer} cols={2}/>
      )}
      {openDrawer === 'more' && (
        <Drawer title="Més opcions" items={MORE_ITEMS} activePage={activePage} onNavigate={onNavigate} onClose={closeDrawer} cols={2}/>
      )}

      <nav className="bnav">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id || openDrawer === id
          const hasAlerts = id === 'more' && alertsCount > 0
          return (
            <button
              key={id}
              className={`bnav-tab${isActive ? ' active' : ''}`}
              onClick={() => handleTab(id)}
            >
              <Icon active={isActive}/>
              <span className="bnav-tab-label">{label}</span>
              {hasAlerts && <span className="bnav-badge">{alertsCount}</span>}
            </button>
          )
        })}
      </nav>
    </>
  )
}