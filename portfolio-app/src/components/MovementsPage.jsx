import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'

const FILTERS = [
  { id:'all',   label:'Tots'    },
  { id:'buy',   label:'Compres' },
  { id:'sell',  label:'Vendes'  },
  { id:'sav',   label:'Estalvis'},
  { id:'crypto',label:'Crypto'  },
]

const styles = `
  .mv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── KPIs ── */
  .mv-kpis { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
  @media (min-width:500px) { .mv-kpis { grid-template-columns:repeat(4,1fr); } }
  .mv-kpi { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; padding:14px 16px; }
  .mv-kpi-l { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .mv-kpi-v { font-size:20px; font-weight:500; font-family:${FONTS.num}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; letter-spacing:-0.5px; }
  .mv-kpi-v.g { color:${COLORS.neonGreen}; }
  .mv-kpi-v.r { color:${COLORS.neonRed}; }
  .mv-kpi-sub { font-size:10px; color:var(--c-text-muted); margin-top:2px; font-family:${FONTS.mono}; }

  /* ── Filtres ── */
  .mv-filters { display:flex; gap:5px; flex-wrap:wrap; }
  .mv-filter {
    padding:6px 14px; border-radius:20px; border:1px solid var(--c-border);
    background:transparent; font-family:${FONTS.sans}; font-size:11px; font-weight:500;
    color:var(--c-text-muted); cursor:pointer; transition:all 100ms;
    -webkit-tap-highlight-color:transparent;
  }
  .mv-filter:hover { color:var(--c-text-secondary); border-color:var(--c-border-mid); }
  .mv-filter.on.all  { background:var(--c-elevated); border-color:var(--c-border-hi); color:var(--c-text-primary); }
  .mv-filter.on.buy  { background:var(--c-bg-green);  border-color:var(--c-border-green); color:${COLORS.neonGreen}; }
  .mv-filter.on.sell { background:var(--c-bg-red);    border-color:var(--c-border-red);   color:${COLORS.neonRed}; }
  .mv-filter.on.sav  { background:var(--c-bg-cyan);   border-color:var(--c-border-cyan);  color:${COLORS.neonCyan}; }
  .mv-filter.on.crypto { background:var(--c-bg-amber); border-color:var(--c-border-amber); color:${COLORS.neonAmber}; }

  /* ── Panel ── */
  .mv-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; overflow:hidden; }

  /* ── Capçalera de mes ── */
  .mv-month-hdr {
    display:flex; justify-content:space-between; align-items:center;
    padding:10px 16px 8px;
    background:var(--c-elevated); border-bottom:1px solid var(--c-border);
    position:sticky; top:0; z-index:2;
  }
  .mv-month-label { font-size:10px; font-weight:600; color:var(--c-text-secondary); text-transform:capitalize; letter-spacing:0.02em; }
  .mv-month-pnl { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .mv-month-pnl.g { color:${COLORS.neonGreen}; }
  .mv-month-pnl.r { color:${COLORS.neonRed}; }
  .mv-month-pnl.n { color:var(--c-text-muted); }

  /* ── Row de transacció ── */
  .mv-row {
    display:flex; align-items:center; gap:12px;
    padding:13px 16px; border-bottom:1px solid var(--c-border);
    transition:background 80ms;
  }
  .mv-row:last-child { border-bottom:none; }
  .mv-row:hover { background:var(--c-elevated); }

  /* Indicador de tipus (buy/sell) */
  .mv-type-dot {
    width:28px; height:28px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:700;
  }
  .mv-type-dot.buy  { background:var(--c-bg-green);  color:${COLORS.neonGreen}; }
  .mv-type-dot.sell { background:var(--c-bg-red);    color:${COLORS.neonRed};   }
  .mv-type-dot.dep  { background:var(--c-bg-cyan);   color:${COLORS.neonCyan};  }
  .mv-type-dot.wit  { background:var(--c-bg-amber);  color:${COLORS.neonAmber}; }
  .mv-type-dot.neu  { background:var(--c-elevated);  color:var(--c-text-secondary); }

  /* Avatar actiu */
  .mv-av { width:34px; height:34px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; font-family:${FONTS.mono}; }

  /* Info */
  .mv-info { flex:1; min-width:0; }
  .mv-name { font-size:13px; font-weight:500; color:var(--c-text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .mv-meta { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }

  /* Dreta */
  .mv-right { text-align:right; flex-shrink:0; }
  .mv-amount { font-size:13px; font-family:${FONTS.num}; font-weight:500; color:var(--c-text-primary); font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .mv-pnl { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .mv-pnl.g { color:${COLORS.neonGreen}; }
  .mv-pnl.r { color:${COLORS.neonRed}; }
  .mv-pnl.n { color:var(--c-text-muted); }

  /* Dia */
  .mv-day { font-size:10px; font-family:${FONTS.num}; color:var(--c-text-disabled); width:18px; flex-shrink:0; text-align:center; }

  .mv-empty { padding:48px 16px; text-align:center; }
  .mv-empty-main { font-size:13px; color:var(--c-text-muted); font-weight:500; margin-bottom:5px; }
  .mv-empty-sub { font-size:11px; color:var(--c-text-disabled); }
`

