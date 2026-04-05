import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'


// Benchmarks globals sempre disponibles
const GLOBAL_BENCHMARKS = [
  { id:'IWDA.AS', label:'MSCI World',     color: COLORS.neonCyan   },
  { id:'CSPX.AS', label:'S&P 500',        color: COLORS.neonAmber  },
  { id:'VWCE.DE', label:'FTSE All-World', color: COLORS.neonPurple },
  { id:'EXW1.DE', label:'EuroStoxx 50',   color: '#c8961a'         },
  { id:'IEMG',    label:'Mercats emerg.', color: '#ff6b6b'         },
]

const PERIODS = [
  { id:'1M',  label:'1M',  range:'1mo',  interval:'1d'  },
  { id:'3M',  label:'3M',  range:'3mo',  interval:'1wk' },
  { id:'6M',  label:'6M',  range:'6mo',  interval:'1wk' },
  { id:'1Y',  label:'1A',  range:'1y',   interval:'1mo' },
  { id:'3Y',  label:'3A',  range:'3y',   interval:'1mo' },
  { id:'5Y',  label:'5A',  range:'5y',   interval:'1mo' },
]

async function fetchPrices(ticker, range, interval) {
  try {
    const r = await fetch(
      `/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}&includePrePost=false`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!r.ok) return []
    const d = await r.json()
    const res = d?.chart?.result?.[0]
    if (!res) return []
    const ts     = res.timestamp || []
    const closes = res.indicators?.quote?.[0]?.close || []
    return ts
      .map((t,i) => ({ date: new Date(t*1000).toISOString().split('T')[0], price: closes[i] }))
      .filter(p => p.price != null)
  } catch { return [] }
}

// Normalitza array de preus a base 100
function normalize(prices) {
  if (!prices.length) return []
  const base = prices[0].price
  return prices.map(p => ({ date: p.date, value: +((p.price / base - 1) * 100).toFixed(2) }))
}

