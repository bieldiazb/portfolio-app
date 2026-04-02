import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { COLORS, FONTS, CHART_COLORS, SHARED_STYLES } from './design-tokens'
import { fmtEur } from '../utils/format'

// ── Fetch historial de preus via Yahoo ────────────────────────────────────────
async function fetchPriceHistory(ticker, range = '1y') {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${ticker}?interval=1wk&range=${range}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data   = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null
    const timestamps = result.timestamp || []
    const closes     = result.indicators?.quote?.[0]?.close || []
    return timestamps
      .map((t, i) => ({ date: new Date(t * 1000).toISOString().split('T')[0], price: closes[i] }))
      .filter(p => p.price != null && p.price > 0)
  } catch { return null }
}

// ── Càlcul de correlació de Pearson ──────────────────────────────────────────
function pearson(a, b) {
  const n = Math.min(a.length, b.length)
  if (n < 5) return null
  const xa = a.slice(-n), xb = b.slice(-n)
  const ma = xa.reduce((s, v) => s + v, 0) / n
  const mb = xb.reduce((s, v) => s + v, 0) / n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    const A = xa[i] - ma, B = xb[i] - mb
    num += A * B; da += A * A; db += B * B
  }
  const denom = Math.sqrt(da * db)
  return denom === 0 ? null : +(num / denom).toFixed(3)
}

// Retorns setmanals (% canvi)
function weeklyReturns(prices) {
  const r = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) r.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  return r
}

// ── Color del heatmap ─────────────────────────────────────────────────────────
function correlColor(v) {
  if (v === null) return COLORS.elevated
  if (v >= 0.8)  return 'rgba(255,59,59,0.75)'    // molt alta — vermell
  if (v >= 0.5)  return 'rgba(255,149,0,0.65)'    // alta — taronja
  if (v >= 0.2)  return 'rgba(255,230,0,0.35)'    // moderada — groc
  if (v >= -0.2) return 'rgba(80,210,110,0.50)'   // baixa — verd (bon diversificador)
  return 'rgba(0,212,255,0.55)'                    // negativa — cian (excel·lent)
}

function correlLabel(v) {
  if (v === null) return '—'
  if (v >= 0.8)  return 'Molt alta'
  if (v >= 0.5)  return 'Alta'
  if (v >= 0.2)  return 'Moderada'
  if (v >= -0.2) return 'Baixa'
  return 'Negativa'
}

function correlExplain(v) {
  if (v === null) return 'Dades insuficients per calcular'
  if (v >= 0.8)  return 'Es mouen gairebé igual. Poca diversificació real.'
  if (v >= 0.5)  return 'Tendència similar. Diversificació limitada.'
  if (v >= 0.2)  return 'Lleugera relació. Diversificació acceptable.'
  if (v >= -0.2) return 'Independents. Bona diversificació.'
  return 'Es mouen en sentit contrari. Diversificació excel·lent.'
}

const NormTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: COLORS.elevated, border: `1px solid ${COLORS.borderMid}`, borderRadius: 5, padding: '8px 11px', fontFamily: FONTS.sans }}>
      <p style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 5 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: p.value >= 0 ? COLORS.neonGreen : COLORS.neonRed, fontWeight: 600 }}>
            {p.value >= 0 ? '+' : ''}{p.value?.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

const styles = `
  .corr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:14px; margin-top:16px; padding-top:16px; border-top:1px solid ${COLORS.border}; }

  .corr-section-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:12px; }

  /* Heatmap */
  .corr-heatmap-wrap { overflow-x:auto; }
  .corr-table { border-collapse:collapse; width:100%; }
  .corr-th { font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.06em; padding:4px 6px; text-align:center; white-space:nowrap; max-width:60px; overflow:hidden; text-overflow:ellipsis; }
  .corr-th.row { text-align:right; padding-right:10px; max-width:80px; }
  .corr-cell {
    width:52px; height:44px; text-align:center; border-radius:3px;
    font-size:11px; font-weight:600; font-family:${FONTS.mono};
    cursor:pointer; transition:opacity 80ms; position:relative;
  }
  .corr-cell:hover { opacity:0.80; }
  .corr-cell.self { background:${COLORS.elevated}; color:${COLORS.textMuted}; cursor:default; }

  /* Popup */
  .corr-popup {
    position:fixed; background:${COLORS.surface}; border:1px solid ${COLORS.borderMid};
    border-radius:6px; padding:12px 14px; z-index:100; min-width:200px;
    pointer-events:none; box-shadow:0 8px 24px rgba(0,0,0,0.4);
  }
  .corr-popup-pair { font-size:11px; font-weight:600; color:${COLORS.textPrimary}; margin-bottom:4px; }
  .corr-popup-val  { font-size:22px; font-weight:500; font-family:${FONTS.mono}; margin-bottom:4px; }
  .corr-popup-lbl  { font-size:11px; font-weight:600; margin-bottom:6px; }
  .corr-popup-exp  { font-size:11px; color:${COLORS.textSecondary}; line-height:1.5; }

  /* Diversificadors */
  .corr-div-row { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .corr-div-row:last-child { border-bottom:none; }
  .corr-div-rank { width:22px; font-size:11px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.textMuted}; flex-shrink:0; }
  .corr-div-name { flex:1; font-size:12px; font-weight:500; color:${COLORS.textSecondary}; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .corr-div-bar-wrap { width:80px; height:2px; background:${COLORS.border}; border-radius:1px; margin:0 10px; flex-shrink:0; }
  .corr-div-bar { height:100%; border-radius:1px; }
  .corr-div-val { font-size:11px; font-weight:600; font-family:${FONTS.mono}; min-width:40px; text-align:right; flex-shrink:0; }
  .corr-div-lbl { font-size:9px; color:${COLORS.textMuted}; min-width:52px; text-align:right; flex-shrink:0; margin-left:6px; }

  /* Periods */
  .corr-periods { display:flex; gap:1px; background:${COLORS.border}; border-radius:4px; overflow:hidden; margin-bottom:14px; width:fit-content; }
  .corr-period { padding:5px 12px; border:none; background:${COLORS.surface}; font-family:${FONTS.mono}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; }
  .corr-period:hover { color:${COLORS.textSecondary}; background:${COLORS.elevated}; }
  .corr-period.on { background:${COLORS.elevated}; color:${COLORS.textPrimary}; }

  /* Loading */
  .corr-loading { display:flex; align-items:center; gap:8px; padding:32px 0; font-size:12px; color:${COLORS.textMuted}; justify-content:center; }
  .corr-spin { width:13px; height:13px; border:1.5px solid ${COLORS.border}; border-top-color:${COLORS.textSecondary}; border-radius:50%; animation:corrspin .7s linear infinite; }
  @keyframes corrspin { to { transform:rotate(360deg); } }

  /* Llegenda */
  .corr-legend { display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
  .corr-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:${COLORS.textMuted}; }
  .corr-legend-dot { width:10px; height:10px; border-radius:2px; flex-shrink:0; }
`

const PERIODS = [
  { id: '3mo', label: '3M' },
  { id: '1y',  label: '1A' },
  { id: '2y',  label: '2A' },
]

export default function CorrelationMatrix({ investments }) {
  const [range, setRange]       = useState('1y')
  const [histories, setHistories] = useState({})
  const [loading, setLoading]   = useState(false)
  const [popup, setPopup]       = useState(null) // { x, y, r, c, corr }

  // Actius elegibles (amb ticker i tipus invertible)
  const assets = useMemo(() =>
    investments.filter(inv => inv.ticker && !['efectiu', 'estalvi'].includes(inv.type))
  , [investments])

  // Fetch historials
  useEffect(() => {
    if (!assets.length) return
    setLoading(true)
    setHistories({})
    Promise.all(
      assets.map(async inv => ({
        id:   inv.id,
        name: inv.name,
        ticker: inv.ticker,
        prices: await fetchPriceHistory(inv.ticker, range),
      }))
    ).then(results => {
      const map = {}
      results.forEach(r => { if (r.prices?.length) map[r.id] = r })
      setHistories(map)
      setLoading(false)
    })
  }, [assets.length, range]) // eslint-disable-line

  // Matriu de correlació
  const matrix = useMemo(() => {
    const ids  = Object.keys(histories)
    const data = {}
    ids.forEach(a => {
      data[a] = {}
      ids.forEach(b => {
        if (a === b) { data[a][b] = 1; return }
        const ra = weeklyReturns(histories[a].prices.map(p => p.price))
        const rb = weeklyReturns(histories[b].prices.map(p => p.price))
        data[a][b] = pearson(ra, rb)
      })
    })
    return { ids, data }
  }, [histories])

  // Diversificadors: actiu amb correlació mitjana més baixa amb la resta
  const diversifiers = useMemo(() => {
    const { ids, data } = matrix
    if (ids.length < 2) return []
    return ids.map(id => {
      const others = ids.filter(x => x !== id)
      const vals   = others.map(o => data[id][o]).filter(v => v !== null)
      const avg    = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
      return { id, name: histories[id]?.name || id, avg }
    })
    .filter(x => x.avg !== null)
    .sort((a, b) => a.avg - b.avg)
  }, [matrix, histories])

  // Gràfic de preus normalitzats (base 100)
  const chartData = useMemo(() => {
    const ids = Object.keys(histories)
    if (!ids.length) return []
    // Troba dates comunes
    const allDates = new Set()
    ids.forEach(id => histories[id].prices.forEach(p => allDates.add(p.date)))
    const sorted = [...allDates].sort()
    return sorted.map(date => {
      const row = { date: date.slice(5) }
      ids.forEach(id => {
        const prices = histories[id].prices
        const base   = prices[0]?.price
        const pt     = prices.find(p => p.date === date) ||
                       [...prices].reverse().find(p => p.date <= date)
        if (pt && base) row[histories[id].name] = +((pt.price / base - 1) * 100).toFixed(2)
      })
      return row
    })
  }, [histories])

  const ids = matrix.ids

  if (!assets.length) return null

  return (
    <div className="corr">
      <style>{styles}</style>

      {/* Period selector */}
      <div>
        <p className="corr-section-title">Correlació entre actius</p>
        <div className="corr-periods">
          {PERIODS.map(p => (
            <button key={p.id} className={`corr-period${range === p.id ? ' on' : ''}`} onClick={() => setRange(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="corr-loading"><div className="corr-spin"/> Carregant historial de preus...</div>
      ) : ids.length < 2 ? (
        <p style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', padding: '20px 0' }}>
          Necessites almenys 2 actius amb ticker per calcular la correlació
        </p>
      ) : (<>

        {/* Heatmap */}
        <div className="corr-heatmap-wrap">
          <table className="corr-table">
            <thead>
              <tr>
                <th className="corr-th row"/>
                {ids.map(id => (
                  <th key={id} className="corr-th" title={histories[id]?.name}>
                    {histories[id]?.ticker || histories[id]?.name?.slice(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ids.map((rowId, ri) => (
                <tr key={rowId}>
                  <td className="corr-th row" title={histories[rowId]?.name}>
                    {histories[rowId]?.ticker || histories[rowId]?.name?.slice(0, 8)}
                  </td>
                  {ids.map((colId, ci) => {
                    const v    = matrix.data[rowId]?.[colId]
                    const self = rowId === colId
                    const bg   = self ? COLORS.elevated : correlColor(v)
                    const tc   = self ? COLORS.textMuted : '#fff'
                    return (
                      <td key={colId}
                        className={`corr-cell${self ? ' self' : ''}`}
                        style={{ background: bg, color: tc }}
                        onMouseEnter={e => {
                          if (!self) setPopup({
                            x: e.clientX, y: e.clientY,
                            nameA: histories[rowId]?.name,
                            nameB: histories[colId]?.name,
                            v,
                          })
                        }}
                        onMouseMove={e => setPopup(p => p ? { ...p, x: e.clientX, y: e.clientY } : p)}
                        onMouseLeave={() => setPopup(null)}
                      >
                        {self ? '—' : v !== null ? v.toFixed(2) : '?'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Llegenda */}
        <div className="corr-legend">
          {[
            { color:'rgba(255,59,59,0.75)',   label:'Molt alta (>0.8)'   },
            { color:'rgba(255,149,0,0.65)',   label:'Alta (0.5–0.8)'     },
            { color:'rgba(255,230,0,0.35)',   label:'Moderada (0.2–0.5)' },
            { color:'rgba(80,210,110,0.50)',  label:'Baixa (-0.2–0.2)'   },
            { color:'rgba(0,212,255,0.55)',   label:'Negativa (<-0.2)'   },
          ].map(l => (
            <div key={l.label} className="corr-legend-item">
              <div className="corr-legend-dot" style={{ background: l.color }}/>
              {l.label}
            </div>
          ))}
        </div>

        {/* Millors diversificadors */}
        {diversifiers.length > 0 && (
          <div>
            <p className="corr-section-title">Millors diversificadors del portfoli</p>
            {diversifiers.slice(0, 5).map((d, i) => {
              const isGood = d.avg <= 0.2
              const color  = d.avg <= 0 ? COLORS.neonCyan : d.avg <= 0.2 ? COLORS.neonGreen : d.avg <= 0.5 ? COLORS.neonAmber : COLORS.neonRed
              const barPct = Math.max(0, Math.min(100, ((1 - d.avg) / 2) * 100))
              return (
                <div key={d.id} className="corr-div-row">
                  <span className="corr-div-rank">#{i + 1}</span>
                  <span className="corr-div-name">{d.name}</span>
                  <div className="corr-div-bar-wrap">
                    <div className="corr-div-bar" style={{ width: `${barPct}%`, background: color }}/>
                  </div>
                  <span className="corr-div-val" style={{ color }}>{d.avg.toFixed(2)}</span>
                  <span className="corr-div-lbl">{correlLabel(d.avg)}</span>
                </div>
              )
            })}
            <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 10, lineHeight: 1.6 }}>
              Correlació mitjana amb la resta del portfoli. Com més baixa, millor diversificació.
              Valors propers a 0 o negatius indiquen que l'actiu es mou de forma independent.
            </p>
          </div>
        )}

        {/* Gràfic normalitzat */}
        {chartData.length > 1 && (
          <div>
            <p className="corr-section-title">Evolució comparada (base 100%)</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: FONTS.mono, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 5)} />
                <YAxis tick={{ fontSize: 10, fontFamily: FONTS.mono, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={38} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`} />
                <Tooltip content={<NormTooltip />} cursor={{ stroke: COLORS.borderMid, strokeWidth: 1 }} />
                {ids.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={histories[id]?.name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={1.5} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {/* Mini llegenda */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {ids.map((id, i) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: COLORS.textMuted }}>
                  <div style={{ width: 20, height: 2, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 1, flexShrink: 0 }}/>
                  {histories[id]?.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}

      {/* Popup tooltip */}
      {popup && (
        <div className="corr-popup" style={{ left: popup.x + 12, top: popup.y - 10 }}>
          <p className="corr-popup-pair">{popup.nameA} · {popup.nameB}</p>
          <p className="corr-popup-val" style={{ color: correlColor(popup.v) }}>
            {popup.v !== null ? popup.v.toFixed(3) : '—'}
          </p>
          <p className="corr-popup-lbl" style={{ color: correlColor(popup.v) }}>
            {correlLabel(popup.v)}
          </p>
          <p className="corr-popup-exp">{correlExplain(popup.v)}</p>
        </div>
      )}
    </div>
  )
}