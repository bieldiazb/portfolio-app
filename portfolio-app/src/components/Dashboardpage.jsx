// components/DashboardPage.jsx — Robinhood-style
import { useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { COLORS, FONTS, SHARED_STYLES } from './design-tokens'
import { fmtEur } from '../utils/format'

const styles = `
  .dash { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  /* ── Hero centrat ── */
  .dash-hero {
    text-align:center;
    padding:32px 20px 24px;
  }
  .dash-hero-label {
    font-size:12px; font-weight:400; color:var(--c-text-muted);
    letter-spacing:0.06em; margin-bottom:8px;
  }
  .dash-hero-num {
    font-size:48px; font-weight:600; color:var(--c-text-primary);
    font-family:${FONTS.num}; font-variant-numeric:tabular-nums;
    line-height:1; letter-spacing:0; margin-bottom:10px;
  }
  .dash-hero-num span { font-size:28px; opacity:0.4; font-weight:600; }
  .dash-hero-pg {
    display:inline-flex; align-items:center; gap:6px;
    font-size:14px; font-weight:500; font-family:${FONTS.mono};
  }
  .dash-hero-pg.pos { color:var(--c-green); }
  .dash-hero-pg.neg { color:var(--c-red); }

  /* ── Gràfic ── */
  .dash-chart-wrap {
    padding:0 0 8px;
    position:relative;
  }
  .dash-chart-tooltip {
    background:var(--c-elevated);
    border:1px solid var(--c-border);
    border-radius:8px;
    padding:8px 12px;
    font-family:${FONTS.sans};
  }
  .dash-chart-tip-val {
    font-size:14px; font-weight:600;
    font-family:${FONTS.num};
    color:var(--c-text-primary);
    font-variant-numeric:tabular-nums;
  }
  .dash-chart-tip-date {
    font-size:10px; color:var(--c-text-muted); margin-bottom:3px;
  }

  /* ── Divider ── */
  .dash-divider {
    height:1px; background:var(--c-border); margin:0 0 20px;
  }

  /* ── Stats fila ── */
  .dash-stats {
    display:grid; grid-template-columns:repeat(3,1fr);
    gap:0; margin-bottom:24px;
    border:1px solid var(--c-border); border-radius:12px; overflow:hidden;
  }
  .dash-stat {
    padding:16px 14px; text-align:center;
    border-right:1px solid var(--c-border);
  }
  .dash-stat:last-child { border-right:none; }
  .dash-stat-label {
    font-size:10px; font-weight:500; color:var(--c-text-muted);
    text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px;
  }
  .dash-stat-val {
    font-size:15px; font-weight:600; font-family:${FONTS.mono};
    color:var(--c-text-primary); font-variant-numeric:tabular-nums;
    letter-spacing:-0.3px;
  }
  .dash-stat-val.g { color:var(--c-green); }
  .dash-stat-val.r { color:var(--c-red); }
  .dash-stat-val.c { color:var(--c-cyan); }
  .dash-stat-val.a { color:var(--c-amber); }

  /* ── Accés ràpid ── */
  .dash-section-label {
    font-size:11px; font-weight:600; color:var(--c-text-secondary);
    text-transform:uppercase; letter-spacing:0.12em;
    padding:0 0 10px;
  }
  .dash-quick {
    display:grid; grid-template-columns:repeat(4,1fr); gap:8px;
    margin-bottom:28px;
  }
  @media (max-width:400px) { .dash-quick { grid-template-columns:repeat(2,1fr); } }
  .dash-quick-btn {
    background:var(--c-surface); border:1px solid var(--c-border);
    border-radius:12px; padding:14px 10px;
    display:flex; flex-direction:column; align-items:center; gap:8px;
    cursor:pointer; transition:all 120ms; -webkit-tap-highlight-color:transparent;
    font-family:${FONTS.sans};
  }
  .dash-quick-btn:hover { border-color:var(--c-border-hi); background:var(--c-elevated); }
  .dash-quick-btn:active { transform:scale(0.97); }
  .dash-quick-ico { font-size:22px; }
  .dash-quick-lbl { font-size:11px; font-weight:500; color:var(--c-text-secondary); }

  /* ── Llista d'actius ── */
  .dash-list { margin-bottom:28px; }
  .dash-list-hdr {
    display:flex; align-items:center; justify-content:space-between;
    padding:0 0 10px;
  }
  .dash-list-link {
    font-size:11px; color:var(--c-green); font-weight:500;
    cursor:pointer; background:none; border:none; padding:0;
    font-family:${FONTS.sans};
  }
  .dash-asset {
    display:flex; align-items:center; gap:12px;
    padding:13px 0; border-bottom:1px solid var(--c-border);
    cursor:pointer; transition:background 80ms;
    -webkit-tap-highlight-color:transparent;
  }
  .dash-asset:last-child { border-bottom:none; }
  .dash-asset:active { opacity:0.7; }
  .dash-av {
    width:38px; height:38px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:700; flex-shrink:0;
    font-family:${FONTS.mono};
  }
  .dash-asset-info { flex:1; min-width:0; }
  .dash-asset-name {
    font-size:14px; font-weight:500; color:var(--c-text-primary);
    margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .dash-asset-sub {
    font-size:11px; color:var(--c-text-muted); font-family:${FONTS.mono};
  }
  .dash-asset-right { text-align:right; flex-shrink:0; }
  .dash-asset-val {
    font-size:14px; font-weight:500; font-family:${FONTS.mono};
    color:var(--c-text-primary); font-variant-numeric:tabular-nums;
    margin-bottom:2px;
  }
  .dash-asset-pct {
    font-size:11px; font-family:${FONTS.mono}; font-weight:600;
  }
  .dash-asset-pct.p { color:var(--c-green); }
  .dash-asset-pct.n { color:var(--c-red); }

  /* Micro sparkline per actiu */
  .dash-mini-chart { width:48px; height:28px; flex-shrink:0; }

  /* ── Dividend ── */
  .dash-div-card {
    background:var(--c-bg-green); border:1px solid var(--c-border-green);
    border-radius:12px; padding:16px;
    display:flex; align-items:center; gap:14px;
    cursor:pointer; margin-bottom:28px;
    transition:opacity 100ms;
  }
  .dash-div-card:active { opacity:0.8; }
  .dash-div-ico { font-size:28px; flex-shrink:0; }
  .dash-div-label { font-size:10px; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:4px; font-weight:500; }
  .dash-div-val { font-size:16px; font-weight:600; color:var(--c-green); font-family:${FONTS.mono}; margin-bottom:2px; }
  .dash-div-sub { font-size:11px; color:var(--c-text-secondary); }
`

const TYPE_COLORS = {
  etf:      { bg:'rgba(0,212,255,0.12)',   color:'var(--c-cyan)'   },
  stock:    { bg:'rgba(123,97,255,0.12)',  color:'var(--c-purple)' },
  robo:     { bg:'rgba(255,149,0,0.12)',   color:'var(--c-amber)'  },
  crypto:   { bg:'rgba(255,149,0,0.12)',   color:'var(--c-amber)'  },
  estalvi:  { bg:'rgba(0,255,136,0.10)',   color:'var(--c-green)'  },
  efectiu:  { bg:'var(--c-elevated)',      color:'var(--c-text-secondary)' },
  commodity:{ bg:'rgba(200,150,26,0.12)',  color:'#c8961a' },
}

function invVal(inv, fxRates) {
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'
  const qty = inv.totalQty || 0
  if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
    return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
  if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
  return inv.totalCostEur || inv.totalCost || 0
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-chart-tooltip">
      <p className="dash-chart-tip-val">{fmtEur(payload[0]?.value || 0)}</p>
    </div>
  )
}

