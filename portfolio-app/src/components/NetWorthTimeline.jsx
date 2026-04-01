import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const PERIODS = [
  { id:'1W',  label:'1S',  days:7    },
  { id:'1M',  label:'1M',  days:30   },
  { id:'3M',  label:'3M',  days:90   },
  { id:'1Y',  label:'1A',  days:365  },
  { id:'ALL', label:'Tot', days:9999 },
]

const styles = `
  .nwt { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  .nwt-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .nwt-sub   { font-size:12px; color:${COLORS.textMuted}; }

  /* Panel */
  .nwt-panel { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:20px 18px 16px; }
  .nwt-hdr   { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:18px; }

  /* Valor gran */
  .nwt-amount { display:flex; align-items:baseline; gap:4px; margin-bottom:7px; }
  .nwt-cur    { font-size:14px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; padding-bottom:4px; }
  .nwt-total  { font-size:clamp(30px,5vw,40px); font-weight:300; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-2px; line-height:1; font-variant-numeric:tabular-nums; }
  .nwt-dec    { font-size:55%; color:${COLORS.textMuted}; letter-spacing:-0.5px; }

  .nwt-change { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; font-family:${FONTS.mono}; padding:3px 8px; border-radius:3px; }
  .nwt-change.pos { color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; }
  .nwt-change.neg { color:${COLORS.neonRed};   background:${COLORS.bgRed};   border:1px solid ${COLORS.borderRed};   }

  /* Period tabs */
  .nwt-tabs { display:flex; gap:1px; background:${COLORS.border}; border-radius:4px; overflow:hidden; flex-shrink:0; align-self:flex-start; }
  .nwt-tab  { padding:5px 11px; border:none; background:${COLORS.surface}; font-family:${FONTS.mono}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; }
  .nwt-tab:hover { color:${COLORS.textSecondary}; background:${COLORS.elevated}; }
  .nwt-tab.on  { background:${COLORS.elevated}; color:${COLORS.textPrimary}; }

  /* Empty */
  .nwt-empty { padding:40px 0; text-align:center; }
  .nwt-empty-main { font-size:13px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .nwt-empty-sub  { font-size:11px; color:${COLORS.textMuted}; opacity:0.6; }

  /* Stats */
  .nwt-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(80px,1fr)); padding-top:14px; margin-top:14px; border-top:1px solid ${COLORS.border}; gap:0; }
  .nwt-stat  { position:relative; padding-right:14px; margin-bottom:4px; }
  .nwt-stat:not(:last-child)::after { content:''; position:absolute; right:7px; top:0; height:100%; width:1px; background:${COLORS.border}; }
  .nwt-stat-l { font-size:9px; font-weight:500; color:${COLORS.textMuted}; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.10em; }
  .nwt-stat-v { font-size:12px; font-family:${FONTS.mono}; letter-spacing:-0.3px; font-weight:500; font-variant-numeric:tabular-nums; }
  .nwt-stat-v.pos { color:${COLORS.neonGreen}; }
  .nwt-stat-v.neg { color:${COLORS.neonRed}; }
  .nwt-stat-v.neu { color:${COLORS.textSecondary}; }

  /* Breakdown */
  .nwt-breakdown { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; }
  .nwt-bk { background:${COLORS.surface}; padding:14px 12px; }
  .nwt-bk-l { font-size:9px; font-weight:500; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; }
  .nwt-bk-v { font-size:14px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; font-variant-numeric:tabular-nums; letter-spacing:-0.3px; margin-bottom:2px; }
  .nwt-bk-p { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
`

const NwtTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'8px 11px', fontFamily:FONTS.sans }}>
      <p style={{ fontSize:10, color:COLORS.textMuted, marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:14, fontWeight:500, color:COLORS.textPrimary, fontFamily:FONTS.mono, letterSpacing:'-0.4px' }}>{fmtEur(payload[0]?.value||0)}</p>
    </div>
  )
}

