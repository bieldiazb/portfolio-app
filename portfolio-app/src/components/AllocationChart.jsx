import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fmtEur, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS, CHART_COLORS, TYPE_COLORS } from './design-tokens'

const TYPE_META = {
  efectiu: { label:'Efectiu', color:COLORS.textMuted   },
  estalvi: { label:'Estalvis', color:COLORS.neonGreen  },
  etf:     { label:'ETF',     color:COLORS.neonCyan    },
  stock:   { label:'Acció',   color:COLORS.neonPurple  },
  robo:    { label:'Robo',    color:COLORS.neonAmber   },
  crypto:    { label:'Crypto',        color:COLORS.neonAmber  },
  commodity: { label:'Mat. primeres',  color:'#c8961a'         },
}

const styles = `
  .al { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  .al-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .al-sub   { font-size:12px; font-family:${FONTS.mono}; color:${COLORS.textMuted}; margin-bottom:4px; }

  /* Donut + detall */
  .al-main { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; }
  @media (max-width:600px) { .al-main { grid-template-columns:1fr; } }

  .al-panel { background:${COLORS.surface}; padding:18px 16px; }
  .al-panel-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:14px; }

  /* Donut */
  .al-donut-wrap { position:relative; }
  .al-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
  .al-center-l { font-size:9px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:3px; }
  .al-center-v { font-size:16px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.5px; font-variant-numeric:tabular-nums; }

  /* Barres */
  .al-bar { margin-bottom:11px; }
  .al-bar:last-child { margin-bottom:0; }
  .al-bar-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
  .al-bar-left { display:flex; align-items:center; gap:6px; min-width:0; }
  .al-bar-dot  { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .al-bar-name { font-size:12px; color:${COLORS.textSecondary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
  .al-bar-right { display:flex; align-items:baseline; gap:5px; flex-shrink:0; }
  .al-bar-val  { font-size:12px; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
  .al-bar-pct  { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .al-track    { height:2px; background:${COLORS.border}; border-radius:1px; overflow:hidden; }
  .al-fill     { height:100%; border-radius:1px; transition:width 500ms cubic-bezier(0.4,0,0.2,1); }

  /* Categories */
  .al-cats { display:grid; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; }
  .al-cat  { background:${COLORS.surface}; padding:13px 12px; }
  .al-cat-l { font-size:9px; font-weight:500; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; }
  .al-cat-v { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .al-cat-p { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }

  .al-empty { padding:56px 0; text-align:center; font-size:13px; color:${COLORS.textMuted}; }
`

const AlTooltip = ({ active, payload, total }) => {
  if (!active||!payload?.length) return null
  const d = payload[0].payload
  const pct = total>0?((d.value/total)*100).toFixed(1):0
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'9px 12px', fontFamily:FONTS.sans }}>
      <p style={{ fontSize:11, fontWeight:500, color:COLORS.textSecondary, marginBottom:4 }}>{d.name}</p>
      <p style={{ fontSize:14, fontWeight:500, fontFamily:FONTS.mono, color:COLORS.textPrimary, letterSpacing:'-0.3px', marginBottom:2 }}>{fmtEur(d.value)}</p>
      <p style={{ fontSize:10, color:COLORS.textMuted }}>{pct}% del total</p>
    </div>
  )
}

export default function AllocationChart({ investments, savings, cryptos=[], commodities=[], fxRates={} }) {
  const invValue = inv => {
    const qty      = inv.totalQty || inv.qty || 0
    const origCurr = inv.originalCurrency || inv.currency || 'EUR'
    // Preu original × taxa live → EUR
    if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
      return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
    // Preu en EUR guardat
    if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
    return inv.totalCost || inv.initialValue || 0
  }

  const data = [
    ...investments.map(inv=>({name:inv.name,value:invValue(inv),type:inv.type})),
    ...savings.map(s=>({name:s.name,value:s.amount,type:'estalvi'})),
    ...cryptos.map(c=>{
      const qty=c.totalQty??c.qty??0
      const val=qty>0&&c.currentPrice!=null?qty*c.currentPrice:c.totalCost||c.initialValue||0
      return {name:c.name,value:val,type:'crypto'}
    }),
    ...commodities.map(c=>{
      const qty=c.totalQty??c.qty??0
      const val=qty>0&&c.currentPriceEur!=null?qty*c.currentPriceEur
               :qty>0&&c.currentPrice!=null&&c.fxRate?qty*c.currentPrice*c.fxRate
               :c.totalCost||0
      return {name:c.name,value:val,type:'commodity'}
    }),
  ].filter(d=>d.value>0).sort((a,b)=>b.value-a.value)

  const total      = data.reduce((s,d)=>s+d.value,0)
  const byType     = data.reduce((acc,d)=>{acc[d.type]=(acc[d.type]||0)+d.value;return acc},{})
  const catEntries = Object.entries(byType).sort((a,b)=>b[1]-a[1])
  const catCols    = Math.min(catEntries.length,6)

  if (data.length===0) return (
    <div className="al">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <div className="al-empty">Afegeix inversions per veure la distribució</div>
    </div>
  )

  return (
    <div className="al">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <h2 className="al-title">Distribució</h2>
      <p className="al-sub">{fmtEur(total)}</p>

      <div className="al-main">
        {/* Donut */}
        <div className="al-panel">
          <p className="al-panel-title">Per actiu</p>
          <div className="al-donut-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={1} dataKey="value">
                  {data.map((_,i) => (
                    <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} stroke={COLORS.bg} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<AlTooltip total={total}/>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="al-center">
              <span className="al-center-l">Total</span>
              <span className="al-center-v">{fmtEur(total)}</span>
            </div>
          </div>
        </div>

        {/* Barres */}
        <div className="al-panel">
          <p className="al-panel-title">Detall</p>
          {data.map((d,i) => {
            const pct = total>0?(d.value/total)*100:0
            return (
              <div key={i} className="al-bar">
                <div className="al-bar-meta">
                  <div className="al-bar-left">
                    <div className="al-bar-dot" style={{background:CHART_COLORS[i%CHART_COLORS.length]}}/>
                    <span className="al-bar-name">{d.name}</span>
                  </div>
                  <div className="al-bar-right">
                    <span className="al-bar-val">{fmtEur(d.value)}</span>
                    <span className="al-bar-pct">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="al-track">
                  <div className="al-fill" style={{width:`${pct}%`,background:CHART_COLORS[i%CHART_COLORS.length]}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="al-cats" style={{gridTemplateColumns:`repeat(${catCols},1fr)`}}>
        {catEntries.map(([type,val]) => {
          const pct  = total>0?((val/total)*100).toFixed(1):0
          const meta = TYPE_META[type]||{label:type,color:COLORS.textMuted}
          return (
            <div key={type} className="al-cat">
              <p className="al-cat-l" style={{color:meta.color}}>{meta.label}</p>
              <p className="al-cat-v">{fmtEur(val)}</p>
              <p className="al-cat-p">{pct}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}