// ─── AllocationChart.v2.jsx ─────────────────────────────────────────────────

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from './design-tokens'

const TYPE_META_V2 = {
  efectiu: { label: 'Efectiu', color: 'rgba(255,255,255,0.42)', bg: 'rgba(255,255,255,0.04)' },
  estalvi: { label: 'Estalvi', color: 'rgba(80,210,110,0.72)',  bg: 'rgba(60,200,90,0.08)' },
  etf:     { label: 'ETF',     color: 'rgba(100,155,255,0.75)', bg: 'rgba(80,130,255,0.08)' },
  stock:   { label: 'Accions', color: 'rgba(180,130,255,0.75)', bg: 'rgba(160,110,255,0.08)' },
  robo:    { label: 'Robo',    color: 'rgba(255,170,70,0.75)',  bg: 'rgba(255,150,50,0.08)' },
  crypto:  { label: 'Crypto',  color: 'rgba(255,170,70,0.75)',  bg: 'rgba(255,150,50,0.08)' },
}

const alStyles = `
  .al-v2 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }
  .al-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 900px) { .al-grid { grid-template-columns: 1fr 1fr; } }
  .al-panel { border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; background: rgba(255,255,255,0.015); }
  .al-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.42); margin-bottom: 14px; }
  .al-donut-wrap { position: relative; }
  .al-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
  .al-center-l { font-size: 10px; color: rgba(255,255,255,0.26); font-weight: 400; letter-spacing: 0.05em; text-transform: uppercase; }
  .al-center-v { font-size: 15px; font-weight: 300; color: rgba(255,255,255,0.80); font-family: 'Geist Mono', monospace; letter-spacing: -0.4px; margin-top: 2px; }
  .al-bar { margin-bottom: 10px; }
  .al-bar:last-child { margin-bottom: 0; }
  .al-bar-meta { display: flex; justify-content: space-between; margin-bottom: 3px; align-items: center; }
  .al-bar-left { display: flex; align-items: center; gap: 6px; }
  .al-bar-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .al-bar-name { font-size: 12px; color: rgba(255,255,255,0.58); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
  .al-bar-right { display: flex; align-items: baseline; gap: 5px; flex-shrink: 0; }
  .al-bar-val { font-size: 12px; color: rgba(255,255,255,0.68); font-family: 'Geist Mono', monospace; letter-spacing: -0.2px; }
  .al-bar-pct { font-size: 10px; color: rgba(255,255,255,0.28); }
  .al-track { height: 2px; background: rgba(255,255,255,0.06); border-radius: 1px; overflow: hidden; }
  .al-fill { height: 100%; border-radius: 1px; transition: width 600ms cubic-bezier(0.4,0,0.2,1); }
  .al-cat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 7px; }
  @media (min-width: 640px) { .al-cat-grid { grid-template-columns: repeat(3,1fr); } }
  @media (min-width: 1024px) { .al-cat-grid { grid-template-columns: repeat(6,1fr); } }
  .al-cat { border: 1px solid rgba(255,255,255,0.05); border-radius: 5px; padding: 10px 11px; background: rgba(255,255,255,0.02); }
  .al-cat-type { font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 6px; }
  .al-cat-val { font-size: 13px; font-weight: 300; font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .al-cat-pct { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 2px; }
  .al-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
`

const AlTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, padding: '10px 13px', fontFamily: "'Geist', sans-serif" }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.60)', marginBottom: 5 }}>{d.name}</p>
      <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.82)', fontFamily: "'Geist Mono', monospace", letterSpacing: '-0.3px' }}>{fmtEur(d.value)}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>{pct}% del total</p>
    </div>
  )
}

export default function AllocationChart({ investments, savings, cryptos = [] }) {
  const data = [
    ...investments.map(inv => ({ name: inv.name, value: getEffectiveValue(inv), type: inv.type })),
    ...savings.map(s => ({ name: s.name, value: s.amount, type: 'estalvi' })),
    ...cryptos.map(c => ({ name: c.name, value: c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0, type: 'crypto' })),
  ].filter(d => d.value > 0).sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)
  const byType = data.reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + d.value; return acc }, {})

  if (data.length === 0) return (
    <div className="al-v2">
      <style>{`${SHARED_STYLES}${alStyles}`}</style>
      <div className="al-empty">Afegeix inversions per veure la distribució</div>
    </div>
  )

  return (
    <div className="al-v2">
      <style>{`${SHARED_STYLES}${alStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Distribució</h2>
        <p className="sec-v2-sub" style={{ fontFamily: "'Geist Mono', monospace" }}>{fmtEur(total)}</p>
      </div>

      <div className="al-grid">
        <div className="al-panel">
          <p className="al-panel-title">Per actiu</p>
          <div className="al-donut-wrap">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={62} outerRadius={98} paddingAngle={2} dataKey="value">
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#080808" strokeWidth={2} />
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
                  <div className="al-fill" style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="al-panel">
        <p className="al-panel-title">Per categoria</p>
        <div className="al-cat-grid">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, val]) => {
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0
            const meta = TYPE_META_V2[type] || { label: type, color: 'rgba(255,255,255,0.42)', bg: 'rgba(255,255,255,0.04)' }
            return (
              <div key={type} className="al-cat" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="al-cat-type" style={{ color: meta.color }}>{meta.label}</p>
                <p className="al-cat-val" style={{ color: meta.color }}>{fmtEur(val)}</p>
                <p className="al-cat-pct">{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}