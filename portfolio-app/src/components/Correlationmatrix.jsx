import { useState, useEffect, useMemo, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { COLORS, FONTS, CHART_COLORS, SHARED_STYLES } from './design-tokens'

const NUM = `'DM Sans', system-ui, sans-serif`

// ── Fetch amb fallback query1 → query2 ────────────────────────────────────────
async function fetchPriceHistory(ticker, range = '1y') {
  const urls = [
    `/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1wk&range=${range}`,
    `/yahoo2/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1wk&range=${range}`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      const data   = await res.json()
      const result = data?.chart?.result?.[0]
      if (!result) continue
      const timestamps = result.timestamp || []
      const closes     = result.indicators?.quote?.[0]?.close || []
      const pts = timestamps
        .map((t, i) => ({ date: new Date(t * 1000).toISOString().split('T')[0], price: closes[i] }))
        .filter(p => p.price != null && p.price > 0)
      if (pts.length >= 8) return pts   // mínim 8 punts per ser útil
    } catch { continue }
  }
  return null
}

// ── Correlació de Pearson sobre retorns ──────────────────────────────────────
function weeklyReturns(prices) {
  const r = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] > 0) r.push((prices[i] - prices[i-1]) / prices[i-1])
  }
  return r
}

function pearson(a, b) {
  // Alinea per longitud mínima
  const n = Math.min(a.length, b.length)
  if (n < 6) return null
  const xa = a.slice(-n), xb = b.slice(-n)
  const ma = xa.reduce((s,v)=>s+v,0)/n, mb = xb.reduce((s,v)=>s+v,0)/n
  let num=0, da=0, db=0
  for (let i=0;i<n;i++) {
    const A=xa[i]-ma, B=xb[i]-mb
    num+=A*B; da+=A*A; db+=B*B
  }
  const denom = Math.sqrt(da*db)
  return denom===0 ? null : +(num/denom).toFixed(3)
}

// ── Colors semàntics ──────────────────────────────────────────────────────────
function correlColor(v) {
  if (v===null) return 'rgba(255,255,255,0.05)'
  if (v>=0.8)   return 'rgba(255,59,59,0.70)'
  if (v>=0.5)   return 'rgba(255,149,0,0.60)'
  if (v>=0.2)   return 'rgba(255,220,0,0.30)'
  if (v>=-0.2)  return 'rgba(0,255,136,0.40)'
  return 'rgba(0,212,255,0.55)'
}
function correlLabel(v) {
  if (v===null) return '?'
  if (v>=0.8)   return 'Molt alta'
  if (v>=0.5)   return 'Alta'
  if (v>=0.2)   return 'Moderada'
  if (v>=-0.2)  return 'Baixa'
  return 'Negativa'
}
function correlTextColor(v) {
  if (v===null) return 'rgba(255,255,255,0.20)'
  if (v>=0.8)   return '#ff3b3b'
  if (v>=0.5)   return '#ff9500'
  if (v>=0.2)   return '#ffd60a'
  if (v>=-0.2)  return COLORS.neonGreen
  return COLORS.neonCyan
}

const NormTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  const sorted = [...payload].sort((a,b)=>(b.value||0)-(a.value||0))
  return (
    <div style={{background:'#1a1a1a',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px',fontFamily:FONTS.sans,minWidth:140}}>
      <p style={{fontSize:10,color:'rgba(255,255,255,0.30)',marginBottom:6}}>{label}</p>
      {sorted.filter(p=>p.value!=null).map((p,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:3}}>
          <span style={{fontSize:10,color:p.color,fontWeight:500}}>{p.name}</span>
          <span style={{fontSize:11,fontFamily:NUM,fontWeight:500,color:p.value>=0?COLORS.neonGreen:COLORS.neonRed,fontVariantNumeric:'tabular-nums'}}>
            {p.value>=0?'+':''}{p.value?.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

const PERIODS = [
  { id:'3mo', label:'3M' },
  { id:'1y',  label:'1A' },
  { id:'2y',  label:'2A' },
]

const styles = `
  .corr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:14px; margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.05); }

  .corr-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .corr-panel-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
  .corr-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  .corr-periods { display:flex; gap:3px; }
  .corr-period { padding:4px 10px; border-radius:20px; border:1px solid rgba(255,255,255,0.07); background:transparent; font-family:${NUM}; font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); cursor:pointer; transition:all 100ms; }
  .corr-period:hover { color:rgba(255,255,255,0.65); border-color:rgba(255,255,255,0.15); }
  .corr-period.on { background:rgba(0,255,136,0.09); border-color:rgba(0,255,136,0.25); color:${COLORS.neonGreen}; }

  /* Heatmap */
  .corr-heatmap-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .corr-table { border-collapse:separate; border-spacing:3px; }
  .corr-th { font-size:9px; font-weight:600; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.08em; padding:4px 6px; text-align:center; white-space:nowrap; max-width:64px; overflow:hidden; text-overflow:ellipsis; }
  .corr-th.row { text-align:right; padding-right:10px; max-width:90px; font-size:9px; }
  .corr-cell {
    width:54px; height:48px; text-align:center; border-radius:6px;
    font-size:12px; font-weight:700; font-family:${NUM};
    cursor:pointer; transition:transform 80ms, opacity 80ms;
    position:relative; font-variant-numeric:tabular-nums;
  }
  .corr-cell:hover { transform:scale(1.06); z-index:2; }
  .corr-cell.self { background:rgba(255,255,255,0.04); cursor:default; }
  .corr-cell.no-data { cursor:default; }

  /* Popup */
  .corr-popup {
    position:fixed; background:#1c1c1c;
    border:1px solid rgba(255,255,255,0.10);
    border-radius:10px; padding:13px 15px; z-index:100; min-width:200px;
    pointer-events:none; box-shadow:0 12px 36px rgba(0,0,0,0.60);
  }
  .corr-popup-pair { font-size:11px; color:rgba(255,255,255,0.40); margin-bottom:6px; line-height:1.5; }
  .corr-popup-val  { font-size:28px; font-weight:200; font-family:${NUM}; margin-bottom:3px; font-variant-numeric:tabular-nums; }
  .corr-popup-lbl  { font-size:11px; font-weight:700; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.08em; }
  .corr-popup-exp  { font-size:11px; color:rgba(255,255,255,0.45); line-height:1.6; }
  .corr-popup-nodata { font-size:12px; color:rgba(255,255,255,0.30); }

  /* Diversificadors */
  .corr-div-row { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .corr-div-row:last-child { border-bottom:none; }
  .corr-div-rank { width:24px; font-size:11px; font-weight:600; font-family:${NUM}; color:rgba(255,255,255,0.22); flex-shrink:0; }
  .corr-div-name { flex:1; font-size:12px; font-weight:500; color:rgba(255,255,255,0.60); min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .corr-div-bar-wrap { width:70px; height:3px; background:rgba(255,255,255,0.05); border-radius:2px; margin:0 10px; flex-shrink:0; }
  .corr-div-bar { height:100%; border-radius:2px; }
  .corr-div-val { font-size:12px; font-weight:600; font-family:${NUM}; min-width:38px; text-align:right; flex-shrink:0; font-variant-numeric:tabular-nums; }
  .corr-div-lbl { font-size:9px; color:rgba(255,255,255,0.25); min-width:52px; text-align:right; flex-shrink:0; margin-left:6px; }

  /* Loading */
  .corr-loading { display:flex; align-items:center; gap:8px; padding:32px 0; font-size:12px; color:rgba(255,255,255,0.30); justify-content:center; }
  .corr-spin { width:12px; height:12px; border:1.5px solid rgba(255,255,255,0.08); border-top-color:${COLORS.neonGreen}; border-radius:50%; animation:corrspin .7s linear infinite; }
  @keyframes corrspin { to { transform:rotate(360deg); } }

  /* Llegenda */
  .corr-legend { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); }
  .corr-legend-item { display:flex; align-items:center; gap:5px; font-size:9px; color:rgba(255,255,255,0.30); }
  .corr-legend-dot { width:10px; height:10px; border-radius:3px; flex-shrink:0; }

  /* Progress fetch */
  .corr-progress { display:flex; align-items:center; gap:6px; font-size:10px; color:rgba(255,255,255,0.30); margin-bottom:10px; }
  .corr-progress-bar-wrap { flex:1; height:2px; background:rgba(255,255,255,0.06); border-radius:1px; overflow:hidden; }
  .corr-progress-bar { height:100%; background:${COLORS.neonGreen}; border-radius:1px; transition:width 300ms; }
`

export default function CorrelationMatrix({ investments }) {
  const [range, setRange]       = useState('1y')
  const [histories, setHistories] = useState({})
  const [loading, setLoading]   = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const [popup, setPopup]       = useState(null)
  const popupRef = useRef(null)

  // Actius elegibles — tots els que tenen ticker excepte efectiu/estalvi
  const assets = useMemo(() =>
    (investments||[]).filter(inv => inv.ticker && !['efectiu','estalvi'].includes(inv.type))
  , [investments])

  // Fetch amb progress
  useEffect(() => {
    if (!assets.length) return
    setLoading(true)
    setHistories({})
    setLoadedCount(0)

    let count = 0
    Promise.all(
      assets.map(async inv => {
        const prices = await fetchPriceHistory(inv.ticker, range)
        count++
        setLoadedCount(count)
        return { id: inv.id, name: inv.name, ticker: inv.ticker, prices }
      })
    ).then(results => {
      const map = {}
      results.forEach(r => { if (r.prices?.length >= 6) map[r.id] = r })
      setHistories(map)
      setLoading(false)
    })
  }, [assets.length, range]) // eslint-disable-line

  // Matriu de correlació (ara amb alineació per dates)
  const matrix = useMemo(() => {
    const ids = Object.keys(histories)
    const data = {}
    ids.forEach(a => {
      data[a] = {}
      ids.forEach(b => {
        if (a===b) { data[a][b]=1; return }
        // Alinea per dates comunes
        const pricesA = histories[a].prices
        const pricesB = histories[b].prices
        const datesA  = new Set(pricesA.map(p=>p.date))
        const datesB  = new Set(pricesB.map(p=>p.date))
        const common  = [...datesA].filter(d=>datesB.has(d)).sort()
        if (common.length < 8) { data[a][b]=null; return }
        const ra = weeklyReturns(common.map(d=>pricesA.find(p=>p.date===d)?.price||0).filter(p=>p>0))
        const rb = weeklyReturns(common.map(d=>pricesB.find(p=>p.date===d)?.price||0).filter(p=>p>0))
        data[a][b] = pearson(ra, rb)
      })
    })
    return { ids, data }
  }, [histories])

  // Diversificadors
  const diversifiers = useMemo(() => {
    const { ids, data } = matrix
    if (ids.length < 2) return []
    return ids.map(id => {
      const others = ids.filter(x=>x!==id)
      const vals   = others.map(o=>data[id][o]).filter(v=>v!==null)
      const avg    = vals.length ? vals.reduce((s,v)=>s+v,0)/vals.length : null
      return { id, name: histories[id]?.name||id, avg }
    })
    .filter(x=>x.avg!==null)
    .sort((a,b)=>a.avg-b.avg)
  }, [matrix, histories])

  // Gràfic normalitzat per dates (alinea tots els actius)
  const chartData = useMemo(() => {
    const ids = Object.keys(histories)
    if (!ids.length) return []
    const allDates = new Set()
    ids.forEach(id => histories[id].prices.forEach(p=>allDates.add(p.date)))
    const sorted = [...allDates].sort()
    return sorted.map(date => {
      const row = { date: date.slice(5) }
      ids.forEach(id => {
        const prices = histories[id].prices
        const base   = prices[0]?.price
        const pt     = prices.find(p=>p.date===date) || [...prices].reverse().find(p=>p.date<=date)
        if (pt && base) row[histories[id].ticker||histories[id].name] = +((pt.price/base-1)*100).toFixed(2)
      })
      return row
    })
  }, [histories])

  const ids = matrix.ids
  const progressPct = assets.length > 0 ? (loadedCount/assets.length)*100 : 0

  if (!assets.length) return null

  return (
    <div className="corr">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* ── Heatmap ── */}
      <div className="corr-panel">
        <div className="corr-panel-hdr">
          <p className="corr-panel-title">Correlació entre actius</p>
          <div className="corr-periods">
            {PERIODS.map(p=>(
              <button key={p.id} className={`corr-period${range===p.id?' on':''}`} onClick={()=>setRange(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <>
            <div className="corr-progress">
              <div className="corr-progress-bar-wrap">
                <div className="corr-progress-bar" style={{width:`${progressPct}%`}}/>
              </div>
              <span>{loadedCount}/{assets.length} actius</span>
            </div>
            <div className="corr-loading"><div className="corr-spin"/> Carregant historial de preus...</div>
          </>
        ) : ids.length < 2 ? (
          <p style={{fontSize:12,color:'rgba(255,255,255,0.25)',textAlign:'center',padding:'24px 0'}}>
            Necessites almenys 2 actius amb ticker vàlid i suficients dades per calcular la correlació
          </p>
        ) : (
          <>
            <div className="corr-heatmap-wrap">
              <table className="corr-table">
                <thead>
                  <tr>
                    <th className="corr-th row"/>
                    {ids.map(id=>(
                      <th key={id} className="corr-th" title={histories[id]?.name}>
                        {histories[id]?.ticker || histories[id]?.name?.slice(0,6)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ids.map((rowId)=>(
                    <tr key={rowId}>
                      <td className="corr-th row" title={histories[rowId]?.name}>
                        {histories[rowId]?.ticker || histories[rowId]?.name?.slice(0,8)}
                      </td>
                      {ids.map((colId)=>{
                        const v    = matrix.data[rowId]?.[colId]
                        const self = rowId===colId
                        const noD  = !self && v===null
                        const bg   = self ? 'rgba(255,255,255,0.04)' : correlColor(v)
                        const tc   = self ? 'rgba(255,255,255,0.20)' : correlTextColor(v)
                        return (
                          <td key={colId}
                            className={`corr-cell${self?' self':''}${noD?' no-data':''}`}
                            style={{background:bg, color:tc}}
                            onMouseEnter={e=>{
                              if(!self) setPopup({
                                x:e.clientX, y:e.clientY,
                                nameA:`${histories[rowId]?.ticker} – ${histories[rowId]?.name}`,
                                nameB:`${histories[colId]?.ticker} – ${histories[colId]?.name}`,
                                v,
                              })
                            }}
                            onMouseMove={e=>setPopup(p=>p?{...p,x:e.clientX,y:e.clientY}:p)}
                            onMouseLeave={()=>setPopup(null)}
                          >
                            {self ? '—' : v!==null ? v.toFixed(2) : (
                              <span style={{fontSize:14,opacity:0.35}}>?</span>
                            )}
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
                {color:'rgba(255,59,59,0.70)',   label:'Molt alta (>0.8)'},
                {color:'rgba(255,149,0,0.60)',   label:'Alta (0.5–0.8)'},
                {color:'rgba(255,220,0,0.30)',   label:'Moderada (0.2–0.5)'},
                {color:'rgba(0,255,136,0.40)',   label:'Baixa (-0.2–0.2)'},
                {color:'rgba(0,212,255,0.55)',   label:'Negativa (<-0.2)'},
              ].map(l=>(
                <div key={l.label} className="corr-legend-item">
                  <div className="corr-legend-dot" style={{background:l.color}}/>
                  {l.label}
                </div>
              ))}
            </div>

            {/* Info actius sense dades */}
            {assets.filter(a=>!ids.includes(a.id)).length>0 && (
              <p style={{fontSize:10,color:'rgba(255,255,255,0.20)',marginTop:10,lineHeight:1.6}}>
                ⚠ {assets.filter(a=>!ids.includes(a.id)).map(a=>a.ticker).join(', ')} — sense dades suficients per calcular (ticker incorrecte o historial massa curt)
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Millors diversificadors ── */}
      {!loading && diversifiers.length>0 && (
        <div className="corr-panel">
          <p className="corr-panel-title" style={{marginBottom:12}}>Millors diversificadors del portfoli</p>
          {diversifiers.slice(0,5).map((d,i)=>{
            const color  = d.avg<=0?COLORS.neonCyan:d.avg<=0.2?COLORS.neonGreen:d.avg<=0.5?COLORS.neonAmber:COLORS.neonRed
            const barPct = Math.max(0,Math.min(100,((1-d.avg)/2)*100))
            return (
              <div key={d.id} className="corr-div-row">
                <span className="corr-div-rank">#{i+1}</span>
                <span className="corr-div-name">{d.name}</span>
                <div className="corr-div-bar-wrap">
                  <div className="corr-div-bar" style={{width:`${barPct}%`,background:color}}/>
                </div>
                <span className="corr-div-val" style={{color}}>{d.avg.toFixed(2)}</span>
                <span className="corr-div-lbl">{correlLabel(d.avg)}</span>
              </div>
            )
          })}
          <p style={{fontSize:10,color:'rgba(255,255,255,0.20)',marginTop:10,lineHeight:1.6}}>
            Correlació mitjana amb la resta del portfoli. Com més baixa, millor diversificació.
          </p>
        </div>
      )}

      {/* ── Gràfic evolució comparada ── */}
      {!loading && chartData.length>1 && ids.length>0 && (
        <div className="corr-panel">
          <p className="corr-panel-title" style={{marginBottom:14}}>Evolució comparada (base 0%)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
              <XAxis dataKey="date" tick={{fontSize:9,fontFamily:NUM,fill:'rgba(255,255,255,0.22)'}} axisLine={false} tickLine={false} interval={Math.floor(chartData.length/5)}/>
              <YAxis tick={{fontSize:9,fontFamily:NUM,fill:'rgba(255,255,255,0.22)'}} axisLine={false} tickLine={false} width={36} tickFormatter={v=>`${v>0?'+':''}${v.toFixed(0)}%`}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
              <Tooltip content={<NormTooltip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
              {ids.map((id,i)=>(
                <Line key={id} type="monotone"
                  dataKey={histories[id]?.ticker||histories[id]?.name}
                  stroke={CHART_COLORS[i%CHART_COLORS.length]}
                  strokeWidth={1.5} dot={false} connectNulls
                  name={histories[id]?.ticker||histories[id]?.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Mini llegenda */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            {ids.map((id,i)=>(
              <div key={id} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'rgba(255,255,255,0.35)'}}>
                <div style={{width:18,height:2,background:CHART_COLORS[i%CHART_COLORS.length],borderRadius:1,flexShrink:0}}/>
                {histories[id]?.ticker} — {histories[id]?.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popup tooltip */}
      {popup && (
        <div className="corr-popup" style={{
          left: Math.min(popup.x+14, window.innerWidth-220),
          top:  Math.max(popup.y-90, 8),
        }}>
          <p className="corr-popup-pair">{popup.nameA}</p>
          <p className="corr-popup-pair" style={{marginBottom:8}}>↕ {popup.nameB}</p>
          {popup.v!==null ? (
            <>
              <p className="corr-popup-val" style={{color:correlTextColor(popup.v)}}>{popup.v.toFixed(3)}</p>
              <p className="corr-popup-lbl" style={{color:correlTextColor(popup.v)}}>{correlLabel(popup.v)}</p>
              <p className="corr-popup-exp">
                {popup.v>=0.8?'Es mouen gairebé igual. Poca diversificació real.':
                 popup.v>=0.5?'Tendència similar. Diversificació limitada.':
                 popup.v>=0.2?'Lleugera relació. Diversificació acceptable.':
                 popup.v>=-0.2?'Independents. Bona diversificació.':
                 'Es mouen en sentit contrari. Diversificació excel·lent.'}
              </p>
            </>
          ) : (
            <p className="corr-popup-nodata">Dades insuficients<br/>per calcular la correlació.<br/>El ticker pot ser incorrecte<br/>o tenir historial massa curt.</p>
          )}
        </div>
      )}
    </div>
  )
}