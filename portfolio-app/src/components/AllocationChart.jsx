import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import CorrelationMatrix from './Correlationmatrix'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS, CHART_COLORS, TYPE_COLORS } from './design-tokens'

const TYPE_META = {
  efectiu:   { label:'Efectiu',        color: COLORS.textMuted  },
  estalvi:   { label:'Estalvis',       color: COLORS.neonGreen  },
  etf:       { label:'ETF',            color: COLORS.neonCyan   },
  stock:     { label:'Accions',        color: COLORS.neonPurple },
  robo:      { label:'Robo',           color: COLORS.neonAmber  },
  crypto:    { label:'Crypto',         color: COLORS.neonAmber  },
  commodity: { label:'Mat. primeres',  color: '#c8961a'         },
}


const styles = `
  .al { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .al-hero { background:linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%); border:1px solid var(--c-border); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .al-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,var(--c-bg-green) 0%,transparent 70%); pointer-events:none; }
  .al-hero-label { font-size:11px; font-weight:500; color:var(--c-text-muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .al-hero-total { font-size:36px; font-weight:600; color:var(--c-text-primary); letter-spacing:0.5px; line-height:1; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; margin-bottom:10px; }
  .al-hero-total span { font-size:20px; opacity:0.35; font-weight:300; }
  .al-hero-cats { display:flex; gap:16px; flex-wrap:wrap; }
  .al-hero-cat { display:flex; align-items:center; gap:6px; }
  .al-hero-cat-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .al-hero-cat-name { font-size:11px; color:var(--c-text-secondary); }
  .al-hero-cat-val { font-size:12px; font-family:${FONTS.num}; font-weight:500; color:var(--c-text-primary); font-variant-numeric:tabular-nums; margin-left:2px; }
  .al-hero-cat-pct { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.num}; margin-left:2px; }

  /* ── Layout ── */
  .al-layout { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:680px) { .al-layout { grid-template-columns:1fr; } }

  /* ── Panel ── */
  .al-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; padding:16px; }
  .al-panel-title { font-size:10px; font-weight:600; color:var(--c-text-secondary); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:14px; }

  /* ── Donut ── */
  .al-donut-wrap { position:relative; }
  .al-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
  .al-center-l { font-size:9px; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .al-center-v { font-size:20px; font-weight:300; font-family:${FONTS.num}; color:var(--c-text-primary); letter-spacing:-0.8px; font-variant-numeric:tabular-nums; }

  /* ── Donut legend tabs ── */
  .al-tabs { display:flex; gap:4px; margin-bottom:14px; flex-wrap:wrap; }
  .al-tab { padding:4px 10px; border-radius:20px; font-size:10px; font-weight:500; cursor:pointer; transition:all 100ms; border:1px solid var(--c-border); background:transparent; color:var(--c-text-secondary); font-family:${FONTS.sans}; }
  .al-tab:hover { color:rgba(255,255,255,0.70); border-color:var(--c-text-disabled); }
  .al-tab.on { background:rgba(0,255,136,0.10); border-color:rgba(0,255,136,0.25); color:${COLORS.neonGreen}; }

  /* ── Barres ── */
  .al-bar { margin-bottom:10px; }
  .al-bar:last-child { margin-bottom:0; }
  .al-bar-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
  .al-bar-left { display:flex; align-items:center; gap:7px; min-width:0; }
  .al-bar-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .al-bar-name { font-size:12px; color:var(--c-text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; }
  .al-bar-right { display:flex; align-items:baseline; gap:6px; flex-shrink:0; }
  .al-bar-val  { font-size:13px; font-family:${FONTS.num}; font-weight:400; color:var(--c-text-primary); font-variant-numeric:tabular-nums; }
  .al-bar-pct  { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.num}; }
  .al-track    { height:3px; background:var(--c-border); border-radius:2px; overflow:hidden; }
  .al-fill     { height:100%; border-radius:2px; transition:width 500ms cubic-bezier(0.4,0,0.2,1); }

  /* ── Categories ── */
  .al-cats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  @media (min-width:480px) { .al-cats-grid { grid-template-columns:repeat(4,1fr); } }
  @media (min-width:700px) { .al-cats-grid { grid-template-columns:repeat(6,1fr); } }
  .al-cat { background:var(--c-elevated); border:1px solid var(--c-border); border-radius:8px; padding:12px 12px 10px; }
  .al-cat-dot { width:5px; height:5px; border-radius:50%; margin-bottom:8px; }
  .al-cat-l { font-size:9px; font-weight:500; text-transform:uppercase; letter-spacing:0.10em; color:var(--c-text-secondary); margin-bottom:5px; }
  .al-cat-v { font-size:15px; font-weight:300; font-family:${FONTS.num}; color:var(--c-text-primary); letter-spacing:-0.5px; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .al-cat-p { font-size:11px; font-family:${FONTS.num}; color:var(--c-text-muted); font-weight:400; }

  /* ── Tooltip ── */
  .al-empty { padding:56px 0; text-align:center; font-size:13px; color:var(--c-text-muted); }
`

