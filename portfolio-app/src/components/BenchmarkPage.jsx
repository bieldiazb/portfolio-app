import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const BENCHMARKS = [
  { id:'IWDA.AS', label:'MSCI World',    color:COLORS.neonCyan   },
  { id:'GSPC=X',  label:'S&P 500',       color:COLORS.neonAmber  },
  { id:'VWCE.DE', label:'FTSE All-World', color:COLORS.neonPurple },
]

const PERIODS = [
  { id:'3M',  label:'3M',  months:3,   range:'3mo', interval:'1wk' },
  { id:'1Y',  label:'1A',  months:12,  range:'1y',  interval:'1mo' },
  { id:'3Y',  label:'3A',  months:36,  range:'3y',  interval:'1mo' },
  { id:'ALL', label:'Tot', months:999, range:'5y',  interval:'1mo' },
]

const fetchYahoo = async (ticker, range, interval) => {
  try {
    const res = await fetch(`/yahoo/v8/finance/chart/${ticker}?range=${range}&interval=${interval}&includePrePost=false`,{signal:AbortSignal.timeout(10000)})
    if (!res.ok) return []
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const timestamps = result.timestamp||[]
    const closes = result.indicators?.quote?.[0]?.close||[]
    return timestamps.map((t,i)=>({date:new Date(t*1000).toISOString().split('T')[0],price:closes[i]})).filter(p=>p.price!=null)
  } catch { return [] }
}

const styles = `
  .bm { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  .bm-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .bm-sub   { font-size:12px; color:${COLORS.textMuted}; }

  .bm-panel { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:18px; }
  .bm-top   { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
  .bm-panel-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }

  .bm-tabs { display:flex; gap:1px; background:${COLORS.border}; border-radius:4px; overflow:hidden; }
  .bm-tab  { padding:5px 11px; border:none; background:${COLORS.surface}; font-family:${FONTS.mono}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; }
  .bm-tab:hover { color:${COLORS.textSecondary}; background:${COLORS.elevated}; }
  .bm-tab.on { background:${COLORS.elevated}; color:${COLORS.textPrimary}; }

  .bm-legend { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px; }
  .bm-li     { display:flex; align-items:center; gap:5px; font-size:10px; color:${COLORS.textMuted}; }
  .bm-li-dot { width:6px; height:2px; border-radius:1px; flex-shrink:0; }

  .bm-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:40px 0; font-size:12px; color:${COLORS.textMuted}; }
  .bm-spin { width:13px; height:13px; border:1.5px solid ${COLORS.border}; border-top-color:${COLORS.textSecondary}; border-radius:50%; animation:bmspin .7s linear infinite; flex-shrink:0; }
  @keyframes bmspin { to { transform:rotate(360deg); } }

  .bm-error { padding:28px 0; text-align:center; }
  .bm-error-main { font-size:12px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .bm-error-sub  { font-size:11px; color:${COLORS.textMuted}; opacity:0.6; margin-bottom:12px; }
  .bm-retry { padding:7px 16px; border:1px solid ${COLORS.border}; background:transparent; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .bm-retry:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }

  /* Returns table */
  .bm-table { margin-top:14px; padding-top:14px; border-top:1px solid ${COLORS.border}; }
  .bm-tr { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid ${COLORS.border}; }
  .bm-tr:last-child { border-bottom:none; }
  .bm-tr-name { flex:1; font-size:12px; color:${COLORS.textMuted}; }
  .bm-tr-name.mine { color:${COLORS.textPrimary}; font-weight:600; }
  .bm-tr-bar-wrap { width:70px; height:2px; background:${COLORS.border}; border-radius:1px; overflow:hidden; margin:0 12px; flex-shrink:0; }
  .bm-tr-bar { height:100%; border-radius:1px; transition:width 500ms; }
  .bm-tr-val { font-family:${FONTS.mono}; font-size:11px; font-weight:600; min-width:52px; text-align:right; font-variant-numeric:tabular-nums; }
  .bm-win  { color:${COLORS.neonGreen}; }
  .bm-lose { color:${COLORS.neonRed}; }
  .bm-neu  { color:${COLORS.textMuted}; }

  .bm-summary { margin-top:10px; padding:10px 12px; border-radius:4px; font-size:11px; line-height:1.6; }
  .bm-summary.out { background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; color:${COLORS.textSecondary}; }
  .bm-summary.und { background:${COLORS.bgRed};   border:1px solid ${COLORS.borderRed};   color:${COLORS.textSecondary}; }

  .bm-note { margin-top:10px; padding:10px 12px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; border-radius:4px; font-size:11px; color:${COLORS.textMuted}; }
`

const BmTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'8px 12px', fontFamily:FONTS.sans, minWidth:130 }}>
      <p style={{ fontSize:10, color:COLORS.textMuted, marginBottom:5 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:2 }}>
          <span style={{ fontSize:10, color:p.color }}>{p.name}</span>
          <span style={{ fontSize:11, fontFamily:FONTS.mono, fontWeight:600, color:parseFloat(p.value)>=0?COLORS.neonGreen:COLORS.neonRed }}>
            {parseFloat(p.value)>=0?'+':''}{parseFloat(p.value).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export default function BenchmarkPage({ snapshots=[] }) {
  const [period, setPeriod]         = useState('1Y')
  const [benchData, setBenchData]   = useState({})
  const [loading, setLoading]       = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const p = PERIODS.find(x=>x.id===period)
    if (!p) return
    setLoading(true); setFetchError(false)
    Promise.all(BENCHMARKS.map(async bm=>({id:bm.id,prices:await fetchYahoo(bm.id,p.range,p.interval)})))
      .then(results => {
        const map={}; results.forEach(r=>{map[r.id]=r.prices})
        setBenchData(map); setLoading(false)
        if (Object.values(map).every(arr=>arr.length===0)) setFetchError(true)
      })
  }, [period, retryCount])

  const portfolioReturn = useMemo(() => {
    if (snapshots.length<2) return null
    const months=PERIODS.find(p=>p.id===period)?.months??12
    const cutoff=new Date(); cutoff.setMonth(cutoff.getMonth()-months)
    const sorted=[...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date))
    const inRange=sorted.filter(s=>new Date(s.date)>=cutoff)
    if (inRange.length<2) return null
    const start=inRange[0].total, end=inRange[inRange.length-1].total
    return start>0?((end-start)/start)*100:null
  }, [snapshots,period])

  const chartData = useMemo(() => {
    const snapSorted=[...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date))
    const allDates=new Set()
    snapSorted.forEach(s=>allDates.add(s.date))
    BENCHMARKS.forEach(bm=>(benchData[bm.id]||[]).forEach(p=>allDates.add(p.date)))
    const sorted=[...allDates].sort()
    if (sorted.length<2) return []
    const basePortfolio=snapSorted[0]?.total
    const baseBench={}
    BENCHMARKS.forEach(bm=>{baseBench[bm.id]=(benchData[bm.id]||[])[0]?.price})
    return sorted.map(date=>{
      const row={date:date.slice(5)}
      const snap=[...snapSorted].reverse().find(s=>s.date<=date)
      if (snap&&basePortfolio) row['Cartera']=+((snap.total/basePortfolio-1)*100).toFixed(2)
      BENCHMARKS.forEach(bm=>{
        const p=[...(benchData[bm.id]||[])].reverse().find(x=>x.date<=date)
        if (p&&baseBench[bm.id]) row[bm.label]=+((p.price/baseBench[bm.id]-1)*100).toFixed(2)
      })
      return row
    })
  }, [snapshots,benchData])

  const returns = useMemo(() => {
    const list=[]
    if (portfolioReturn!==null) list.push({name:'La meva cartera',ret:portfolioReturn,color:COLORS.neonGreen,isPortfolio:true})
    BENCHMARKS.forEach(bm=>{
      const prices=benchData[bm.id]||[]
      if (prices.length<2) return
      list.push({name:bm.label,ret:((prices[prices.length-1].price-prices[0].price)/prices[0].price)*100,color:bm.color})
    })
    const months=PERIODS.find(p=>p.id===period)?.months??12
    list.push({name:'Inflació (IPC)',ret:+(2.9*months/12).toFixed(1),color:COLORS.textMuted})
    return list.sort((a,b)=>b.ret-a.ret)
  }, [portfolioReturn,benchData,period])

  const maxRet      = Math.max(...returns.map(r=>Math.abs(r.ret)),1)
  const pRank       = returns.findIndex(r=>r.isPortfolio)
  const outperforms = pRank===0

  return (
    <div className="bm">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="bm-title">Benchmark vs mercat</h2>
        <p className="bm-sub">Compara el teu portfoli amb els principals índexs</p>
      </div>

      <div className="bm-panel">
        <div className="bm-top">
          <p className="bm-panel-title">Rendiment normalitzat (base 0%)</p>
          <div className="bm-tabs">
            {PERIODS.map(p=>(
              <button key={p.id} className={`bm-tab${period===p.id?' on':''}`} onClick={()=>setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>

        <div className="bm-legend">
          <div className="bm-li"><div className="bm-li-dot" style={{background:COLORS.neonGreen}}/> La meva cartera</div>
          {BENCHMARKS.map(bm=>(
            <div key={bm.id} className="bm-li"><div className="bm-li-dot" style={{background:bm.color}}/> {bm.label}</div>
          ))}
        </div>

        {loading ? (
          <div className="bm-loading"><div className="bm-spin"/> Carregant dades de mercat...</div>
        ) : fetchError ? (
          <div className="bm-error">
            <p className="bm-error-main">No s'han pogut carregar les dades</p>
            <p className="bm-error-sub">Yahoo Finance pot estar temporalment no disponible</p>
            <button className="bm-retry" onClick={()=>setRetryCount(c=>c+1)}>Tornar a intentar</button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
              <XAxis dataKey="date" tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} interval={Math.floor((chartData.length||1)/5)} />
              <YAxis tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} width={36} tickFormatter={v=>`${v>0?'+':''}${v.toFixed(0)}%`} />
              <ReferenceLine y={0} stroke={COLORS.border} strokeWidth={1} />
              <Tooltip content={<BmTooltip/>} cursor={{stroke:COLORS.borderMid,strokeWidth:1}} />
              <Line type="monotone" dataKey="Cartera" stroke={COLORS.neonGreen} strokeWidth={1.5} dot={false} connectNulls />
              {BENCHMARKS.map(bm=>(
                <Line key={bm.id} type="monotone" dataKey={bm.label} stroke={bm.color} strokeWidth={1} dot={false} strokeDasharray="4 2" connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {!loading&&!fetchError&&returns.length>0 && (
          <div className="bm-table">
            {returns.map((r,i)=>(
              <div key={i} className="bm-tr">
                <div className={`bm-tr-name${r.isPortfolio?' mine':''}`}>{r.name}</div>
                <div className="bm-tr-bar-wrap">
                  <div className="bm-tr-bar" style={{width:`${Math.abs(r.ret)/maxRet*100}%`,background:r.color}}/>
                </div>
                <div className={`bm-tr-val ${r.ret>2?'bm-win':r.ret<0?'bm-lose':'bm-neu'}`}>
                  {r.ret>=0?'+':''}{r.ret.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading&&!fetchError&&portfolioReturn!==null && (
          <div className={`bm-summary ${outperforms?'out':'und'}`}>
            {outperforms
              ? <><strong style={{color:COLORS.neonGreen}}>La cartera supera tots els índexs</strong> en el període seleccionat.</>
              : <>La cartera queda per sota d'alguns índexs. Revisa la distribució al <strong>Rebalanceig</strong>.</>
            }
          </div>
        )}

        {snapshots.length<5 && (
          <div className="bm-note">El rendiment propi es calcularà quan s'acumulin més dies de dades d'historial.</div>
        )}
      </div>
    </div>
  )
}