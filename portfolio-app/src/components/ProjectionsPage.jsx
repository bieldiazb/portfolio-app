// ─── ProjectionsPage.v2.jsx ─────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const DEFAULT_RETURNS = { etf: 8, stock: 9, robo: 6.5, estalvi: 1.5, efectiu: 1.8, crypto: 15 }

function fv(pv, pmt, r, n) {
  if (r === 0) return pv + pmt * n
  const m = r / 100 / 12
  return pv * Math.pow(1 + m, n) + pmt * (Math.pow(1 + m, n) - 1) / m
}

const prStyles = `
  .pr-v2 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }
  .pr-mc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
  @media (max-width: 600px) { .pr-mc-grid { grid-template-columns: 1fr 1fr; } }
  .pr-mc { padding: 12px 13px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; background: rgba(255,255,255,0.018); }
  .pr-mc-l { font-size: 10px; color: rgba(255,255,255,0.26); letter-spacing: 0.03em; margin-bottom: 4px; }
  .pr-mc-v { font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.80); font-family: 'Geist Mono', monospace; letter-spacing: -0.5px; }
  .pr-mc-v.g { color: rgba(80,210,110,0.85); }
  .pr-sl-panel { border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 14px 16px; background: rgba(255,255,255,0.015); }
  .pr-sl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .pr-sl-lbl { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.55); }
  .pr-sl-val { font-size: 18px; font-weight: 300; color: rgba(255,255,255,0.85); font-family: 'Geist Mono', monospace; letter-spacing: -0.8px; }
  .pr-range { -webkit-appearance: none; appearance: none; width: 100%; height: 2px; border-radius: 1px; background: rgba(255,255,255,0.08); outline: none; cursor: pointer; }
  .pr-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: rgba(255,255,255,0.82); border: none; cursor: pointer; box-shadow: 0 0 0 3px rgba(255,255,255,0.08); }
  .pr-ticks { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.20); margin-top: 6px; }
  .pr-chart-panel { border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; background: rgba(255,255,255,0.015); }
  .pr-chart-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.42); margin-bottom: 14px; }
  .pr-asset-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .pr-asset-row:last-child { border-bottom: none; }
  .pr-asset-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.68); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pr-asset-meta { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 1px; }
  .pr-inp { width: 62px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 5px 8px; font-family: 'Geist Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.70); outline: none; text-align: right; transition: border-color 100ms; }
  .pr-inp:focus { border-color: rgba(255,255,255,0.18); }
  .pr-inp::placeholder { color: rgba(255,255,255,0.18); }
  .pr-unit { font-size: 10px; color: rgba(255,255,255,0.22); white-space: nowrap; flex-shrink: 0; }
  .pr-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 12px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); }
  .pr-total-l { font-size: 12px; color: rgba(255,255,255,0.50); }
  .pr-total-v { font-size: 17px; font-weight: 300; color: rgba(255,255,255,0.82); font-family: 'Geist Mono', monospace; letter-spacing: -0.5px; }
`

const PrTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, padding: '10px 13px', fontFamily: "'Geist', sans-serif" }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginBottom: 8 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', fontFamily: "'Geist Mono', monospace" }}>{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ProjectionsPage({ investments, savings, cryptos = [] }) {
  const [years, setYears] = useState(10)
  const [contributions, setContributions] = useState({})

  const allAssets = [
    ...investments.map(i => ({ ...i, category: i.type })),
    ...savings.map(s => ({ ...s, category: 'estalvi', currentPrice: null })),
    ...cryptos.map(c => ({ ...c, category: 'crypto', initialValue: c.initialValue || 0 })),
  ]
  const getContribution = id => parseFloat(contributions[id] || 0)
  const getRate = asset => DEFAULT_RETURNS[asset.category] || 8

  const chartData = useMemo(() => {
    const points = []
    const step = Math.max(1, Math.floor(years / 20))
    for (let y = 0; y <= years; y += step) {
      const n = y * 12
      let total = 0, cost = 0
      allAssets.forEach(a => {
        const pv = getEffectiveValue(a) || a.initialValue || 0
        const pmt = getContribution(a.id)
        total += fv(pv, pmt, getRate(a), n)
        cost  += pv + pmt * n
      })
      points.push({ any: y === 0 ? 'Avui' : `${y}a`, 'Valor': Math.round(total), 'Capital': Math.round(cost) })
    }
    return points
  }, [years, contributions, allAssets.length])

  const last = chartData[chartData.length - 1] || {}
  const finalValue = last['Valor'] || 0
  const finalCost  = last['Capital'] || 0
  const totalMonthly = allAssets.reduce((s, a) => s + getContribution(a.id), 0)

  return (
    <div className="pr-v2">
      <style>{`${SHARED_STYLES}${prStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Projeccions</h2>
        <p className="sec-v2-sub">Simulació basada en rendiments estimats</p>
      </div>

      <div className="pr-mc-grid">
        <div className="pr-mc"><p className="pr-mc-l">Als {years} anys</p><p className="pr-mc-v g">{fmtEur(finalValue)}</p></div>
        <div className="pr-mc"><p className="pr-mc-l">Capital aportat</p><p className="pr-mc-v">{fmtEur(finalCost)}</p></div>
        <div className="pr-mc"><p className="pr-mc-l">Guany interès</p><p className="pr-mc-v g">{fmtEur(finalValue - finalCost)}</p></div>
        <div className="pr-mc"><p className="pr-mc-l">Aportació/mes</p><p className="pr-mc-v">{fmtEur(totalMonthly)}</p></div>
      </div>

      <div className="pr-sl-panel">
        <div className="pr-sl-row">
          <span className="pr-sl-lbl">Horitzó temporal</span>
          <span className="pr-sl-val">{years}a</span>
        </div>
        <input type="range" min="1" max="40" value={years} onChange={e => setYears(Number(e.target.value))} className="pr-range" />
        <div className="pr-ticks"><span>1a</span><span>10</span><span>20</span><span>30</span><span>40a</span></div>
      </div>

      <div className="pr-chart-panel">
        <p className="pr-chart-title">Evolució del portfoli</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="any" tick={{ fontSize: 10, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.28)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.28)' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<PrTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Geist', color: 'rgba(255,255,255,0.32)', paddingTop: 10 }} />
            <Line type="monotone" dataKey="Valor" stroke="rgba(80,210,110,0.75)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Capital" stroke="rgba(255,255,255,0.20)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pr-chart-panel">
        <p className="pr-chart-title">Aportació mensual per actiu</p>
        {allAssets.map(asset => (
          <div key={asset.id} className="pr-asset-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="pr-asset-name">{asset.name}</p>
              <p className="pr-asset-meta">{asset.category?.toUpperCase()} · {getRate(asset)}% anual</p>
            </div>
            <input type="number" min="0" step="10"
              value={contributions[asset.id] || ''}
              onChange={e => setContributions(c => ({ ...c, [asset.id]: e.target.value }))}
              placeholder="0" className="pr-inp" />
            <span className="pr-unit">€/mes</span>
          </div>
        ))}
        {totalMonthly > 0 && (
          <div className="pr-total">
            <span className="pr-total-l">Total mensual</span>
            <span className="pr-total-v">{fmtEur(totalMonthly)}</span>
          </div>
        )}
      </div>
    </div>
  )
}


