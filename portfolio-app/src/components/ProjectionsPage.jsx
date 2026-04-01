import { useState, useMemo } from 'react'
import { fmtEur, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DEFAULT_RETURNS = { etf:8, stock:9, robo:6.5, estalvi:1.5, efectiu:1.8, crypto:15 }
const QUICK_YEARS     = [1, 3, 5, 10, 15, 20, 30]

function fv(pv, pmt, r, n) {
  if (r === 0) return pv + pmt * n
  const m = r / 100 / 12
  return pv * Math.pow(1 + m, n) + pmt * (Math.pow(1 + m, n) - 1) / m
}

const styles = `
  .pr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:14px; }

  .pr-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .pr-sub   { font-size:12px; color:${COLORS.textMuted}; }

  /* KPI bloc */
  .pr-kpis { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; }
  .pr-kpi { background:${COLORS.surface}; padding:16px 14px; }
  .pr-kpi.dim { background:${COLORS.elevated}; }
  .pr-kpi-l { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; }
  .pr-kpi-v { font-size:20px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.8px; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .pr-kpi-v.g { color:${COLORS.neonGreen}; }
  .pr-kpi-sub { font-size:11px; font-family:${FONTS.mono}; color:${COLORS.textMuted}; }
  .pr-kpi-sub.g { color:${COLORS.neonGreen}; opacity:0.65; }

  /* Slider */
  .pr-slider { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:18px 16px; }
  .pr-slider-top { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:14px; }
  .pr-slider-lbl { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }
  .pr-slider-val { font-size:28px; font-weight:300; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-1px; font-variant-numeric:tabular-nums; }
  .pr-slider-val span { font-size:14px; color:${COLORS.textMuted}; margin-left:3px; }

  .pr-track { position:relative; height:3px; background:${COLORS.border}; border-radius:2px; margin-bottom:16px; }
  .pr-fill  { position:absolute; left:0; top:0; height:100%; background:${COLORS.neonGreen}; border-radius:2px; pointer-events:none; }
  .pr-thumb { position:absolute; width:13px; height:13px; border-radius:50%; background:${COLORS.neonGreen}; top:-5px; transform:translateX(-50%); pointer-events:none; }
  .pr-range { position:absolute; inset:0; width:100%; opacity:0; cursor:pointer; height:18px; top:-7px; -webkit-appearance:none; appearance:none; margin:0; }

  .pr-quick { display:flex; gap:4px; flex-wrap:wrap; }
  .pr-qbtn { padding:5px 12px; border-radius:3px; border:1px solid ${COLORS.border}; background:${COLORS.elevated}; font-family:${FONTS.mono}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; }
  .pr-qbtn:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .pr-qbtn.on { background:${COLORS.bgGreen}; border-color:${COLORS.borderGreen}; color:${COLORS.neonGreen}; }

  /* Charts */
  .pr-chart { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:16px; }
  .pr-chart-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .pr-chart-title { font-size:11px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }
  .pr-legend { display:flex; gap:12px; }
  .pr-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:${COLORS.textMuted}; }
  .pr-legend-dot { width:7px; height:2px; border-radius:1px; flex-shrink:0; }

  /* Taula anual */
  .pr-table { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; overflow:hidden; }
  .pr-table-title { font-size:11px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; padding:14px 16px 10px; border-bottom:1px solid ${COLORS.border}; }
  .pr-col-hdr { display:grid; grid-template-columns:36px 1fr 1fr 1fr; padding:7px 16px; border-bottom:1px solid ${COLORS.border}; }
  .pr-col-hdr span { font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }
  .pr-col-hdr span:not(:first-child) { text-align:right; }
  .pr-yr-row { display:grid; grid-template-columns:36px 1fr 1fr 1fr; padding:9px 16px; border-bottom:1px solid ${COLORS.border}; transition:background 80ms; }
  .pr-yr-row:last-child { border-bottom:none; }
  .pr-yr-row:hover { background:${COLORS.elevated}; }
  .pr-yr-row.last { background:${COLORS.bgGreen}; border-top:1px solid ${COLORS.borderGreen}; }
  .pr-yr-n { font-size:11px; font-weight:500; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .pr-yr-v { font-size:11px; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; text-align:right; font-variant-numeric:tabular-nums; }
  .pr-yr-v.g { color:${COLORS.neonGreen}; }
  .pr-yr-row.last .pr-yr-n { color:${COLORS.neonGreen}; font-weight:600; }
  .pr-yr-row.last .pr-yr-v { color:${COLORS.textPrimary}; font-weight:600; }
  .pr-yr-row.last .pr-yr-v.g { color:${COLORS.neonGreen}; }

  /* Aportació */
  .pr-contrib { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:16px; }
  .pr-asset-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .pr-asset-row:last-of-type { border-bottom:none; }
  .pr-asset-av { width:26px; height:26px; border-radius:50%; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:600; color:${COLORS.textMuted}; flex-shrink:0; font-family:${FONTS.mono}; }
  .pr-asset-name { font-size:12px; font-weight:500; color:${COLORS.textSecondary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .pr-asset-meta { font-size:10px; color:${COLORS.textMuted}; }
  .pr-inp { width:64px; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:4px; padding:7px 9px; font-family:${FONTS.mono}; font-size:13px; font-weight:500; color:${COLORS.textPrimary}; outline:none; text-align:right; transition:border-color 120ms; touch-action:manipulation; }
  .pr-inp:focus { border-color:${COLORS.neonPurple}; }
  .pr-unit { font-size:10px; color:${COLORS.textMuted}; white-space:nowrap; flex-shrink:0; }
  .pr-total-row { display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:2px; border-top:1px solid ${COLORS.border}; }
  .pr-total-l { font-size:11px; color:${COLORS.textSecondary}; font-weight:500; }
  .pr-total-v { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; font-family:${FONTS.mono}; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
`

const PrTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'9px 12px', fontFamily:FONTS.sans }}>
      <p style={{ fontSize:10, color:COLORS.textMuted, marginBottom:7 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:3 }}>
          <span style={{ fontSize:11, color:p.color }}>{p.name}</span>
          <span style={{ fontSize:11, color:COLORS.textPrimary, fontFamily:FONTS.mono }}>{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const GainTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  const val = payload[0]?.value||0
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'7px 10px', fontFamily:FONTS.mono }}>
      <p style={{ fontSize:10, color:COLORS.textMuted, marginBottom:3 }}>Any {label}</p>
      <p style={{ fontSize:12, color:val>=0?COLORS.neonGreen:COLORS.neonRed }}>{val>=0?'+':''}{fmtEur(val)}</p>
    </div>
  )
}