const styles = `
  .bm { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* Hero */
  .bm-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .bm-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%); pointer-events:none; }
  .bm-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .bm-hero-ret { font-size:36px; font-weight:600; letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:6px; }
  .bm-hero-ret.pos { color:${COLORS.neonGreen}; }
  .bm-hero-ret.neg { color:${COLORS.neonRed}; }
  .bm-hero-ret.neu { color:rgba(255,255,255,0.40); }
  .bm-hero-sub { font-size:12px; color:rgba(255,255,255,0.30); margin-bottom:14px; }
  .bm-hero-badges { display:flex; gap:8px; flex-wrap:wrap; }
  .bm-hero-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; font-family:${FONTS.num}; padding:4px 10px; border-radius:20px; }
  .bm-hero-badge.mine { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .bm-hero-badge.bench { color:rgba(255,255,255,0.50); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
  .bm-hero-badge.out { color:${COLORS.neonGreen}; }
  .bm-hero-badge.und { color:${COLORS.neonRed}; }

  /* Panel */
  .bm-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .bm-panel-hdr { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
  .bm-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  /* Period tabs */
  .bm-periods { display:flex; gap:3px; }
  .bm-period { padding:4px 10px; border-radius:20px; border:1px solid rgba(255,255,255,0.07); background:transparent; font-family:${FONTS.num}; font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); cursor:pointer; transition:all 100ms; }
  .bm-period:hover { color:rgba(255,255,255,0.60); border-color:rgba(255,255,255,0.15); }
  .bm-period.on { background:rgba(0,255,136,0.10); border-color:rgba(0,255,136,0.25); color:${COLORS.neonGreen}; }

  /* Legend */
  .bm-legend { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
  .bm-li { display:flex; align-items:center; gap:5px; font-size:10px; color:rgba(255,255,255,0.40); cursor:pointer; padding:2px 0; transition:color 100ms; }
  .bm-li:hover { color:rgba(255,255,255,0.70); }
  .bm-li.hidden { opacity:0.35; text-decoration:line-through; }
  .bm-li-line { width:14px; height:2px; border-radius:1px; flex-shrink:0; }
  .bm-li-line.dash { background:repeating-linear-gradient(90deg,currentColor 0,currentColor 4px,transparent 4px,transparent 7px); }

  /* Gràfic */
  .bm-chart { position:relative; }
  .bm-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:50px 0; font-size:12px; color:rgba(255,255,255,0.30); }
  .bm-spin { width:12px; height:12px; border:1.5px solid rgba(255,255,255,0.08); border-top-color:${COLORS.neonGreen}; border-radius:50%; animation:bmspin .7s linear infinite; }
  @keyframes bmspin { to { transform:rotate(360deg); } }

  /* Taula de rendiments */
  .bm-table { display:flex; flex-direction:column; gap:0; }
  .bm-tr { display:flex; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .bm-tr:last-child { border-bottom:none; }
  .bm-tr-left { display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
  .bm-tr-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .bm-tr-name { font-size:12px; font-weight:500; color:rgba(255,255,255,0.55); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bm-tr-name.mine { color:#fff; font-weight:600; }
  .bm-tr-bar-wrap { width:80px; height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; margin:0 12px; flex-shrink:0; }
  .bm-tr-bar { height:100%; border-radius:2px; transition:width 500ms cubic-bezier(0.4,0,0.2,1); }
  .bm-tr-val { font-family:${FONTS.num}; font-size:13px; font-weight:500; min-width:60px; text-align:right; font-variant-numeric:tabular-nums; }
  .bm-tr-val.pos { color:${COLORS.neonGreen}; }
  .bm-tr-val.neg { color:${COLORS.neonRed}; }
  .bm-tr-val.neu { color:rgba(255,255,255,0.30); }

  /* Accions pròpies */
  .bm-assets-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }
  @media (min-width:480px) { .bm-assets-grid { grid-template-columns:repeat(3,1fr); } }
  @media (min-width:700px) { .bm-assets-grid { grid-template-columns:repeat(4,1fr); } }
  .bm-asset-chip { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); cursor:pointer; transition:all 100ms; }
  .bm-asset-chip:hover { border-color:rgba(0,255,136,0.25); background:rgba(0,255,136,0.04); }
  .bm-asset-chip.on { border-color:rgba(0,255,136,0.30); background:rgba(0,255,136,0.08); }
  .bm-asset-ticker { font-size:11px; font-weight:600; font-family:${FONTS.mono}; color:rgba(255,255,255,0.70); }
  .bm-asset-ret { font-size:11px; font-family:${FONTS.num}; font-weight:500; font-variant-numeric:tabular-nums; }
  .bm-asset-ret.pos { color:${COLORS.neonGreen}; }
  .bm-asset-ret.neg { color:${COLORS.neonRed}; }
  .bm-asset-ret.load { color:rgba(255,255,255,0.20); }

  .bm-note { padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:8px; font-size:11px; color:rgba(255,255,255,0.30); line-height:1.6; }
`

const BmTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  const sorted = [...payload].sort((a,b) => (b.value||0)-(a.value||0))
  return (
    <div style={{background:'#1a1a1a',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'10px 12px',fontFamily:FONTS.sans,minWidth:150}}>
      <p style={{fontSize:10,color:'rgba(255,255,255,0.30)',marginBottom:7}}>{label}</p>
      {sorted.filter(p=>p.value!=null).map((p,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:3}}>
          <span style={{fontSize:10,color:p.color,fontWeight:500}}>{p.name}</span>
          <span style={{fontSize:12,fontFamily:FONTS.num,fontWeight:500,fontVariantNumeric:'tabular-nums',color:parseFloat(p.value)>=0?COLORS.neonGreen:COLORS.neonRed}}>
            {parseFloat(p.value)>=0?'+':''}{parseFloat(p.value).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

// Genera colors per actius propis (cian degradat)
const ASSET_COLORS = ['#00d4ff','#4fc3f7','#29b6f6','#0288d1','#01579b','#84ffff','#18ffff']

export default function BenchmarkPage({ snapshots=[], investments=[] }) {
  const [period, setPeriod]         = useState('1Y')
  const [benchData, setBenchData]   = useState({})  // { ticker: [{date, price}] }
  const [assetData, setAssetData]   = useState({})  // { ticker: [{date, price}] }
  const [loading, setLoading]       = useState(false)
  const [hiddenLines, setHiddenLines] = useState(new Set()) // línies amagades
  const [selectedAssets, setSelectedAssets] = useState(new Set()) // actius mostrats al gràfic

  // Actius amb ticker vàlid per comparar
  const myAssets = useMemo(() => {
    return investments
      .filter(inv => inv.ticker && ['etf','stock'].includes(inv.type))
      .map((inv, i) => ({
        ticker: inv.ticker,
        name:   inv.name,
        color:  ASSET_COLORS[i % ASSET_COLORS.length],
      }))
  }, [investments])

  const per = PERIODS.find(p => p.id === period)

  // Fetch benchmarks + actius seleccionats
  useEffect(() => {
    if (!per) return
    setLoading(true)

    const toFetch = [
      ...GLOBAL_BENCHMARKS.map(b => ({ key: b.id,      ticker: b.id      })),
      ...myAssets.map(a =>           ({ key: a.ticker,  ticker: a.ticker  })),
    ]

    Promise.all(toFetch.map(async ({ key, ticker }) => ({
      key,
      prices: await fetchPrices(ticker, per.range, per.interval),
    }))).then(results => {
      const bMap = {}, aMap = {}
      results.forEach(({ key, prices }) => {
        if (GLOBAL_BENCHMARKS.find(b => b.id === key)) bMap[key] = prices
        else aMap[key] = prices
      })
      setBenchData(bMap)
      setAssetData(aMap)
      setLoading(false)
    })
  }, [period, myAssets.length]) // eslint-disable-line

  // Rendiment de la cartera des dels snapshots
  const portfolioReturn = useMemo(() => {
    if (snapshots.length < 2) return null
    const sorted = [...snapshots].sort((a,b) => new Date(a.date)-new Date(b.date))
    const cutoff = new Date()
    const months = { '1M':1,'3M':3,'6M':6,'1Y':12,'3Y':36,'5Y':60 }[period] || 12
    cutoff.setMonth(cutoff.getMonth() - months)
    const inRange = sorted.filter(s => new Date(s.date) >= cutoff)
    if (inRange.length < 2) return null
    const start = inRange[0].total, end = inRange[inRange.length-1].total
    return start > 0 ? +((end-start)/start*100).toFixed(2) : null
  }, [snapshots, period])

  // Dades del gràfic: cartera + benchmarks + actius seleccionats
  const chartData = useMemo(() => {
    const allDates = new Set()
    const snapSorted = [...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date))
    snapSorted.forEach(s => allDates.add(s.date))
    Object.values(benchData).forEach(arr => arr.forEach(p => allDates.add(p.date)))
    Object.values(assetData).forEach(arr => arr.forEach(p => allDates.add(p.date)))
    const dates = [...allDates].sort()
    if (dates.length < 2) return []

    const basePortfolio = snapSorted[0]?.total
    const baseBench = {}
    GLOBAL_BENCHMARKS.forEach(bm => { baseBench[bm.id] = (benchData[bm.id]||[])[0]?.price })
    const baseAsset = {}
    myAssets.forEach(a => { baseAsset[a.ticker] = (assetData[a.ticker]||[])[0]?.price })

    return dates.map(date => {
      const row = { date: date.slice(5) }
      // Cartera
      const snap = [...snapSorted].reverse().find(s => s.date <= date)
      if (snap && basePortfolio) row['Cartera'] = +((snap.total/basePortfolio-1)*100).toFixed(2)
      // Benchmarks
      GLOBAL_BENCHMARKS.forEach(bm => {
        const p = [...(benchData[bm.id]||[])].reverse().find(x => x.date <= date)
        if (p && baseBench[bm.id]) row[bm.label] = +((p.price/baseBench[bm.id]-1)*100).toFixed(2)
      })
      // Actius propis seleccionats
      myAssets.forEach(a => {
        if (!selectedAssets.has(a.ticker)) return
        const p = [...(assetData[a.ticker]||[])].reverse().find(x => x.date <= date)
        if (p && baseAsset[a.ticker]) row[a.ticker] = +((p.price/baseAsset[a.ticker]-1)*100).toFixed(2)
      })
      return row
    })
  }, [snapshots, benchData, assetData, selectedAssets, myAssets])

  // Taula de rendiments
  const returns = useMemo(() => {
    const list = []
    if (portfolioReturn !== null)
      list.push({ name:'La meva cartera', ret:portfolioReturn, color:COLORS.neonGreen, isMine:true })
    GLOBAL_BENCHMARKS.forEach(bm => {
      const prices = benchData[bm.id]||[]
      if (prices.length < 2) return
      const ret = +((prices[prices.length-1].price/prices[0].price-1)*100).toFixed(2)
      list.push({ name:bm.label, ret, color:bm.color })
    })
    myAssets.forEach(a => {
      const prices = assetData[a.ticker]||[]
      if (prices.length < 2) return
      const ret = +((prices[prices.length-1].price/prices[0].price-1)*100).toFixed(2)
      list.push({ name:a.ticker, ret, color:a.color, isAsset:true })
    })
    return list.sort((a,b) => b.ret-a.ret)
  }, [portfolioReturn, benchData, assetData, myAssets])

  const maxRet   = Math.max(...returns.map(r=>Math.abs(r.ret)), 1)
  const myRank   = returns.findIndex(r=>r.isMine)
  const myRet    = returns.find(r=>r.isMine)?.ret

  const toggleLine   = (key) => setHiddenLines(s => { const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n })
  const toggleAsset  = (ticker) => setSelectedAssets(s => { const n=new Set(s); n.has(ticker)?n.delete(ticker):n.add(ticker); return n })

  // Rendiment de cada actiu individual
  const assetReturns = useMemo(() => {
    const m = {}
    myAssets.forEach(a => {
      const prices = assetData[a.ticker]||[]
      if (prices.length < 2) m[a.ticker] = null
      else m[a.ticker] = +((prices[prices.length-1].price/prices[0].price-1)*100).toFixed(2)
    })
    return m
  }, [assetData, myAssets])

  return (
    <div className="bm">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="bm-hero">
        <p className="bm-hero-label">Benchmark · rendiment {period}</p>
        <p className={`bm-hero-ret ${myRet==null?'neu':myRet>=0?'pos':'neg'}`}>
          {myRet!=null ? `${myRet>=0?'+':''}${myRet.toFixed(1)}%` : '—'}
        </p>
        <p className="bm-hero-sub">
          {myRet!=null ? 'Rendiment de la teva cartera en el període' : 'Acumula més historial per veure el rendiment'}
        </p>
        <div className="bm-hero-badges">
          <span className="bm-hero-badge mine">🏦 Cartera: {myRet!=null?`${myRet>=0?'+':''}${myRet.toFixed(1)}%`:'—'}</span>
          {GLOBAL_BENCHMARKS.slice(0,2).map(bm => {
            const prices=benchData[bm.id]||[]
            if (prices.length<2) return null
            const ret=+((prices[prices.length-1].price/prices[0].price-1)*100).toFixed(2)
            return <span key={bm.id} className="bm-hero-badge bench">{bm.label}: {ret>=0?'+':''}{ret.toFixed(1)}%</span>
          })}
          {myRet!=null && myRank===0 && <span className="bm-hero-badge out">🏆 Baten el mercat</span>}
          {myRet!=null && myRank>0 && <span className="bm-hero-badge und">📉 Per sota de {myRank} índex{myRank>1?'s':''}</span>}
        </div>
      </div>

      {/* Gràfic de rendiment normalitzat */}
      <div className="bm-panel">
        <div className="bm-panel-hdr">
          <p className="bm-panel-title">Rendiment normalitzat (base 0%)</p>
          <div className="bm-periods">
            {PERIODS.map(p=>(
              <button key={p.id} className={`bm-period${period===p.id?' on':''}`} onClick={()=>setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* Llegenda clicable */}
        <div className="bm-legend">
          <div className={`bm-li${hiddenLines.has('Cartera')?' hidden':''}`} onClick={()=>toggleLine('Cartera')}>
            <div className="bm-li-line" style={{background:COLORS.neonGreen}}/>
            La meva cartera
          </div>
          {GLOBAL_BENCHMARKS.map(bm=>(
            <div key={bm.id} className={`bm-li${hiddenLines.has(bm.label)?' hidden':''}`} onClick={()=>toggleLine(bm.label)}>
              <div className="bm-li-line dash" style={{color:bm.color}}/>
              {bm.label}
            </div>
          ))}
          {myAssets.filter(a=>selectedAssets.has(a.ticker)).map(a=>(
            <div key={a.ticker} className="bm-li" onClick={()=>toggleLine(a.ticker)}>
              <div className="bm-li-line" style={{background:a.color}}/>
              {a.ticker}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="bm-loading"><div className="bm-spin"/> Carregant dades del mercat...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
              <XAxis dataKey="date" tick={{fontSize:10,fontFamily:FONTS.num,fill:'rgba(255,255,255,0.25)'}} axisLine={false} tickLine={false} interval={Math.floor((chartData.length||1)/5)}/>
              <YAxis tick={{fontSize:10,fontFamily:FONTS.num,fill:'rgba(255,255,255,0.25)'}} axisLine={false} tickLine={false} width={38} tickFormatter={v=>`${v>0?'+':''}${v.toFixed(0)}%`}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
              <Tooltip content={<BmTooltip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
              {!hiddenLines.has('Cartera') && snapshots.length>=2 && (
                <Line type="monotone" dataKey="Cartera" stroke={COLORS.neonGreen} strokeWidth={2} dot={false} connectNulls name="Cartera"/>
              )}
              {GLOBAL_BENCHMARKS.map(bm=>(
                !hiddenLines.has(bm.label) && (
                  <Line key={bm.id} type="monotone" dataKey={bm.label} stroke={bm.color} strokeWidth={1.2} dot={false} strokeDasharray="5 3" connectNulls name={bm.label}/>
                )
              ))}
              {myAssets.filter(a=>selectedAssets.has(a.ticker)&&!hiddenLines.has(a.ticker)).map(a=>(
                <Line key={a.ticker} type="monotone" dataKey={a.ticker} stroke={a.color} strokeWidth={1.2} dot={false} connectNulls name={a.ticker}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Taula de rendiments comparativa */}
      {!loading && returns.length > 0 && (
        <div className="bm-panel">
          <p className="bm-panel-title" style={{marginBottom:12}}>Rànquing de rendiment · {period}</p>
          <div className="bm-table">
            {returns.map((r,i) => (
              <div key={i} className="bm-tr">
                <div className="bm-tr-left">
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontFamily:FONTS.num,fontWeight:500,width:18,flexShrink:0}}>#{i+1}</div>
                  <div className="bm-tr-dot" style={{background:r.color}}/>
                  <span className={`bm-tr-name${r.isMine?' mine':''}`}>
                    {r.name}{r.isMine?' 🏦':''}
                  </span>
                </div>
                <div className="bm-tr-bar-wrap">
                  <div className="bm-tr-bar" style={{width:`${Math.abs(r.ret)/maxRet*100}%`, background:r.color}}/>
                </div>
                <span className={`bm-tr-val ${r.ret>0?'pos':r.ret<0?'neg':'neu'}`}>
                  {r.ret>=0?'+':''}{r.ret.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actius propis — afegir al gràfic */}
      {myAssets.length > 0 && (
        <div className="bm-panel">
          <p className="bm-panel-title" style={{marginBottom:10}}>Compara els teus actius individualment</p>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginBottom:12}}>Clica un actiu per afegir-lo al gràfic</p>
          <div className="bm-assets-grid">
            {myAssets.map(a => {
              const ret = assetReturns[a.ticker]
              const isOn = selectedAssets.has(a.ticker)
              return (
                <button key={a.ticker} className={`bm-asset-chip${isOn?' on':''}`} onClick={()=>toggleAsset(a.ticker)}>
                  <span className="bm-asset-ticker" style={{color:isOn?a.color:undefined}}>{a.ticker}</span>
                  <span className={`bm-asset-ret ${ret==null?'load':ret>=0?'pos':'neg'}`}>
                    {ret==null?'...':`${ret>=0?'+':''}${ret.toFixed(1)}%`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {snapshots.length < 5 && (
        <div className="bm-note">
          💡 El rendiment de la cartera es calcularà quan s'acumulin més snapshots diaris. Mentrestant pots comparar els teus actius individuals amb els índexs de mercat.
        </div>
      )}
    </div>
  )
}