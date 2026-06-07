import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import CorrelationMatrix from './Correlationmatrix'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS, CHART_COLORS, TYPE_COLORS } from './design-tokens'

const TYPE_META = {
  efectiu:   { label:'Efectiu',       color: COLORS.textMuted   },
  estalvi:   { label:'Estalvis',      color: COLORS.neonGreen   },
  etf:       { label:'ETF',           color: COLORS.neonCyan    },
  stock:     { label:'Accions',       color: COLORS.neonPurple  },
  robo:      { label:'Robo',          color: COLORS.neonAmber   },
  crypto:    { label:'Crypto',        color: COLORS.neonAmber   },
  commodity: { label:'Mat. primeres', color: '#c8961a'          },
}

const styles = `
  .al { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero centrat ── */
  .al-hero { text-align:center; padding:28px 20px 20px; }
  .al-hero-label { font-size:11px; font-weight:400; color:var(--c-text-muted); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:8px; }
  .al-hero-total { font-size:44px; font-weight:600; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; letter-spacing:-2px; margin-bottom:14px; }
  .al-hero-total span { font-size:26px; opacity:0.4; font-weight:300; }

  /* Barra distribució horitzontal */
  .al-hbar { display:flex; height:8px; border-radius:4px; overflow:hidden; gap:1px; margin-bottom:12px; }
  .al-hbar-seg { height:100%; border-radius:2px; transition:flex 600ms cubic-bezier(0.4,0,0.2,1); }
  .al-hero-cats { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
  .al-hero-cat { display:flex; align-items:center; gap:5px; }
  .al-hero-cat-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .al-hero-cat-name { font-size:11px; color:var(--c-text-secondary); }
  .al-hero-cat-pct { font-size:11px; font-family:${FONTS.mono}; color:var(--c-text-muted); }

  /* ── Divider ── */
  .al-divider { height:1px; background:var(--c-border); margin:0; }

  /* ── Layout ── */
  .al-layout { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media (max-width:680px) { .al-layout { grid-template-columns:1fr; } }

  /* ── Panel ── */
  .al-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; padding:16px; }
  .al-panel-title { font-size:11px; font-weight:600; color:var(--c-text-secondary); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:14px; }

  /* ── Tabs ── */
  .al-tabs { display:flex; gap:4px; margin-bottom:16px; background:var(--c-elevated); border-radius:8px; padding:3px; }
  .al-tab { flex:1; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:500; cursor:pointer; transition:all 100ms; border:none; background:transparent; color:var(--c-text-muted); font-family:${FONTS.sans}; text-align:center; }
  .al-tab.on { background:var(--c-surface); color:var(--c-text-primary); border:1px solid var(--c-border); }

  /* ── Donut ── */
  .al-donut-wrap { position:relative; }
  .al-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
  .al-center-l { font-size:9px; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .al-center-v { font-size:22px; font-weight:500; font-family:${FONTS.num}; color:var(--c-text-primary); letter-spacing:-0.8px; font-variant-numeric:tabular-nums; }

  /* ── Barres detall ── */
  .al-bar { margin-bottom:11px; }
  .al-bar:last-child { margin-bottom:0; }
  .al-bar-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
  .al-bar-left { display:flex; align-items:center; gap:7px; min-width:0; }
  .al-bar-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .al-bar-name { font-size:12px; color:var(--c-text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px; }
  .al-bar-right { display:flex; align-items:baseline; gap:6px; flex-shrink:0; }
  .al-bar-val { font-size:13px; font-family:${FONTS.mono}; font-weight:500; color:var(--c-text-primary); font-variant-numeric:tabular-nums; }
  .al-bar-pct { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .al-track { height:3px; background:var(--c-border); border-radius:2px; overflow:hidden; }
  .al-fill { height:100%; border-radius:2px; transition:width 600ms cubic-bezier(0.4,0,0.2,1); }

  /* ── Cards categories ── */
  .al-cats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  @media (min-width:480px) { .al-cats-grid { grid-template-columns:repeat(4,1fr); } }
  @media (min-width:700px) { .al-cats-grid { grid-template-columns:repeat(6,1fr); } }
  .al-cat { background:var(--c-elevated); border:1px solid var(--c-border); border-radius:10px; padding:13px 12px; }
  .al-cat-dot { width:5px; height:5px; border-radius:50%; margin-bottom:8px; }
  .al-cat-l { font-size:9px; font-weight:500; text-transform:uppercase; letter-spacing:0.10em; color:var(--c-text-muted); margin-bottom:5px; }
  .al-cat-v { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-text-primary); letter-spacing:-0.5px; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .al-cat-p { font-size:11px; font-family:${FONTS.mono}; color:var(--c-text-muted); }

  /* ── Tooltip ── */
  .al-tip { background:var(--c-elevated); border:1px solid var(--c-border); border-radius:8px; padding:10px 13px; font-family:${FONTS.sans}; }
  .al-tip-name { font-size:11px; color:var(--c-text-secondary); margin-bottom:5px; }
  .al-tip-val { font-size:16px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-text-primary); letter-spacing:-0.5px; margin-bottom:2px; }
  .al-tip-pct { font-size:10px; color:var(--c-text-muted); }

  .al-empty { padding:56px 0; text-align:center; font-size:13px; color:var(--c-text-muted); }
`

const AlTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
  return (
    <div className="al-tip">
      <p className="al-tip-name">{d.name}</p>
      <p className="al-tip-val">{fmtEur(d.value)}</p>
      <p className="al-tip-pct">{pct}% del total</p>
    </div>
  )
}

export default function AllocationChart({ investments, savings, cryptos=[], commodities=[], fxRates={} }) {
  const [view, setView] = useState('actiu')

  const invValue = inv => {
    const qty      = inv.totalQty || inv.qty || 0
    const origCurr = inv.originalCurrency || inv.currency || 'EUR'
    if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
      return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
    if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
    return inv.totalCost || inv.initialValue || 0
  }

  const dataActiu = [
    ...investments
      .filter(i => (i.totalQty||0) > 0.00001 || (i.totalCostEur||i.totalCost||0) > 0.01)
      .map(inv => ({ name:inv.name, value:invValue(inv), type:inv.type })),
    ...savings.map(s => ({ name:s.name, value:s.amount||s.balance||0, type:'estalvi' })),
    ...cryptos.map(c => {
      const qty = c.totalQty??c.qty??0
      return { name:c.name, value:qty>0&&c.currentPrice!=null?qty*c.currentPrice:c.totalCost||0, type:'crypto' }
    }),
    ...commodities.map(c => {
      const qty = c.totalQty??c.qty??0
      return { name:c.name, value:qty>0&&c.currentPriceEur!=null?qty*c.currentPriceEur:c.totalCost||0, type:'commodity' }
    }),
  ].filter(d => d.value > 0.01).sort((a,b) => b.value - a.value)

  const total = dataActiu.reduce((s,d) => s + d.value, 0)

  const byType = dataActiu.reduce((acc,d) => { acc[d.type]=(acc[d.type]||0)+d.value; return acc }, {})
  const dataCat = Object.entries(byType)
    .map(([type,value]) => ({ name: TYPE_META[type]?.label || type, value, type }))
    .sort((a,b) => b.value - a.value)

  const donutData = view === 'actiu' ? dataActiu : dataCat
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
        <p className="al-hero-total">
          {fmtEur(total).replace('€','')}<span>€</span>
        </p>

        {/* Barra horitzontal de distribució */}
        <div className="al-hbar">
          {dataCat.map((cat, i) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0
            const color = TYPE_META[cat.type]?.color || CHART_COLORS[i % CHART_COLORS.length]
            return (
              <div key={cat.type} className="al-hbar-seg"
                style={{ flex: pct, background: color, opacity: 0.85 }}/>
            )
          })}
        </div>

        {/* Llegenda */}
        <div className="al-hero-cats">
          {dataCat.map((cat, i) => {
            const pct   = total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0
            const color = TYPE_META[cat.type]?.color || CHART_COLORS[i % CHART_COLORS.length]
            return (
              <div key={cat.type} className="al-hero-cat">
                <div className="al-hero-cat-dot" style={{ background: color }}/>
                <span className="al-hero-cat-name">{cat.name}</span>
                <span className="al-hero-cat-pct">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="al-divider"/>

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
                  innerRadius={65} outerRadius={98}
                  paddingAngle={1.5} dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((item, i) => (
                    <Cell key={i} fill={colorForItem(item, i)}
                      stroke="var(--c-bg)" strokeWidth={2}
                      style={{outline:'none'}}
                    />
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

        {/* Barres */}
        <div className="al-panel">
          <p className="al-panel-title">
            {view === 'actiu' ? `Top ${Math.min(dataActiu.length, 10)} actius` : 'Per categoria'}
          </p>
          {(view === 'actiu' ? dataActiu.slice(0,10) : dataCat).map((d,i) => {
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

      {/* Cards per categoria */}
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