export default function ProjectionsPage({ investments, savings, cryptos=[] }) {
  const [years, setYears]             = useState(10)
  const [contributions, setContributions] = useState({})

  const allAssets = [
    ...investments.map(i => ({ ...i, category:i.type })),
    ...savings.map(s => ({ ...s, category:'estalvi', currentPrice:null })),
    ...cryptos.map(c => ({ ...c, category:'crypto', initialValue:c.initialValue||0 })),
  ]

  const getContrib = id  => parseFloat(contributions[id]||0)
  const getRate    = a   => DEFAULT_RETURNS[a.category]||8

  const calcTotal = (months) => {
    let total=0, cost=0
    allAssets.forEach(a => {
      const pv  = a.category==='estalvi'?(a.amount||0):(getEffectiveValue?.(a)||a.initialValue||0)
      const pmt = getContrib(a.id)
      total += fv(pv,pmt,getRate(a),months)
      cost  += pv+pmt*months
    })
    return { total:Math.round(total), cost:Math.round(cost) }
  }

  const chartData = useMemo(() => {
    const pts=[], step=Math.max(1,Math.floor(years/24))
    for (let y=0;y<=years;y+=step) {
      const {total,cost}=calcTotal(y*12)
      pts.push({any:y===0?'Avui':`${y}a`,'Valor':total,'Capital':cost})
    }
    return pts
  }, [years,contributions,allAssets.length])

  const yearlyData = useMemo(() => {
    const rows=[]
    let prevTotal=calcTotal(0).total
    const totalMonthly=allAssets.reduce((s,a)=>s+getContrib(a.id),0)
    for (let y=1;y<=years;y++) {
      const {total,cost}=calcTotal(y*12)
      const yearGain=total-prevTotal
      rows.push({year:y,total,cost,yearGain,interest:yearGain-totalMonthly*12,gainPct:prevTotal>0?((total-prevTotal)/prevTotal)*100:0})
      prevTotal=total
    }
    return rows
  }, [years,contributions,allAssets.length])

  const last         = calcTotal(years*12)
  const today        = calcTotal(0)
  const totalGain    = last.total-last.cost
  const totalMonthly = allAssets.reduce((s,a)=>s+getContrib(a.id),0)
  const pct          = today.total>0?((last.total-today.total)/today.total)*100:0
  const sliderPct    = ((years-1)/39)*100

  return (
    <div className="pr">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="pr-title">Projeccions</h2>
        <p className="pr-sub">Simulació basada en rendiments estimats per categoria</p>
      </div>

      {/* KPIs */}
      <div className="pr-kpis">
        <div className="pr-kpi">
          <p className="pr-kpi-l">Als {years} anys</p>
          <p className="pr-kpi-v g">{fmtEur(last.total)}</p>
          <p className="pr-kpi-sub g">+{pct.toFixed(1)}% vs avui</p>
        </div>
        <div className="pr-kpi">
          <p className="pr-kpi-l">Guany d'interès</p>
          <p className="pr-kpi-v g">{fmtEur(totalGain)}</p>
          <p className="pr-kpi-sub">sobre {fmtEur(last.cost)} invertits</p>
        </div>
        <div className="pr-kpi dim">
          <p className="pr-kpi-l">Capital aportat</p>
          <p className="pr-kpi-v">{fmtEur(last.cost)}</p>
        </div>
        <div className="pr-kpi dim">
          <p className="pr-kpi-l">Aportació/mes</p>
          <p className="pr-kpi-v">{fmtEur(totalMonthly)}</p>
        </div>
      </div>

      {/* Slider */}
      <div className="pr-slider">
        <div className="pr-slider-top">
          <span className="pr-slider-lbl">Horitzó temporal</span>
          <span className="pr-slider-val">{years}<span>anys</span></span>
        </div>
        <div className="pr-track">
          <div className="pr-fill" style={{width:`${sliderPct}%`}}/>
          <div className="pr-thumb" style={{left:`${sliderPct}%`}}/>
          <input type="range" min="1" max="40" step="1" value={years} onChange={e=>setYears(Number(e.target.value))} className="pr-range"/>
        </div>
        <div className="pr-quick">
          {QUICK_YEARS.map(y => (
            <button key={y} className={`pr-qbtn${years===y?' on':''}`} onClick={()=>setYears(y)}>{y}a</button>
          ))}
        </div>
      </div>

      {/* Evolució */}
      <div className="pr-chart">
        <div className="pr-chart-hdr">
          <p className="pr-chart-title">Evolució del portfoli</p>
          <div className="pr-legend">
            <div className="pr-legend-item"><div className="pr-legend-dot" style={{background:COLORS.neonGreen}}/>Valor</div>
            <div className="pr-legend-item"><div className="pr-legend-dot" style={{background:COLORS.textMuted}}/>Capital</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={COLORS.border} />
            <XAxis dataKey="any" tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<PrTooltip/>} cursor={{stroke:COLORS.borderMid,strokeWidth:1}} />
            <Line type="monotone" dataKey="Valor" stroke={COLORS.neonGreen} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Capital" stroke={COLORS.textMuted} strokeWidth={1} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Barres per any */}
      <div className="pr-chart">
        <p className="pr-chart-title" style={{marginBottom:14}}>Guany net per any</p>
        <ResponsiveContainer width="100%" height={Math.min(years*18+40,200)}>
          <BarChart data={yearlyData} margin={{top:4,right:4,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="year" tickFormatter={v=>`${v}a`} tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(years/10)-1)} />
            <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<GainTooltip/>} cursor={{fill:COLORS.elevated}} />
            <Bar dataKey="yearGain" radius={[2,2,0,0]}>
              {yearlyData.map((e,i) => <Cell key={i} fill={e.yearGain>=0?COLORS.neonGreen:COLORS.neonRed} fillOpacity={0.55} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Taula anual */}
      <div className="pr-table">
        <p className="pr-table-title">Desglossament per any</p>
        <div className="pr-col-hdr">
          <span>Any</span><span>Valor total</span><span>Guany any</span><span>% any</span>
        </div>
        {yearlyData.map(row => (
          <div key={row.year} className={`pr-yr-row${row.year===years?' last':''}`}>
            <span className="pr-yr-n">{row.year}a</span>
            <span className="pr-yr-v">{fmtEur(row.total)}</span>
            <span className={`pr-yr-v${row.yearGain>=0?' g':''}`}>{row.yearGain>=0?'+':''}{fmtEur(row.yearGain)}</span>
            <span className={`pr-yr-v${row.gainPct>=0?' g':''}`}>{row.gainPct>=0?'+':''}{row.gainPct.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Aportació per actiu */}
      <div className="pr-contrib">
        <p className="pr-chart-title" style={{marginBottom:14,fontSize:11,fontWeight:500,color:COLORS.textMuted,textTransform:'uppercase',letterSpacing:'0.10em'}}>Aportació mensual</p>
        {allAssets.map(a => (
          <div key={a.id} className="pr-asset-row">
            <div className="pr-asset-av">{a.name?.slice(0,2).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <p className="pr-asset-name">{a.name}</p>
              <p className="pr-asset-meta">{a.category?.toUpperCase()} · {getRate(a)}% anual</p>
            </div>
            <input type="number" inputMode="decimal" min="0" step="10"
              value={contributions[a.id]||''}
              onChange={e=>setContributions(c=>({...c,[a.id]:e.target.value}))}
              placeholder="0" className="pr-inp" />
            <span className="pr-unit">€/mes</span>
          </div>
        ))}
        {totalMonthly>0 && (
          <div className="pr-total-row">
            <span className="pr-total-l">Total mensual</span>
            <span className="pr-total-v">{fmtEur(totalMonthly)}</span>
          </div>
        )}
      </div>
    </div>
  )
}