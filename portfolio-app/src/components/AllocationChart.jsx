import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fmtEur, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES, CHART_COLORS } from './design-tokens'

const TYPE_META = {
  efectiu: { label:'Efectiu', color:'rgba(255,255,255,0.45)' },
  estalvi: { label:'Estalvis', color:'rgba(80,210,110,0.85)'  },
  etf:     { label:'ETF',     color:'rgba(100,155,255,0.85)' },
  stock:   { label:'Acció',   color:'rgba(180,130,255,0.85)' },
  robo:    { label:'Robo',    color:'rgba(255,170,70,0.85)'  },
  crypto:  { label:'Crypto',  color:'rgba(255,170,70,0.85)'  },
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

  .al { font-family:'Geist',sans-serif; display:flex; flex-direction:column; gap:2px; }

  .al-title { font-size:18px; font-weight:600; color:rgba(255,255,255,0.90); letter-spacing:-0.3px; margin-bottom:4px; }
  .al-sub { font-size:13px; color:rgba(255,255,255,0.35); font-family:'Geist Mono',monospace; margin-bottom:20px; }

  /* Bloc principal: donut + detall */
  .al-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    overflow: hidden;
  }
  @media (max-width:600px) {
    .al-main { grid-template-columns: 1fr; }
  }

  .al-panel { background:#0d1117; padding:20px; }
  .al-panel-title {
    font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,0.28);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 16px;
  }

  /* Donut */
  .al-donut-wrap { position:relative; }
  .al-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    pointer-events: none;
  }
  .al-center-l { font-size:10px; color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:3px; }
  .al-center-v { font-size:17px; font-weight:700; color:rgba(255,255,255,0.90); letter-spacing:-0.5px; font-variant-numeric:tabular-nums; }

  /* Barres */
  .al-bar { margin-bottom:13px; }
  .al-bar:last-child { margin-bottom:0; }
  .al-bar-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
  .al-bar-left { display:flex; align-items:center; gap:7px; min-width:0; }
  .al-bar-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .al-bar-name { font-size:12px; color:rgba(255,255,255,0.62); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
  .al-bar-right { display:flex; align-items:baseline; gap:5px; flex-shrink:0; }
  .al-bar-val { font-size:12px; color:rgba(255,255,255,0.78); font-family:'Geist Mono',monospace; letter-spacing:-0.3px; }
  .al-bar-pct { font-size:10px; color:rgba(255,255,255,0.28); }
  .al-track { height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
  .al-fill { height:100%; border-radius:2px; transition:width 600ms cubic-bezier(0.4,0,0.2,1); }

  /* Categories */
  .al-cats {
    display: grid;
    gap: 1px;
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    overflow: hidden;
  }
  .al-cat { background:#0d1117; padding:16px 14px; }
  .al-cat-l { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
  .al-cat-v { font-size:16px; font-weight:700; color:rgba(255,255,255,0.88); letter-spacing:-0.5px; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .al-cat-p { font-size:11px; color:rgba(255,255,255,0.28); }

  .al-empty { padding:56px 0; text-align:center; font-size:14px; color:rgba(255,255,255,0.28); font-weight:500; }
`

const AlTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.10)', borderRadius:12, padding:'10px 14px', fontFamily:"'Geist',sans-serif" }}>
      <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.65)', marginBottom:5 }}>{d.name}</p>
      <p style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.88)', fontFamily:"'Geist Mono',monospace", letterSpacing:'-0.3px', marginBottom:2 }}>{fmtEur(d.value)}</p>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.30)' }}>{pct}% del total</p>
    </div>
  )
}

export default function AllocationChart({ investments, savings, cryptos = [] }) {
  const data = [
    ...investments.map(inv => ({ name: inv.name, value: getEffectiveValue(inv), type: inv.type })),
    ...savings.map(s   => ({ name: s.name, value: s.amount, type: 'estalvi' })),
    ...cryptos.map(c   => ({
      name:  c.name,
      value: (c.totalQty ?? c.qty ?? 0) && c.currentPrice
        ? (c.totalQty ?? c.qty) * c.currentPrice
        : c.initialValue || 0,
      type: 'crypto',
    })),
  ].filter(d => d.value > 0).sort((a, b) => b.value - a.value)

  const total  = data.reduce((s, d) => s + d.value, 0)
  const byType = data.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + d.value
    return acc
  }, {})

  const catEntries = Object.entries(byType).sort((a, b) => b[1] - a[1])

  // Grid dinàmic per categories
  const catCols = Math.min(catEntries.length, 6)

  if (data.length === 0) return (
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

      {/* Donut + Detall */}
      <div className="al-main" style={{ marginBottom: 2 }}>
        {/* Donut */}
        <div className="al-panel">
          <p className="al-panel-title">Per actiu</p>
          <div className="al-donut-wrap">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={data} cx="50%" cy="50%"
                  innerRadius={62} outerRadius={95}
                  paddingAngle={1} dataKey="value"
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      stroke="rgba(13,17,23,0.9)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<AlTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="al-center">
              <span className="al-center-l">Total</span>
              <span className="al-center-v">{fmtEur(total)}</span>
            </div>
          </div>
        </div>

        {/* Barres detall */}
        <div className="al-panel">
          <p className="al-panel-title">Detall</p>
          {data.map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0
            return (
              <div key={i} className="al-bar">
                <div className="al-bar-meta">
                  <div className="al-bar-left">
                    <div className="al-bar-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="al-bar-name">{d.name}</span>
                  </div>
                  <div className="al-bar-right">
                    <span className="al-bar-val">{fmtEur(d.value)}</span>
                    <span className="al-bar-pct">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="al-track">
                  <div className="al-fill" style={{ width:`${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories */}
      <div
        className="al-cats"
        style={{ gridTemplateColumns: `repeat(${catCols}, 1fr)` }}
      >
        {catEntries.map(([type, val]) => {
          const pct  = total > 0 ? ((val / total) * 100).toFixed(1) : 0
          const meta = TYPE_META[type] || { label: type, color:'rgba(255,255,255,0.45)' }
          return (
            <div key={type} className="al-cat">
              <p className="al-cat-l" style={{ color: meta.color }}>{meta.label}</p>
              <p className="al-cat-v">{fmtEur(val)}</p>
              <p className="al-cat-p">{pct}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}