// Extreu la millor data d'una inversió
function getBestDate(inv) {
  if (inv.txs?.length > 0) {
    const sorted = [...inv.txs].sort((a,b) => (a.date||'').localeCompare(b.date||''))
    const d = sorted[0]?.date
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  }
  if (inv.createdAt) {
    const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  if (isNaN(d.getTime())) return null
  return {
    day:        d.getDate().toString().padStart(2,'0'),
    monthKey:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
    monthLabel: d.toLocaleDateString('ca-ES',{month:'long',year:'numeric'}),
  }
}

export default function MovementsPage({ investments=[], savings=[], cryptos=[], commodities=[] }) {
  const [filter, setFilter] = useState('all')

  // ── Construeix la llista de TOTS els moviments individuals ──────────────────
  const allMovements = useMemo(() => {
    const list = []

    // ── Inversions: una fila per transacció (buy/sell) ──
    investments.forEach(inv => {
      const tc = TYPE_COLORS[inv.type] || TYPE_COLORS.etf

      if (inv.txs && inv.txs.length > 0) {
        // Calcula el cost mitjà de compra per calcular P&G a les vendes
        let runningQty = 0, runningCost = 0

        const sortedTxs = [...inv.txs].sort((a,b) => (a.date||'').localeCompare(b.date||''))

        sortedTxs.forEach(tx => {
          const isBuy  = tx.type === 'buy'
          const isSell = tx.type === 'sell'
          const qty    = tx.qty || 0
          const costEur = tx.totalCostEur || tx.totalCost || 0

          let pnl = null
          let pnlPct = null

          if (isBuy) {
            runningQty  += qty
            runningCost += costEur
          } else if (isSell && runningQty > 0) {
            // P&G = ingrés venda - cost proporcional
            const avgCostPerUnit = runningCost / runningQty
            const costBasis = avgCostPerUnit * qty
            pnl = costEur - costBasis
            pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0
            // Actualitza el running
            runningQty  = Math.max(0, runningQty - qty)
            runningCost = Math.max(0, runningCost - costBasis)
          }

          list.push({
            id:       `inv-${inv.id}-${tx.id||Math.random()}`,
            category: isSell ? 'sell' : 'buy',
            date:     tx.date || getBestDate(inv),
            name:     inv.name,
            ticker:   inv.ticker,
            meta:     [
              qty > 0 ? `${parseFloat(qty.toFixed(6))} u.` : null,
              tx.pricePerUnit > 0 ? `@ ${fmtEur(tx.pricePerUnit)}/u.` : null,
              tx.note ? tx.note : null,
            ].filter(Boolean).join(' · '),
            amount:   costEur,
            pnl,
            pnlPct,
            isBuy,
            isSell,
            bg:       tc.bg,
            color:    tc.color,
            initials: inv.name.slice(0,2).toUpperCase(),
          })
        })
      } else {
        // Sense txs individuals — mostra la posició com a compra
        list.push({
          id:       `inv-${inv.id}`,
          category: 'buy',
          date:     getBestDate(inv),
          name:     inv.name,
          ticker:   inv.ticker,
          meta:     inv.ticker || '',
          amount:   inv.totalCostEur || inv.totalCost || 0,
          pnl:      null, pnlPct: null,
          isBuy:    true, isSell: false,
          bg:       tc.bg, color: tc.color,
          initials: inv.name.slice(0,2).toUpperCase(),
        })
      }
    })

    // ── Estalvis: mostra cada transacció ──
    savings.forEach(s => {
      const baseTxs = s.txs || []
      if (baseTxs.length > 0) {
        baseTxs.forEach(tx => {
          const isDeposit = (tx.amount || 0) >= 0
          const dateStr = tx.createdAt?.toDate
            ? tx.createdAt.toDate().toISOString().split('T')[0]
            : tx.date || new Date().toISOString().split('T')[0]
          list.push({
            id:       `sav-${s.id}-${tx.id||Math.random()}`,
            category: 'sav',
            date:     dateStr,
            name:     s.name,
            ticker:   '',
            meta:     tx.note || (isDeposit ? 'Ingrés' : 'Retirada'),
            amount:   Math.abs(tx.amount || 0),
            pnl:      null, pnlPct: null,
            isBuy:    isDeposit, isSell: !isDeposit,
            bg:       'var(--c-bg-cyan)', color: COLORS.neonCyan,
            initials: s.name.slice(0,2).toUpperCase(),
          })
        })
      } else {
        // Sense txs
        let dateStr = new Date().toISOString().split('T')[0]
        if (s.createdAt) {
          const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
          if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0]
        }
        list.push({
          id:       `sav-${s.id}`,
          category: 'sav',
          date:     dateStr,
          name:     s.name, ticker: '',
          meta:     s.rate ? `${s.rate}% TAE` : 'Compte estalvi',
          amount:   s.amount || s.balance || 0,
          pnl: null, pnlPct: null,
          isBuy: true, isSell: false,
          bg: 'var(--c-bg-cyan)', color: COLORS.neonCyan,
          initials: s.name.slice(0,2).toUpperCase(),
        })
      }
    })

    // ── Crypto: una fila per transacció ──
    cryptos.forEach(c => {
      const sortedTxs = [...(c.txs||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''))
      let runningQty = 0, runningCost = 0

      if (sortedTxs.length > 0) {
        sortedTxs.forEach(tx => {
          const isBuy  = tx.type === 'buy'
          const qty    = tx.qty || 0
          const cost   = tx.totalCost || 0
          let pnl = null, pnlPct = null

          if (isBuy) {
            runningQty += qty; runningCost += cost
          } else if (runningQty > 0) {
            const avg = runningCost / runningQty
            const basis = avg * qty
            pnl = cost - basis
            pnlPct = basis > 0 ? (pnl / basis) * 100 : 0
            runningQty = Math.max(0, runningQty - qty)
            runningCost = Math.max(0, runningCost - basis)
          }

          list.push({
            id:       `cry-${c.id}-${tx.id||Math.random()}`,
            category: 'crypto',
            date:     tx.date || getBestDate(c),
            name:     c.name, ticker: c.symbol,
            meta:     qty > 0 ? `${parseFloat(qty.toFixed(8))} ${c.symbol}` : '',
            amount:   cost,
            pnl, pnlPct,
            isBuy, isSell: !isBuy,
            bg: 'var(--c-bg-amber)', color: COLORS.neonAmber,
            initials: (c.symbol||c.name).slice(0,3).toUpperCase(),
          })
        })
      }
    })

    return list.sort((a,b) => b.date.localeCompare(a.date))
  }, [investments, savings, cryptos])

  // Filtra
  const filtered = useMemo(() => {
    if (filter === 'all')    return allMovements
    if (filter === 'buy')    return allMovements.filter(m => m.isBuy && (m.category === 'buy' || m.category === 'sav'))
    if (filter === 'sell')   return allMovements.filter(m => m.isSell && m.category !== 'sav')
    if (filter === 'sav')    return allMovements.filter(m => m.category === 'sav')
    if (filter === 'crypto') return allMovements.filter(m => m.category === 'crypto')
    return allMovements
  }, [allMovements, filter])

  // Agrupa per mes
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(m => {
      const d = parseDate(m.date)
      if (!d) return
      if (!groups[d.monthKey]) groups[d.monthKey] = { label: d.monthLabel, items: [], pnl: 0 }
      groups[d.monthKey].items.push({...m, day: d.day})
      if (m.pnl != null) groups[d.monthKey].pnl += m.pnl
    })
    return Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]))
  }, [filtered])

  // KPIs globals
  const totalBought  = allMovements.filter(m=>m.isBuy).reduce((s,m)=>s+m.amount, 0)
  const totalSold    = allMovements.filter(m=>m.isSell && m.category!=='sav').reduce((s,m)=>s+m.amount, 0)
  const totalPnl     = allMovements.reduce((s,m)=>s+(m.pnl||0), 0)
  const countTrades  = allMovements.filter(m=>m.category==='buy'||m.category==='sell').length

  return (
    <div className="mv">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* ── KPIs ── */}
      <div className="mv-kpis">
        <div className="mv-kpi">
          <p className="mv-kpi-l">Total comprat</p>
          <p className="mv-kpi-v">{fmtEur(totalBought)}</p>
          <p className="mv-kpi-sub">{allMovements.filter(m=>m.isBuy).length} operacions</p>
        </div>
        <div className="mv-kpi">
          <p className="mv-kpi-l">Total venut</p>
          <p className="mv-kpi-v">{fmtEur(totalSold)}</p>
          <p className="mv-kpi-sub">{allMovements.filter(m=>m.isSell&&m.category!=='sav').length} vendes</p>
        </div>
        <div className="mv-kpi">
          <p className="mv-kpi-l">P&G realitzat</p>
          <p className={`mv-kpi-v ${totalPnl > 0 ? 'g' : totalPnl < 0 ? 'r' : ''}`}>
            {totalPnl >= 0 ? '+' : ''}{fmtEur(totalPnl)}
          </p>
          <p className="mv-kpi-sub">sobre vendes tancades</p>
        </div>
        <div className="mv-kpi">
          <p className="mv-kpi-l">Operacions</p>
          <p className="mv-kpi-v">{countTrades}</p>
          <p className="mv-kpi-sub">compres + vendes</p>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="mv-filters">
        {FILTERS.map(f=>(
          <button
            key={f.id}
            className={`mv-filter${filter===f.id?' on '+f.id:''}`}
            onClick={()=>setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Timeline ── */}
      <div className="mv-panel">
        {grouped.length === 0 ? (
          <div className="mv-empty">
            <p className="mv-empty-main">Cap moviment registrat</p>
            <p className="mv-empty-sub">Afegeix inversions o importa un CSV per veure l'historial</p>
          </div>
        ) : grouped.map(([key, group]) => (
          <div key={key}>
            {/* Capçalera de mes amb P&G del mes */}
            <div className="mv-month-hdr">
              <span className="mv-month-label">{group.label}</span>
              {group.pnl !== 0 ? (
                <span className={`mv-month-pnl ${group.pnl > 0 ? 'g' : 'r'}`}>
                  {group.pnl > 0 ? '+' : ''}{fmtEur(group.pnl)} P&G
                </span>
              ) : (
                <span className="mv-month-pnl n">—</span>
              )}
            </div>

            {/* Transaccions del mes */}
            {group.items.map(m => (
              <div key={m.id} className="mv-row">
                <span className="mv-day">{m.day}</span>

                {/* Indicador buy/sell */}
                <div className={`mv-type-dot ${m.isSell ? 'sell' : m.category === 'sav' ? (m.isBuy ? 'dep' : 'wit') : 'buy'}`}>
                  {m.isSell ? '↓' : m.category === 'sav' && !m.isBuy ? '↓' : '↑'}
                </div>

                {/* Avatar actiu */}
                <div className="mv-av" style={{background: m.bg, color: m.color}}>
                  {m.initials}
                </div>

                {/* Info */}
                <div className="mv-info">
                  <p className="mv-name">{m.name}{m.ticker && m.ticker !== m.name ? ` · ${m.ticker}` : ''}</p>
                  {m.meta && <p className="mv-meta">{m.meta}</p>}
                </div>

                {/* Import + P&G */}
                <div className="mv-right">
                  <p className="mv-amount">
                    {m.isSell ? '+' : m.category === 'sav' && !m.isBuy ? '-' : '-'}{fmtEur(m.amount)}
                  </p>
                  {m.pnl != null ? (
                    <p className={`mv-pnl ${m.pnl > 0 ? 'g' : m.pnl < 0 ? 'r' : 'n'}`}>
                      {m.pnl >= 0 ? '+' : ''}{fmtEur(m.pnl)}
                      {m.pnlPct != null ? ` (${m.pnlPct >= 0 ? '+' : ''}${m.pnlPct.toFixed(1)}%)` : ''}
                    </p>
                  ) : (
                    <p className="mv-pnl n">
                      {m.isBuy && m.category !== 'sav' ? 'Compra' : m.category === 'sav' && m.isBuy ? 'Ingrés' : m.category === 'sav' ? 'Retirada' : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{height:16}}/>
    </div>
  )
}