const AlTooltip = ({ active, payload, total }) => {
  if (!active||!payload?.length) return null
  const d   = payload[0].payload
  const pct = total>0?((d.value/total)*100).toFixed(1):0
  return (
    <div style={{background:'var(--c-elevated)',border:`1px solid var(--c-border)`,borderRadius:6,padding:'9px 12px',fontFamily:FONTS.sans}}>
      <p style={{fontSize:11,fontWeight:500,color:'var(--c-text-secondary)',marginBottom:5}}>{d.name}</p>
      <p style={{fontSize:16,fontWeight:300,fontFamily:FONTS.num,color:'var(--c-text-primary)',letterSpacing:'-0.5px',fontVariantNumeric:'tabular-nums',marginBottom:2}}>{fmtEur(d.value)}</p>
      <p style={{fontSize:10,color:'var(--c-text-muted)',fontFamily:FONTS.num}}>{pct}% del total</p>
    </div>
  )
}

export default function AllocationChart({ investments, savings, cryptos=[], commodities=[], fxRates={} }) {
  const [view, setView] = useState('actiu')  // 'actiu' | 'categoria'

  const invValue = inv => {
    const qty      = inv.totalQty || inv.qty || 0
    const origCurr = inv.originalCurrency || inv.currency || 'EUR'
    if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
      return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
    if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
    return inv.totalCost || inv.initialValue || 0
  }

  // Tots els actius individuals
  const dataActiu = [
    ...investments.map(inv => ({ name:inv.name, value:invValue(inv), type:inv.type })),
    ...savings.map(s => ({ name:s.name, value:s.amount, type:'estalvi' })),
    ...cryptos.map(c => {
      const qty = c.totalQty??c.qty??0
      return { name:c.name, value:qty>0&&c.currentPrice!=null?qty*c.currentPrice:c.totalCost||c.initialValue||0, type:'crypto' }
    }),
    ...commodities.map(c => {
      const qty = c.totalQty??c.qty??0
      return { name:c.name, value:qty>0&&c.currentPriceEur!=null?qty*c.currentPriceEur:qty>0&&c.currentPrice!=null&&c.fxRate?qty*c.currentPrice*c.fxRate:c.totalCost||0, type:'commodity' }
    }),
  ].filter(d => d.value > 0).sort((a,b) => b.value - a.value)

  const total = dataActiu.reduce((s,d) => s + d.value, 0)

  // Per categoria
  const byType = dataActiu.reduce((acc,d) => { acc[d.type]=(acc[d.type]||0)+d.value; return acc }, {})
  const dataCat = Object.entries(byType)
    .map(([type,value]) => ({ name: TYPE_META[type]?.label || type, value, type }))
    .sort((a,b) => b.value - a.value)

  const donutData  = view === 'actiu' ? dataActiu : dataCat
  const colorForItem = (item, i) => {
    if (view === 'categoria') return TYPE_META[item.type]?.color || CHART_COLORS[i % CHART_COLORS.length]
    return CHART_COLORS[i % CHART_COLORS.length]
  }

  if (dataActiu.length === 0) return (
    <div className="al">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <div className="al-empty">Afegeix inversions per veure la distribució</div>
    </div>
  )

  return (
    <div className="al">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="al-hero">
        <p className="al-hero-label">Distribució del portfoli</p>
        <p className="al-hero-total">{fmtEur(total).replace('€','')}<span>€</span></p>
        <div className="al-hero-cats">
          {dataCat.map((cat, i) => {
            const pct = total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0
            const color = TYPE_META[cat.type]?.color || CHART_COLORS[i % CHART_COLORS.length]
            return (
              <div key={cat.type} className="al-hero-cat">
                <div className="al-hero-cat-dot" style={{ background: color }}/>
                <span className="al-hero-cat-name">{cat.name}</span>
                <span className="al-hero-cat-val">{fmtEur(cat.value)}</span>
                <span className="al-hero-cat-pct">({pct}%)</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Donut + Barres */}
      <div className="al-layout">
        {/* Donut */}
        <div className="al-panel">
          <div className="al-tabs">
            {['actiu','categoria'].map(v => (
              <button key={v} className={`al-tab${view===v?' on':''}`} onClick={() => setView(v)}>
                {v === 'actiu' ? 'Per actiu' : 'Per categoria'}
              </button>
            ))}
          </div>
          <div className="al-donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData} cx="50%" cy="50%"
                  innerRadius={62} outerRadius={95}
                  paddingAngle={1} dataKey="value"
                >
                  {donutData.map((item, i) => (
                    <Cell key={i} fill={colorForItem(item, i)} stroke={COLORS.bg} strokeWidth={2}/>
                  ))}
                </Pie>
                <Tooltip content={<AlTooltip total={total}/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="al-center">
              <span className="al-center-l">{dataActiu.length} actius</span>
              <span className="al-center-v">{fmtEur(total)}</span>
            </div>
          </div>
        </div>

        {/* Barres de detall */}
        <div className="al-panel">
          <p className="al-panel-title">
            {view === 'actiu' ? `Top ${Math.min(dataActiu.length, 10)} actius` : 'Per categoria'}
          </p>
          {(view === 'actiu' ? dataActiu.slice(0, 10) : dataCat).map((d, i) => {
            const pct   = total > 0 ? (d.value / total) * 100 : 0
            const color = colorForItem(d, i)
            return (
              <div key={i} className="al-bar">
                <div className="al-bar-meta">
                  <div className="al-bar-left">
                    <div className="al-bar-dot" style={{ background: color }}/>
                    <span className="al-bar-name">{d.name}</span>
                  </div>
                  <div className="al-bar-right">
                    <span className="al-bar-val">{fmtEur(d.value)}</span>
                    <span className="al-bar-pct">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="al-track">
                  <div className="al-fill" style={{ width:`${pct}%`, background: color }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cards de categories */}
      <div className="al-panel">
        <p className="al-panel-title">Per categoria</p>
        <div className="al-cats-grid">
          {dataCat.map((cat, i) => {
            const pct   = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0
            const color = TYPE_META[cat.type]?.color || CHART_COLORS[i % CHART_COLORS.length]
            return (
              <div key={cat.type} className="al-cat">
                <div className="al-cat-dot" style={{ background: color }}/>
                <p className="al-cat-l">{cat.name}</p>
                <p className="al-cat-v">{fmtEur(cat.value)}</p>
                <p className="al-cat-p">{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Matriu de correlació */}
      <CorrelationMatrix investments={investments}/>
    </div>
  )
}