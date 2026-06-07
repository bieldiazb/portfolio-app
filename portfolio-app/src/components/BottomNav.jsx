// components/BottomNav.jsx — Robinhood-style
import { useState } from 'react'
import { COLORS, FONTS } from './design-tokens'

const IcoHome      = ({ active }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoPortfolio = ({ active }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
const IcoChart     = ({ active }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
const IcoDividend  = ({ active }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IcoMore      = ({ active }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>

export const TAB_MAP = {
  home:      ['dashboard'],
  portfolio: ['investments','savings','crypto','commodities'],
  analysis:  ['chart','benchmark','projections','rebalancing','timeline'],
  dividends: ['dividends'],
  more:      ['movements','goals','news','alerts','report'],
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
  { page:'movements',   label:'Moviments',     emoji:'📋' },
  { page:'goals',       label:'Objectius',     emoji:'🎯' },
  { page:'news',        label:'Notícies',      emoji:'📰' },
  { page:'alerts',      label:'Alertes',       emoji:'🔔' },
  { page:'report',      label:'Informe PDF',   emoji:'📄' },
]

const styles = `
  .bnav {
    position:fixed; bottom:12px; left:8px; right:8px; z-index:50;
    background:var(--c-bg);
    border:1px solid var(--c-border);
    border-radius:22px;
    display:flex; align-items:stretch; height:62px;
    transition:background-color 220ms ease, border-color 220ms ease;
  }
  @media (min-width:1024px) { .bnav { display:none; } }

  .bnav-tab {
    flex:1; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    gap:3px; border:none; background:transparent;
    cursor:pointer; padding:6px 4px;
    border-radius:18px; margin:4px 3px;
    -webkit-tap-highlight-color:transparent;
    transition:background 120ms; position:relative;
  }
  .bnav-tab:active { opacity:0.7; }
  .bnav-tab.active { background:var(--c-bg-green); }

  .bnav-tab-label {
    font-family:${FONTS.sans};
    font-size:9px; font-weight:500; letter-spacing:0.02em; line-height:1;
    color:var(--c-text-muted);
    transition:color 150ms;
  }
  .bnav-tab.active .bnav-tab-label { color:${COLORS.neonGreen}; font-weight:600; }
  .bnav-tab.active svg              { color:${COLORS.neonGreen}; }
  .bnav-tab:not(.active) svg        { color:var(--c-text-muted); }

  .bnav-dot {
    position:absolute; top:5px; right:calc(50% - 14px);
    width:6px; height:6px; border-radius:50%;
    background:${COLORS.neonRed};
    border:1.5px solid var(--c-bg);
  }
`

const drawerStyles = `
  .bnd-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    z-index:48; backdrop-filter:blur(6px);
    animation:bndFade 150ms ease;
  }
  @keyframes bndFade { from{opacity:0} to{opacity:1} }

  .bnd {
    position:fixed; bottom:86px; left:8px; right:8px; z-index:49;
    background:var(--c-bg);
    border:1px solid var(--c-border);
    border-radius:18px;
    padding:16px 12px 14px;
    animation:bndUp 220ms cubic-bezier(0.34,1.2,0.64,1);
    transition:background-color 220ms ease, border-color 220ms ease;
  }
  @keyframes bndUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }

  .bnd-title {
    font-family:${FONTS.sans}; font-size:10px; font-weight:600;
    color:var(--c-text-muted); text-transform:uppercase;
    letter-spacing:0.14em; margin-bottom:12px; padding:0 2px;
  }
  .bnd-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .bnd-item {
    display:flex; align-items:center; gap:10px;
    padding:12px 12px; border-radius:12px;
    border:1px solid var(--c-border);
    background:var(--c-elevated);
    cursor:pointer; -webkit-tap-highlight-color:transparent;
    transition:background 100ms;
  }
  .bnd-item:active { opacity:0.7; }
  .bnd-item.active-page { background:var(--c-bg-green); border-color:var(--c-border-green); }
  .bnd-emoji { font-size:18px; flex-shrink:0; width:22px; text-align:center; }
  .bnd-label {
    font-family:${FONTS.sans}; font-size:13px; font-weight:500;
    color:var(--c-text-secondary);
  }
  .bnd-item.active-page .bnd-label { color:${COLORS.neonGreen}; }
`

function Drawer({ title, items, activePage, onNavigate, onClose }) {
  return (
    <>
      <div className="bnd-overlay" onClick={onClose}/>
      <div className="bnd">
        {title && <p className="bnd-title">{title}</p>}
        <div className="bnd-grid">
          {items.map(item => (
            <button
              key={item.page}
              className={`bnd-item${activePage===item.page?' active-page':''}`}
              onClick={() => { onNavigate(item.page); onClose() }}
            >
              <span className="bnd-emoji">{item.emoji}</span>
              <span className="bnd-label">{item.label}</span>
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

  const handleTab = tabId => {
    if (openDrawer === tabId) { setOpenDrawer(null); return }
    if (tabId === 'home')      { setOpenDrawer(null); onNavigate('dashboard'); return }
    if (tabId === 'dividends') { setOpenDrawer(null); onNavigate('dividends'); return }
    setOpenDrawer(tabId)
  }

  return (
    <>
      <style>{`${styles}${drawerStyles}`}</style>

      {openDrawer === 'portfolio' && (
        <Drawer title="Cartera" items={PORTFOLIO_ITEMS} activePage={activePage}
          onNavigate={onNavigate} onClose={() => setOpenDrawer(null)}/>
      )}
      {openDrawer === 'analysis' && (
        <Drawer title="Anàlisi" items={ANALYSIS_ITEMS} activePage={activePage}
          onNavigate={onNavigate} onClose={() => setOpenDrawer(null)}/>
      )}
      {openDrawer === 'more' && (
        <Drawer title="Més opcions" items={MORE_ITEMS} activePage={activePage}
          onNavigate={onNavigate} onClose={() => setOpenDrawer(null)}/>
      )}

      <nav className="bnav">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id || openDrawer === id
          const hasDot   = id === 'more' && alertsCount > 0
          return (
            <button
              key={id}
              className={`bnav-tab${isActive?' active':''}`}
              onClick={() => handleTab(id)}
            >
              <Icon active={isActive}/>
              <span className="bnav-tab-label">{label}</span>
              {hasDot && <span className="bnav-dot"/>}
            </button>
          )
        })}
      </nav>
    </>
  )
}