export default function DashboardPage({
  totalAll, totalInvCost, pg, pgPct,
  totalSav, totalCry, totalInv, totalCom,
  investments, savings, cryptos, commodities,
  snapshots, dividends,
  fxRates = {},
  onNavigate,
}) {
  const isPos = pg >= 0

  const topAssets = useMemo(() => [
    ...investments
      .filter(i => (i.totalQty||0) > 0.00001)
      .map(inv => ({
        id:inv.id, name:inv.name, ticker:inv.ticker,
        type:inv.type||'etf',
        val:invVal(inv,fxRates),
        cost:inv.totalCostEur||inv.totalCost||0,
        txs:inv.txs||[],
        currentPrice:inv.currentPrice,
        category:'inv',
      })),
    ...cryptos.map(c => ({
      id:c.id, name:c.name, ticker:c.symbol,
      type:'crypto',
      val: c.currentPrice&&(c.totalQty??c.qty) ? (c.totalQty??c.qty)*c.currentPrice : (c.totalCost||0),
      cost:c.totalCost||0, txs:[], currentPrice:c.currentPrice,
      category:'crypto',
    })),
  ].sort((a,b) => b.val-a.val).slice(0,6), [investments, cryptos, fxRates])

  const nextDividend = useMemo(() => {
    if (!dividends?.length) return null
    const now = new Date()
    return dividends
      .filter(d => d.nextPayDate && new Date(d.nextPayDate) > now)
      .sort((a,b) => new Date(a.nextPayDate)-new Date(b.nextPayDate))[0] || null
  }, [dividends])

  const chartData = useMemo(() => {
    if (!snapshots?.length) return []
    return [...snapshots]
      .sort((a,b) => (a.date||'').localeCompare(b.date||''))
      .slice(-60)
      .map(s => ({ v: s.total||0, date: s.date||'' }))
  }, [snapshots])

  const chartColor = isPos ? COLORS.neonGreen : COLORS.neonRed

  const totalCost = totalInvCost || 0
  const gainPct   = totalCost > 0 ? (pg / totalCost) * 100 : pgPct || 0

  const QUICK = [
    { emoji:'📈', label:'Inversions', page:'investments' },
    { emoji:'🏦', label:'Estalvis',   page:'savings'     },
    { emoji:'🔶', label:'Crypto',     page:'crypto'      },
    { emoji:'🥇', label:'Mat. prim.', page:'commodities' },
  ]

  return (
    <div className="dash">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* ── Hero centrat ── */}
      <div className="dash-hero">
        <p className="dash-hero-label">Patrimoni total</p>
        <p className="dash-hero-num">
          {fmtEur(totalAll).replace('€','')}<span>€</span>
        </p>
        <p className={`dash-hero-pg ${isPos?'pos':'neg'}`}>
          {isPos?'▲':' ▼'} {isPos?'+':''}{fmtEur(pg)}
          <span style={{opacity:0.6,fontWeight:400}}>
            &nbsp;({isPos?'+':''}{Math.abs(gainPct).toFixed(2)}%)
          </span>
        </p>
      </div>

      {/* ── Gràfic evolució ── */}
      {chartData.length > 2 && (
        <div className="dash-chart-wrap">
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
              <defs>
                <linearGradient id="dashG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.18}/>
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide/>
              <Tooltip content={<ChartTooltip/>} cursor={{stroke:chartColor,strokeWidth:1,strokeDasharray:'4 2'}}/>
              <Area
                type="monotone" dataKey="v"
                stroke={chartColor} strokeWidth={2}
                fill="url(#dashG)" dot={false}
                activeDot={{r:4,fill:chartColor,stroke:'var(--c-bg)',strokeWidth:2}}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="dash-divider"/>

      {/* ── Stats ── */}
      <div className="dash-stats">
        <div className="dash-stat">
          <p className="dash-stat-label">Inversions</p>
          <p className="dash-stat-val g">{fmtEur(totalInv)}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Estalvis</p>
          <p className="dash-stat-val c">{fmtEur(totalSav)}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Crypto</p>
          <p className="dash-stat-val a">{fmtEur(totalCry)}</p>
        </div>
      </div>

      {/* ── Accés ràpid ── */}
      <p className="dash-section-label">Accés ràpid</p>
      <div className="dash-quick">
        {QUICK.map(a => (
          <button key={a.page} className="dash-quick-btn" onClick={() => onNavigate(a.page)}>
            <span className="dash-quick-ico">{a.emoji}</span>
            <span className="dash-quick-lbl">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Top actius ── */}
      {topAssets.length > 0 && (
        <div className="dash-list">
          <div className="dash-list-hdr">
            <p className="dash-section-label" style={{paddingBottom:0}}>Posicions</p>
            <button className="dash-list-link" onClick={() => onNavigate('investments')}>
              Veure totes →
            </button>
          </div>
          {topAssets.map(a => {
            const tc   = TYPE_COLORS[a.type] || TYPE_COLORS.etf
            const gain = a.val - a.cost
            const gPct = a.cost > 0 ? (gain/a.cost)*100 : 0
            const pos  = gain >= 0

            // Mini sparkline des de txs
            const pts = a.txs
              .filter(t => t.type==='buy' && t.pricePerUnit > 0)
              .map((t,i) => ({i, p:t.pricePerUnit}))
            if (a.currentPrice) pts.push({i:pts.length, p:a.currentPrice})

            return (
              <div key={a.id} className="dash-asset"
                onClick={() => onNavigate(a.category==='crypto'?'crypto':'investments')}>
                <div className="dash-av" style={{background:tc.bg,color:tc.color}}>
                  {(a.name||'?').slice(0,2).toUpperCase()}
                </div>
                <div className="dash-asset-info">
                  <p className="dash-asset-name">{a.name}</p>
                  <p className="dash-asset-sub">{a.ticker || a.type?.toUpperCase()}</p>
                </div>
                {pts.length >= 3 && (
                  <div className="dash-mini-chart">
                    <ResponsiveContainer width="100%" height={28}>
                      <AreaChart data={pts} margin={{top:2,right:0,left:0,bottom:2}}>
                        <defs>
                          <linearGradient id={`mg${a.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={pos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0.3}/>
                            <stop offset="100%" stopColor={pos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="p"
                          stroke={pos?COLORS.neonGreen:COLORS.neonRed}
                          strokeWidth={1.5} fill={`url(#mg${a.id})`} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="dash-asset-right">
                  <p className="dash-asset-val">{fmtEur(a.val)}</p>
                  <p className={`dash-asset-pct ${pos?'p':'n'}`}>
                    {pos?'▲ +':'▼ '}{Math.abs(gPct).toFixed(2)}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Proper dividend ── */}
      {nextDividend && (
        <div className="dash-div-card" onClick={() => onNavigate('dividends')}>
          <span className="dash-div-ico">💸</span>
          <div style={{flex:1}}>
            <p className="dash-div-label">Proper dividend</p>
            <p className="dash-div-val">{fmtEur(nextDividend.estimatedAmount||nextDividend.amount||0)}</p>
            <p className="dash-div-sub">{nextDividend.ticker||nextDividend.name} · {nextDividend.nextPayDate||'—'}</p>
          </div>
          <span style={{color:'var(--c-text-disabled)',fontSize:18}}>›</span>
        </div>
      )}

      <div style={{height:16}}/>
    </div>
  )
}