export default function NetWorthTimeline({ snapshots=[], currentTotal, totalCost }) {
  const [period, setPeriod] = useState('1Y')

  const filtered = useMemo(() => {
    const days = PERIODS.find(p=>p.id===period)?.days??365
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days)
    return [...snapshots].filter(s=>new Date(s.date)>=cutoff).sort((a,b)=>new Date(a.date)-new Date(b.date))
      .map(s=>({...s,label:new Date(s.date).toLocaleDateString('ca-ES',{day:'2-digit',month:'short'})}))
  }, [snapshots,period])

  const first     = filtered[0]?.total||currentTotal
  const change    = currentTotal-first
  const changePct = first>0?(change/first)*100:0
  const isPos     = change>=0

  const allTimeHigh  = Math.max(...snapshots.map(s=>s.total),currentTotal)
  const totalGain    = currentTotal-totalCost
  const totalGainPct = totalCost>0?(totalGain/totalCost)*100:0

  const monthlyChanges = useMemo(() => {
    if (snapshots.length<2) return {best:null,worst:null}
    const byMonth={}
    ;[...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(s=>{
      const key=s.date.slice(0,7)
      if (!byMonth[key]) byMonth[key]={first:s.total,last:s.total}
      byMonth[key].last=s.total
    })
    const changes=Object.entries(byMonth).map(([,{first,last}])=>({change:last-first}))
    if (!changes.length) return {best:null,worst:null}
    return {best:changes.reduce((a,b)=>b.change>a.change?b:a),worst:changes.reduce((a,b)=>b.change<a.change?b:a)}
  }, [snapshots])

  const volatility = useMemo(() => {
    if (filtered.length<5) return null
    const returns=filtered.slice(1).map((s,i)=>(s.total-filtered[i].total)/filtered[i].total)
    const mean=returns.reduce((a,b)=>a+b,0)/returns.length
    const variance=returns.reduce((a,b)=>a+Math.pow(b-mean,2),0)/returns.length
    return (Math.sqrt(variance)*Math.sqrt(252)*100).toFixed(1)
  }, [filtered])

  const lastSnap  = [...snapshots].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const chartData = filtered.length>0?filtered:[{label:'Avui',total:currentTotal}]
  const minVal    = Math.min(...chartData.map(s=>s.total))*0.97
  const maxVal    = Math.max(...chartData.map(s=>s.total))*1.02
  const [intPart,decPart] = fmtEur(currentTotal).replace('€','').trim().split(',')

  return (
    <div className="nwt">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="nwt-title">Evolució del patrimoni</h2>
        <p className="nwt-sub">Historial diari del valor total del portfoli</p>
      </div>

      <div className="nwt-panel">
        <div className="nwt-hdr">
          <div>
            <div className="nwt-amount">
              <span className="nwt-cur">€</span>
              <span className="nwt-total">{intPart}<span className="nwt-dec">,{decPart}</span></span>
            </div>
            <span className={`nwt-change ${isPos?'pos':'neg'}`}>
              {isPos?'▲':'▼'} {fmtEur(Math.abs(change))} · {isPos?'+':''}{changePct.toFixed(2)}%
            </span>
          </div>
          <div className="nwt-tabs">
            {PERIODS.map(p=>(
              <button key={p.id} className={`nwt-tab${period===p.id?' on':''}`} onClick={()=>setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>

        {snapshots.length<2 ? (
          <div className="nwt-empty">
            <p className="nwt-empty-main">Les dades s'acumulen automàticament cada dia</p>
            <p className="nwt-empty-sub">El gràfic apareixerà demà amb el primer punt d'historial</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
              <defs>
                <linearGradient id="nwtG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPos?'rgba(0,255,136,0.15)':'rgba(255,59,59,0.12)'}/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(chartData.length/5)-1)} />
              <YAxis domain={[minVal,maxVal]} tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} width={44} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
              <ReferenceLine y={first} stroke={COLORS.border} strokeDasharray="3 3" strokeWidth={1} />
              <Tooltip content={<NwtTooltip/>} cursor={{stroke:COLORS.borderMid,strokeWidth:1}} />
              <Area type="monotone" dataKey="total" stroke={isPos?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill="url(#nwtG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="nwt-stats">
          <div className="nwt-stat">
            <p className="nwt-stat-l">Màxim històric</p>
            <p className="nwt-stat-v neu">{fmtEur(allTimeHigh)}</p>
          </div>
          <div className="nwt-stat">
            <p className="nwt-stat-l">Guany total</p>
            <p className={`nwt-stat-v ${totalGain>=0?'pos':'neg'}`}>{totalGain>=0?'+':''}{fmtEur(totalGain)}</p>
          </div>
          {monthlyChanges.best && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Millor mes</p>
              <p className="nwt-stat-v pos">+{fmtEur(monthlyChanges.best.change)}</p>
            </div>
          )}
          {monthlyChanges.worst && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Pitjor mes</p>
              <p className="nwt-stat-v neg">{fmtEur(monthlyChanges.worst.change)}</p>
            </div>
          )}
          {volatility && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Volatilitat</p>
              <p className="nwt-stat-v neu">{volatility}%</p>
            </div>
          )}
        </div>
      </div>

      {lastSnap && (
        <div className="nwt-breakdown">
          {[
            {label:'Inversions',val:lastSnap.invValue,   color:COLORS.neonCyan  },
            {label:'Estalvis',  val:lastSnap.savValue,   color:COLORS.neonGreen },
            {label:'Crypto',    val:lastSnap.cryptoValue,color:COLORS.neonAmber },
          ].map(({label,val,color})=>{
            const pct=currentTotal>0?(val/currentTotal)*100:0
            return (
              <div key={label} className="nwt-bk">
                <p className="nwt-bk-l" style={{color}}>{label}</p>
                <p className="nwt-bk-v">{fmtEur(val||0)}</p>
                <p className="nwt-bk-p">{pct.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}