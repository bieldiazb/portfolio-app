// ─── components/DashboardPage.jsx ────────────────────────────────────────────
// Pàgina d'inici: resum total, P&G, distribució ràpida, accés directe
import { useMemo } from 'react'
import { PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { COLORS, FONTS, SHARED_STYLES } from './design-tokens'
import { fmtEur } from '../utils/format'

const styles = `
  .dash { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  /* Hero card */
  .dash-hero {
    background: linear-gradient(135deg, #0f0f0f 0%, #141414 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 24px 20px 20px;
    margin-bottom: 16px; position: relative; overflow: hidden;
  }
  .dash-hero::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:180px; height:180px; border-radius:50%;
    background: radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .dash-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.35); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .dash-hero-total { font-size:36px; font-weight:300; color:#fff; letter-spacing:-1.5px; font-family:${FONTS.mono}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:12px; }
  .dash-hero-total span { font-size:20px; opacity:0.5; }
  .dash-hero-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .dash-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; font-family:${FONTS.mono}; padding:4px 10px; border-radius:20px; }
  .dash-badge.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .dash-badge.neg { color:${COLORS.neonRed}; background:rgba(255,59,59,0.10); border:1px solid rgba(255,59,59,0.20); }
  .dash-hero-sub { font-size:11px; color:rgba(255,255,255,0.30); font-family:${FONTS.mono}; }

  /* Grid de mètriques */
  .dash-metrics { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:16px; }
  @media (min-width:480px) { .dash-metrics { grid-template-columns:repeat(4,1fr); } }

  .dash-metric {
    background:#111; border:1px solid rgba(255,255,255,0.06);
    border-radius:10px; padding:14px 14px 12px;
    display:flex; flex-direction:column; gap:6px;
    transition: border-color 120ms;
  }
  .dash-metric:hover { border-color:rgba(255,255,255,0.10); }
  .dash-metric-label { font-size:10px; font-weight:500; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.10em; }
  .dash-metric-val { font-size:18px; font-weight:500; font-family:${FONTS.mono}; color:#fff; letter-spacing:-0.5px; font-variant-numeric:tabular-nums; }
  .dash-metric-val.sm { font-size:14px; }
  .dash-metric-sub { font-size:10px; font-family:${FONTS.mono}; color:rgba(255,255,255,0.30); }
  .dash-metric-val.g { color:${COLORS.neonGreen}; }
  .dash-metric-val.r { color:${COLORS.neonRed}; }
  .dash-metric-val.p { color:${COLORS.neonPurple}; }
  .dash-metric-val.c { color:${COLORS.neonCyan}; }

  /* Seccions */
  .dash-section { margin-bottom:16px; }
  .dash-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .dash-section-title { font-size:11px; font-weight:600; color:rgba(255,255,255,0.40); text-transform:uppercase; letter-spacing:0.12em; }
  .dash-section-link { font-size:11px; color:${COLORS.neonPurple}; font-weight:500; cursor:pointer; background:none; border:none; padding:0; font-family:${FONTS.sans}; }

  /* Distribució mini */
  .dash-alloc { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; display:flex; align-items:center; gap:16px; }
  .dash-alloc-bars { flex:1; display:flex; flex-direction:column; gap:8px; }
  .dash-alloc-row { display:flex; align-items:center; gap:8px; }
  .dash-alloc-label { font-size:11px; color:rgba(255,255,255,0.55); width:72px; flex-shrink:0; }
  .dash-alloc-track { flex:1; height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; }
  .dash-alloc-fill { height:100%; border-radius:3px; transition:width 600ms cubic-bezier(0.4,0,0.2,1); }
  .dash-alloc-pct { font-size:10px; font-family:${FONTS.mono}; color:rgba(255,255,255,0.40); width:32px; text-align:right; flex-shrink:0; }

  /* Actius top */
  .dash-assets { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }
  .dash-asset-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 80ms; -webkit-tap-highlight-color:transparent; }
  .dash-asset-row:last-child { border-bottom:none; }
  .dash-asset-row:active { background:rgba(255,255,255,0.03); }
  .dash-av { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .dash-asset-info { flex:1; min-width:0; }
  .dash-asset-name { font-size:13px; font-weight:500; color:#fff; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dash-asset-sub { font-size:10px; color:rgba(255,255,255,0.30); font-family:${FONTS.mono}; }
  .dash-asset-right { text-align:right; flex-shrink:0; }
  .dash-asset-val { font-size:13px; font-weight:500; font-family:${FONTS.mono}; color:#fff; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .dash-asset-pct { font-size:11px; font-family:${FONTS.mono}; font-weight:500; }
  .dash-asset-pct.p { color:${COLORS.neonGreen}; }
  .dash-asset-pct.n { color:${COLORS.neonRed}; }

  /* Accions ràpides */
  .dash-quick { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:16px; }
  @media (min-width:480px) { .dash-quick { grid-template-columns:repeat(4,1fr); } }
  .dash-quick-btn {
    background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px;
    padding:14px 12px; display:flex; flex-direction:column; align-items:center; gap:8px;
    cursor:pointer; transition:all 120ms; -webkit-tap-highlight-color:transparent;
    font-family:${FONTS.sans};
  }
  .dash-quick-btn:hover { border-color:rgba(255,255,255,0.12); background:#161616; }
  .dash-quick-btn:active { transform:scale(0.97); }
  .dash-quick-ico { font-size:20px; }
  .dash-quick-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.55); text-align:center; }

  /* Dividend proper */
  .dash-next-div { background:rgba(0,255,136,0.04); border:1px solid rgba(0,255,136,0.12); border-radius:10px; padding:14px 16px; display:flex; align-items:center; gap:14px; }
  .dash-next-div-ico { font-size:24px; }
  .dash-next-div-info { flex:1; }
  .dash-next-div-label { font-size:10px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:4px; font-weight:500; }
  .dash-next-div-val { font-size:14px; font-weight:600; color:${COLORS.neonGreen}; font-family:${FONTS.mono}; margin-bottom:2px; }
  .dash-next-div-sub { font-size:11px; color:rgba(255,255,255,0.35); }
`

const ALLOC_COLORS = [
  COLORS.neonPurple, COLORS.neonGreen, COLORS.neonCyan, COLORS.neonAmber, COLORS.neonRed,
]

const TYPE_COLORS_BG = {
  etf:     { bg: 'rgba(0,212,255,0.12)', color: COLORS.neonCyan },
  stock:   { bg: 'rgba(123,97,255,0.12)', color: COLORS.neonPurple },
  robo:    { bg: 'rgba(0,255,136,0.10)', color: COLORS.neonGreen },
  crypto:  { bg: 'rgba(255,149,0,0.12)', color: COLORS.neonAmber },
  estalvi: { bg: 'rgba(0,255,136,0.08)', color: COLORS.neonGreen },
  efectiu: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
  commodity:{ bg:'rgba(255,149,0,0.12)', color: COLORS.neonAmber },
}

export default function DashboardPage({
  totalAll, totalInvCost, pg, pgPct,
  totalSav, totalCry, totalInv, totalCom,
  investments, savings, cryptos, commodities,
  snapshots, dividends,
  onNavigate,
}) {
  const isPos = pg >= 0

  // Distribució per categoria
  const alloc = useMemo(() => {
    const cats = [
      { label: 'Inversions', val: totalInv,  color: COLORS.neonPurple },
      { label: 'Estalvis',   val: totalSav,  color: COLORS.neonGreen },
      { label: 'Crypto',     val: totalCry,  color: COLORS.neonAmber },
      { label: 'Mat. prim.', val: totalCom,  color: COLORS.neonCyan },
    ].filter(c => c.val > 0)
    const total = cats.reduce((s, c) => s + c.val, 0)
    return cats.map(c => ({ ...c, pct: total > 0 ? (c.val / total) * 100 : 0 }))
  }, [totalInv, totalSav, totalCry, totalCom])

  // Top actius per valor
  const topAssets = useMemo(() => {
    const all = [
      ...investments.map(inv => ({
        id: inv.id, name: inv.name, ticker: inv.ticker,
        type: inv.type || 'etf',
        val: inv.currentPrice && inv.totalQty ? inv.totalQty * inv.currentPrice : (inv.totalCostEur || inv.totalCost || 0),
        cost: inv.totalCostEur || inv.totalCost || 0,
        category: 'inv',
      })),
      ...cryptos.map(c => ({
        id: c.id, name: c.name, ticker: c.symbol,
        type: 'crypto',
        val: c.currentPrice && (c.totalQty ?? c.qty) ? (c.totalQty ?? c.qty) * c.currentPrice : (c.totalCost || 0),
        cost: c.totalCost || 0,
        category: 'crypto',
      })),
      ...commodities.map(c => ({
        id: c.id, name: c.name, ticker: c.symbol,
        type: 'commodity',
        val: c.currentPriceEur && c.totalQty ? c.totalQty * c.currentPriceEur : (c.totalCost || 0),
        cost: c.totalCost || 0,
        category: 'com',
      })),
    ].sort((a, b) => b.val - a.val).slice(0, 5)
    return all
  }, [investments, cryptos, commodities])

  // Proper dividend
  const nextDividend = useMemo(() => {
    if (!dividends?.length) return null
    const now = new Date()
    const future = dividends
      .filter(d => d.nextPayDate && new Date(d.nextPayDate) > now)
      .sort((a, b) => new Date(a.nextPayDate) - new Date(b.nextPayDate))
    return future[0] || null
  }, [dividends])

  // Dades del gràfic (últims snapshots)
  const chartData = useMemo(() => {
    if (!snapshots?.length) return []
    return [...snapshots]
      .sort((a, b) => a.date?.localeCompare(b.date))
      .slice(-30)
      .map(s => ({ v: s.total || 0 }))
  }, [snapshots])

  const QUICK_ACTIONS = [
    { emoji: '📈', label: 'Inversions',  page: 'investments' },
    { emoji: '🏦', label: 'Estalvis',    page: 'savings' },
    { emoji: '🔶', label: 'Crypto',      page: 'crypto' },
    { emoji: '🥇', label: 'Mat. prim.',  page: 'commodities' },
  ]

  return (
    <div className="dash">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="dash-hero">
        <p className="dash-hero-label">Patrimoni total</p>
        <p className="dash-hero-total">
          {fmtEur(totalAll).replace('€', '')}<span>€</span>
        </p>
        <div className="dash-hero-row">
          <span className={`dash-badge ${isPos ? 'pos' : 'neg'}`}>
            {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{fmtEur(pg)} ({Math.abs(pgPct).toFixed(2)}%)
          </span>
          {chartData.length > 2 && (
            <div style={{ flex: 1, minWidth: 80, maxWidth: 140, height: 32 }}>
              <ResponsiveContainer width="100%" height={32}>
                <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPos ? COLORS.neonGreen : COLORS.neonRed} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={isPos ? COLORS.neonGreen : COLORS.neonRed} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={isPos ? COLORS.neonGreen : COLORS.neonRed} strokeWidth={1.5} fill="url(#dashGrad)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Mètriques ràpides */}
      <div className="dash-metrics">
        {[
          { label: 'Inversions', val: fmtEur(totalInv), cls: '', sub: `${investments.length} posicions` },
          { label: 'Estalvis',   val: fmtEur(totalSav), cls: 'g', sub: `${savings?.length || 0} comptes` },
          { label: 'Crypto',     val: fmtEur(totalCry), cls: 'c', sub: `${cryptos?.length || 0} actius` },
          { label: 'Mat. prim.', val: fmtEur(totalCom), cls: 'p', sub: `${commodities?.length || 0} actius` },
        ].map((m, i) => (
          <div key={i} className="dash-metric">
            <p className="dash-metric-label">{m.label}</p>
            <p className={`dash-metric-val sm ${m.cls}`}>{m.val}</p>
            <p className="dash-metric-sub">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Accions ràpides */}
      <div className="dash-section">
        <div className="dash-section-hdr">
          <span className="dash-section-title">Accés ràpid</span>
        </div>
        <div className="dash-quick">
          {QUICK_ACTIONS.map(a => (
            <button key={a.page} className="dash-quick-btn" onClick={() => onNavigate(a.page)}>
              <span className="dash-quick-ico">{a.emoji}</span>
              <span className="dash-quick-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Distribució */}
      {alloc.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <span className="dash-section-title">Distribució</span>
            <button className="dash-section-link" onClick={() => onNavigate('chart')}>Veure →</button>
          </div>
          <div className="dash-alloc">
            <div className="dash-alloc-bars">
              {alloc.map((a, i) => (
                <div key={i} className="dash-alloc-row">
                  <span className="dash-alloc-label">{a.label}</span>
                  <div className="dash-alloc-track">
                    <div className="dash-alloc-fill" style={{ width: `${a.pct}%`, background: a.color }}/>
                  </div>
                  <span className="dash-alloc-pct">{a.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top actius */}
      {topAssets.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <span className="dash-section-title">Top actius</span>
            <button className="dash-section-link" onClick={() => onNavigate('investments')}>Tots →</button>
          </div>
          <div className="dash-assets">
            {topAssets.map((a) => {
              const tc = TYPE_COLORS_BG[a.type] || TYPE_COLORS_BG.etf
              const gain = a.val - a.cost
              const gainPct = a.cost > 0 ? (gain / a.cost) * 100 : 0
              const pos = gain >= 0
              return (
                <div key={a.id} className="dash-asset-row"
                  onClick={() => onNavigate(a.category === 'crypto' ? 'crypto' : a.category === 'com' ? 'commodities' : 'investments')}>
                  <div className="dash-av" style={{ background: tc.bg, color: tc.color }}>
                    {(a.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="dash-asset-info">
                    <p className="dash-asset-name">{a.name}</p>
                    <p className="dash-asset-sub">{a.ticker || a.type?.toUpperCase()}</p>
                  </div>
                  <div className="dash-asset-right">
                    <p className="dash-asset-val">{fmtEur(a.val)}</p>
                    <p className={`dash-asset-pct ${pos ? 'p' : 'n'}`}>
                      {pos ? '▲ +' : '▼ '}{Math.abs(gainPct).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Proper dividend */}
      {nextDividend && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <span className="dash-section-title">Proper dividend</span>
            <button className="dash-section-link" onClick={() => onNavigate('dividends')}>Veure →</button>
          </div>
          <div className="dash-next-div">
            <span className="dash-next-div-ico">💸</span>
            <div className="dash-next-div-info">
              <p className="dash-next-div-label">{nextDividend.ticker || nextDividend.name}</p>
              <p className="dash-next-div-val">{fmtEur(nextDividend.estimatedAmount || nextDividend.amount || 0)}</p>
              <p className="dash-next-div-sub">{nextDividend.nextPayDate || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Espai per al bottom nav */}
      <div style={{ height: 16 }}/>
    </div>
  )
}