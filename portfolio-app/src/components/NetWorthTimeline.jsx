import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'


const PERIODS = [
  { id:'1W',  label:'1S',  days:7    },
  { id:'1M',  label:'1M',  days:30   },
  { id:'3M',  label:'3M',  days:90   },
  { id:'1Y',  label:'1A',  days:365  },
  { id:'ALL', label:'Tot', days:9999 },
]

const CAT_COLORS = {
  inv:    COLORS.neonCyan,
  sav:    COLORS.neonGreen,
  crypto: COLORS.neonAmber,
  com:    '#c8961a',
}

const styles = `
  .nwt { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero card amb gràfic integrat ── */
  .nwt-hero {
    background:linear-gradient(160deg,#0d0d0d 0%,#131313 100%);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:14px; overflow:hidden; position:relative;
  }
  .nwt-hero::after {
    content:''; position:absolute; top:-80px; right:-80px;
    width:260px; height:260px; border-radius:50%;
    background:radial-gradient(circle,rgba(0,255,136,0.05) 0%,transparent 65%);
    pointer-events:none;
  }

  /* Info superior */
  .nwt-top { padding:22px 20px 0; position:relative; z-index:1; }
  .nwt-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }

  /* Valor principal */
  .nwt-amount { display:flex; align-items:flex-end; gap:4px; margin-bottom:10px; line-height:1; }
  .nwt-symbol { padding-left:4px; font-size:30px;  color:rgba(255,255,255,0.7); font-family:${FONTS.num}; font-weight:600; }
  .nwt-int { font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .nwt-dec { font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; font-family:${FONTS.num}; }

  /* Badge canvi */
  .nwt-change-row { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .nwt-change { display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:600; font-family:${FONTS.num}; padding:5px 12px; border-radius:20px; }
  .nwt-change.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.09); border:1px solid rgba(0,255,136,0.22); }
  .nwt-change.neg { color:${COLORS.neonRed};   background:rgba(255,59,59,0.09);  border:1px solid rgba(255,59,59,0.20);  }
  .nwt-change-hint { font-size:11px; color:rgba(255,255,255,0.22); font-family:${FONTS.num}; }

  /* Period pills */
  .nwt-periods { display:flex; gap:4px; margin-bottom:18px; }
  .nwt-period { padding:4px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.07); background:transparent; font-family:${FONTS.num}; font-size:11px; font-weight:500; color:rgba(255,255,255,0.28); cursor:pointer; transition:all 100ms; }
  .nwt-period:hover { color:rgba(255,255,255,0.65); border-color:rgba(255,255,255,0.15); }
  .nwt-period.on { background:rgba(0,255,136,0.09); border-color:rgba(0,255,136,0.25); color:${COLORS.neonGreen}; }

  /* Gràfic sense marges als costats */
  .nwt-chart { margin:0; }

  /* Stats integrades sota el gràfic */
  .nwt-stats-bar {
    display:grid; grid-template-columns:repeat(3,1fr);
    padding:14px 20px 18px; gap:0;
    border-top:1px solid rgba(255,255,255,0.05);
  }
  .nwt-sbar { position:relative; }
  .nwt-sbar:not(:last-child)::after {
    content:''; position:absolute; right:0; top:15%; height:70%;
    width:1px; background:rgba(255,255,255,0.05);
  }
  .nwt-sbar-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.22); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:5px; }
  .nwt-sbar-v { font-size:16px; font-weight:600; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .nwt-sbar-v.pos { color:${COLORS.neonGreen}; }
  .nwt-sbar-v.neg { color:${COLORS.neonRed}; }
  .nwt-sbar-v.neu { color:rgba(255,255,255,0.65); }
  .nwt-sbar-sub { font-size:10px; color:rgba(255,255,255,0.18); font-family:${FONTS.num}; }

  /* Empty state */
  .nwt-empty { padding:48px 20px; text-align:center; }
  .nwt-empty-icon { font-size:36px; margin-bottom:12px; }
  .nwt-empty-main { font-size:14px; color:rgba(255,255,255,0.35); font-weight:500; margin-bottom:6px; }
  .nwt-empty-sub { font-size:12px; color:rgba(255,255,255,0.18); line-height:1.7; }

  /* ── Breakdown categories ── */
  .nwt-cats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .nwt-cat { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px 12px 12px; }
  .nwt-cat-dot { width:6px; height:6px; border-radius:50%; margin-bottom:10px; }
  .nwt-cat-l { font-size:9px; font-weight:500; text-transform:uppercase; letter-spacing:0.12em; color:rgba(255,255,255,0.28); margin-bottom:6px; }
  .nwt-cat-v { font-size:16px; font-weight:600; font-family:${FONTS.num}; color:#fff; letter-spacing:-0.5px; font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .nwt-cat-p { font-size:11px; font-family:${FONTS.num}; color:rgba(255,255,255,0.22); }

  /* ── Historial mensual ── */
  .nwt-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .nwt-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:14px; }

  .nwt-month-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .nwt-month-row:last-child { border-bottom:none; }
  .nwt-month-label { font-size:11px; font-family:${FONTS.num}; color:rgba(255,255,255,0.30); width:64px; flex-shrink:0; text-transform:capitalize; }
  .nwt-month-bar-wrap { flex:1; height:4px; background:rgba(255,255,255,0.04); border-radius:2px; overflow:hidden; }
  .nwt-month-bar { height:100%; border-radius:2px; }
  .nwt-month-end { font-size:13px; font-family:${FONTS.num}; font-weight:400; color:rgba(255,255,255,0.65); font-variant-numeric:tabular-nums; min-width:80px; text-align:right; }
  .nwt-month-chg { font-size:11px; font-family:${FONTS.num}; font-weight:500; min-width:52px; text-align:right; font-variant-numeric:tabular-nums; }
  .nwt-month-chg.pos { color:${COLORS.neonGreen}; }
  .nwt-month-chg.neg { color:${COLORS.neonRed}; }
`

const NwtTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{background:'#1c1c1c',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 13px',fontFamily:FONTS.sans,boxShadow:'0 8px 24px rgba(0,0,0,0.5)'}}>
      <p style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginBottom:4}}>{label}</p>
      <p style={{fontSize:18,fontWeight:300,fontFamily:FONTS.num,color:'#fff',letterSpacing:'-0.8px',fontVariantNumeric:'tabular-nums'}}>{fmtEur(payload[0]?.value||0)}</p>
    </div>
  )
}

export default function NetWorthTimeline({ snapshots=[], currentTotal, totalCost }) {
  const [period, setPeriod] = useState('1Y')

  const filtered = useMemo(() => {
    const days = PERIODS.find(p=>p.id===period)?.days ?? 365
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days)
    return [...snapshots]
      .filter(s => new Date(s.date) >= cutoff)
      .sort((a,b) => new Date(a.date)-new Date(b.date))
      .map(s => ({
        ...s,
        label: new Date(s.date).toLocaleDateString('ca-ES', {day:'2-digit',month:'short'}),
      }))
  }, [snapshots, period])

  const chartData    = filtered.length > 0 ? filtered : [{ label:'Avui', total:currentTotal }]
  const first        = filtered[0]?.total || currentTotal
  const change       = currentTotal - first
  const changePct    = first > 0 ? (change/first)*100 : 0
  const isPos        = change >= 0
  const minVal       = Math.min(...chartData.map(s=>s.total)) * 0.97
  const maxVal       = Math.max(...chartData.map(s=>s.total)) * 1.03
  const allTimeHigh  = Math.max(...snapshots.map(s=>s.total), currentTotal)
  const totalGain    = currentTotal - (totalCost||0)
  const totalGainPct = totalCost>0 ? (totalGain/totalCost)*100 : 0

  // Millor mes
  const bestMonth = useMemo(() => {
    if (snapshots.length < 2) return null
    const byMonth = {}
    ;[...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(s => {
      const k = s.date.slice(0,7)
      if (!byMonth[k]) byMonth[k] = { first:s.total, last:s.total }
      byMonth[k].last = s.total
    })
    const entries = Object.entries(byMonth).map(([k,{first,last}])=>({ month:k, change:last-first }))
    return entries.length ? entries.reduce((a,b)=>b.change>a.change?b:a) : null
  }, [snapshots])

  // Historial mensual (últims 6 mesos)
  const monthlyHistory = useMemo(() => {
    const byMonth = {}
    ;[...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(s => {
      const k = s.date.slice(0,7)
      if (!byMonth[k]) byMonth[k] = { first:s.total, last:s.total }
      byMonth[k].last = s.total
    })
    return Object.entries(byMonth)
      .map(([month,{first,last}]) => ({ month, end:last, change:last-first, pct:(last-first)/first*100 }))
      .sort((a,b) => b.month.localeCompare(a.month))
      .slice(0, 8)
  }, [snapshots])

  const maxAbsChange = Math.max(...monthlyHistory.map(m=>Math.abs(m.change)), 1)
  const lastSnap = [...snapshots].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]

  // Format valor gran separat
  const totalStr = fmtEur(currentTotal).replace('€','').trim()
  const [intPart, decPart='00'] = totalStr.split(',')

  return (
    <div className="nwt">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* ── Hero ── */}
      <div className="nwt-hero">
        <div className="nwt-top">
          <p className="nwt-label">Patrimoni net total</p>

          <div className="nwt-amount">
            <span className="nwt-int">{intPart}</span>
            <span className="nwt-dec">,{decPart}</span>
            <span className="nwt-symbol">€</span>
          </div>

          <div className="nwt-change-row">
            <span className={`nwt-change ${isPos?'pos':'neg'}`}>
              {isPos?'▲ +':'▼ '}{fmtEur(Math.abs(change))} ({isPos?'+':''}{changePct.toFixed(2)}%)
            </span>
            <span className="nwt-change-hint">
              {period==='ALL'?'des de l\'inici':`en el darrer ${PERIODS.find(p=>p.id===period)?.label}`}
            </span>
          </div>

          <div className="nwt-periods">
            {PERIODS.map(p=>(
              <button key={p.id} className={`nwt-period${period===p.id?' on':''}`} onClick={()=>setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* Gràfic */}
        <div className="nwt-chart">
          {snapshots.length < 2 ? (
            <div className="nwt-empty">
              <div className="nwt-empty-icon">📈</div>
              <p className="nwt-empty-main">El gràfic s'anirà construint</p>
              <p className="nwt-empty-sub">Les dades es guarden automàticament.<br/>Demà veuràs el primer punt de l'historial.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{top:8,right:0,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="nwtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={isPos?'rgba(0,255,136,0.20)':'rgba(255,59,59,0.16)'}/>
                    <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{fontSize:9,fontFamily:FONTS.num,fill:'rgba(255,255,255,0.20)'}}
                  axisLine={false} tickLine={false}
                  interval={Math.max(0,Math.floor(chartData.length/5)-1)}
                />
                <YAxis
                  domain={[minVal,maxVal]}
                  tick={{fontSize:9,fontFamily:FONTS.num,fill:'rgba(255,255,255,0.20)'}}
                  axisLine={false} tickLine={false} width={38}
                  tickFormatter={v=>`${(v/1000).toFixed(0)}k`}
                />
                <ReferenceLine y={first} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" strokeWidth={1}/>
                <Tooltip content={<NwtTooltip/>} cursor={{stroke:'rgba(255,255,255,0.06)',strokeWidth:1}}/>
                <Area
                  type="monotone" dataKey="total"
                  stroke={isPos?COLORS.neonGreen:COLORS.neonRed}
                  strokeWidth={2} fill="url(#nwtGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stats sota el gràfic dins el hero */}
        <div className="nwt-stats-bar">
          <div className="nwt-sbar">
            <p className="nwt-sbar-l">Guany total</p>
            <p className={`nwt-sbar-v ${totalGain>=0?'pos':'neg'}`}>
              {totalGain>=0?'+':''}{fmtEur(totalGain)}
            </p>
            <p className="nwt-sbar-sub">{totalGainPct>=0?'+':''}{totalGainPct.toFixed(1)}% ROI</p>
          </div>
          <div className="nwt-sbar" style={{paddingLeft:12}}>
            <p className="nwt-sbar-l">Màx. histò.</p>
            <p className="nwt-sbar-v neu">{fmtEur(allTimeHigh)}</p>
            <p className="nwt-sbar-sub">{currentTotal>=allTimeHigh?'🏆 ATH ara':'—'}</p>
          </div>
          <div className="nwt-sbar" style={{paddingLeft:12}}>
            <p className="nwt-sbar-l">Millor mes</p>
            <p className="nwt-sbar-v pos">
              {bestMonth?`+${fmtEur(bestMonth.change)}`:'—'}
            </p>
            <p className="nwt-sbar-sub">{bestMonth?.month||''}</p>
          </div>
        </div>
      </div>

      {/* ── Breakdown per categoria ── */}
      {lastSnap && (
        <div className="nwt-cats">
          {[
            { label:'Inversions', val:lastSnap.invValue,    color:CAT_COLORS.inv    },
            { label:'Estalvis',   val:lastSnap.savValue,    color:CAT_COLORS.sav    },
            { label:'Crypto',     val:lastSnap.cryptoValue, color:CAT_COLORS.crypto },
          ].map(({label,val,color})=>{
            const v   = val || 0
            const pct = currentTotal>0 ? (v/currentTotal)*100 : 0
            return (
              <div key={label} className="nwt-cat">
                <div className="nwt-cat-dot" style={{background:color}}/>
                <p className="nwt-cat-l">{label}</p>
                <p className="nwt-cat-v">{fmtEur(v)}</p>
                <p className="nwt-cat-p">{pct.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Historial mensual ── */}
      {monthlyHistory.length > 0 && (
        <div className="nwt-panel">
          <p className="nwt-panel-title">Rendiment mensual</p>
          {monthlyHistory.map((m,i)=>{
            const isP = m.change >= 0
            const [y, mo] = m.month.split('-')
            const monthLabel = new Date(parseInt(y),parseInt(mo)-1,1)
              .toLocaleDateString('ca-ES',{month:'short',year:'2-digit'})
            const barW = Math.abs(m.change)/maxAbsChange*100
            return (
              <div key={i} className="nwt-month-row">
                <span className="nwt-month-label">{monthLabel}</span>
                <div className="nwt-month-bar-wrap">
                  <div className="nwt-month-bar" style={{
                    width:`${barW}%`,
                    background: isP?COLORS.neonGreen:COLORS.neonRed,
                    opacity: 0.55 + (barW/100)*0.35,
                  }}/>
                </div>
                <span className="nwt-month-end">{fmtEur(m.end)}</span>
                <span className={`nwt-month-chg ${isP?'pos':'neg'}`}>
                  {isP?'+':''}{m.pct.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{height:16}}/>
    </div>
  )
}