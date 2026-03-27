import { useState, useMemo } from 'react'
import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DEFAULT_RETURNS = { etf: 8, stock: 9, robo: 6.5, estalvi: 1.5, efectiu: 1.8, crypto: 15 }

function fv(pv, pmt, r, n) {
  if (r === 0) return pv + pmt * n
  const m = r / 100 / 12
  return pv * Math.pow(1 + m, n) + pmt * (Math.pow(1 + m, n) - 1) / m
}

const prStyles = `
  .pr-v2 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .pr-mc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  @media (max-width: 600px) { .pr-mc-grid { grid-template-columns: 1fr 1fr; } }
  .pr-mc { padding: 12px 13px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; background: rgba(255,255,255,0.018); }
  .pr-mc-l { font-size: 10px; color: rgba(255,255,255,0.26); letter-spacing: 0.03em; margin-bottom: 4px; }
  .pr-mc-v { font-size: 16px; font-weight: 300; color: rgba(255,255,255,0.80); font-family: 'Geist Mono', monospace; letter-spacing: -0.5px; }
  .pr-mc-v.g { color: rgba(80,210,110,0.85); }
  .pr-mc-sub { font-size: 10px; color: rgba(80,210,110,0.55); margin-top: 2px; font-family: 'Geist Mono', monospace; }

  /* Slider millorat */
  .pr-slider-panel { border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 16px 18px; background: rgba(255,255,255,0.015); }
  .pr-slider-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
  .pr-slider-lbl { font-size: 12px; color: rgba(255,255,255,0.42); }
  .pr-slider-val { font-size: 28px; font-weight: 300; color: rgba(255,255,255,0.88); font-family: 'Geist Mono', monospace; letter-spacing: -1px; }
  .pr-slider-val span { font-size: 14px; color: rgba(255,255,255,0.35); margin-left: 4px; }

  .pr-slider-track { position: relative; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; margin: 0 0 10px; }
  .pr-slider-fill { position: absolute; left: 0; top: 0; height: 100%; background: rgba(80,210,110,0.60); border-radius: 2px; pointer-events: none; }
  .pr-range {
    position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; height: 20px; top: -8px;
    -webkit-appearance: none; appearance: none; margin: 0;
  }
  .pr-slider-thumb {
    position: absolute; width: 16px; height: 16px; border-radius: 50%;
    background: rgba(255,255,255,0.90); border: 2px solid rgba(80,210,110,0.80);
    top: -6px; transform: translateX(-50%); pointer-events: none;
  }

  .pr-year-btns { display: flex; gap: 6px; flex-wrap: wrap; }
  .pr-year-btn { padding: 5px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); font-family: 'Geist Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.32); cursor: pointer; transition: all 100ms; }
  .pr-year-btn.on { border-color: rgba(80,210,110,0.40); background: rgba(80,210,110,0.08); color: rgba(80,210,110,0.80); }

  /* Chart */
  .pr-chart-panel { border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; background: rgba(255,255,255,0.015); }
  .pr-chart-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.42); margin-bottom: 14px; }
  .pr-legend { display: flex; gap: 14px; margin-bottom: 12px; }
  .pr-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(255,255,255,0.35); }
  .pr-legend-dot { width: 8px; height: 8px; border-radius: 2px; }

  /* Taula anual */
  .pr-year-table { border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; background: rgba(255,255,255,0.015); }
  .pr-year-table-hdr { display: grid; grid-template-columns: 40px 1fr 1fr 1fr 1fr; gap: 0; padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .pr-year-table-hdr span { font-size: 9px; color: rgba(255,255,255,0.24); text-transform: uppercase; letter-spacing: 0.07em; }
  .pr-year-table-hdr span:not(:first-child) { text-align: right; }
  .pr-year-row { display: grid; grid-template-columns: 40px 1fr 1fr 1fr 1fr; gap: 0; padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 80ms; }
  .pr-year-row:last-child { border-bottom: none; }
  .pr-year-row:hover { background: rgba(255,255,255,0.025); }
  .pr-year-row.total { background: rgba(80,210,110,0.04); border-top: 1px solid rgba(80,210,110,0.10); }
  .pr-yr-n { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.35); font-family: 'Geist Mono', monospace; }
  .pr-yr-v { font-size: 11px; font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.65); text-align: right; }
  .pr-yr-v.g { color: rgba(80,210,110,0.80); }
  .pr-yr-v.sm { font-size: 10px; color: rgba(255,255,255,0.32); }

  /* Contribucions */
  .pr-asset-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .pr-asset-row:last-child { border-bottom: none; }
  .pr-asset-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.68); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pr-asset-meta { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 1px; }
  .pr-inp { width: 68px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 6px 8px; font-family: 'Geist Mono', monospace; font-size: 13px; color: rgba(255,255,255,0.70); outline: none; text-align: right; transition: border-color 100ms; touch-action: manipulation; }
  .pr-inp:focus { border-color: rgba(255,255,255,0.18); }
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

const GainTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value || 0
  return (
    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, padding: '8px 12px', fontFamily: "'Geist Mono', monospace" }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Any {label}</p>
      <p style={{ fontSize: 13, color: val >= 0 ? 'rgba(80,210,110,0.85)' : 'rgba(255,90,70,0.80)' }}>
        {val >= 0 ? '+' : ''}{fmtEur(val)}
      </p>
    </div>
  )
}

const QUICK_YEARS = [1, 3, 5, 10, 15, 20, 30]

export default function ProjectionsPage({ investments, savings, cryptos = [] }) {
  const [years, setYears] = useState(10)
  const [contributions, setContributions] = useState({})

  const allAssets = [
    ...investments.map(i => ({ ...i, category: i.type })),
    ...savings.map(s => ({ ...s, category: 'estalvi', currentPrice: null })),
    ...cryptos.map(c => ({ ...c, category: 'crypto', initialValue: c.initialValue || 0 })),
  ]

  const getContribution = id => parseFloat(contributions[id] || 0)
  const getRate = asset => DEFAULT_RETURNS[asset.category] || 8

  // Calcula el valor total per a N mesos
  const calcTotal = (months) => {
    let total = 0, cost = 0
    allAssets.forEach(a => {
      const pv  = a.category === 'estalvi' ? (a.amount || 0) : (getEffectiveValue?.(a) || a.initialValue || 0)
      const pmt = getContribution(a.id)
      total += fv(pv, pmt, getRate(a), months)
      cost  += pv + pmt * months
    })
    return { total: Math.round(total), cost: Math.round(cost) }
  }

  // Dades del gràfic principal (línia evolució)
  const chartData = useMemo(() => {
    const points = []
    const step = Math.max(1, Math.floor(years / 24))
    for (let y = 0; y <= years; y += step) {
      const { total, cost } = calcTotal(y * 12)
      points.push({ any: y === 0 ? 'Avui' : `${y}a`, 'Valor': total, 'Capital': cost })
    }
    return points
  }, [years, contributions, allAssets.length])

  // Dades de la taula anual + gràfic de barres (guany per any)
  const yearlyData = useMemo(() => {
    const rows = []
    let prevTotal = calcTotal(0).total
    for (let y = 1; y <= years; y++) {
      const { total, cost } = calcTotal(y * 12)
      const prevCost = calcTotal((y - 1) * 12).cost
      const yearGain  = total - prevTotal          // guany net aquest any
      const monthlyContrib = allAssets.reduce((s, a) => s + getContribution(a.id), 0)
      rows.push({
        year:      y,
        total,
        cost,
        yearGain,
        interest:  yearGain - monthlyContrib * 12,  // guany net - aportació = interès pur
        gainPct:   prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0,
      })
      prevTotal = total
    }
    return rows
  }, [years, contributions, allAssets.length])

  const last     = calcTotal(years * 12)
  const today    = calcTotal(0)
  const totalGain     = last.total - last.cost
  const totalMonthly  = allAssets.reduce((s, a) => s + getContribution(a.id), 0)
  const pct           = years > 0 ? ((last.total - today.total) / Math.max(today.total, 1)) * 100 : 0

  const sliderPct = ((years - 1) / 39) * 100

  return (
    <div className="pr-v2">
      <style>{`${SHARED_STYLES}${prStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Projeccions</h2>
        <p className="sec-v2-sub">Simulació basada en rendiments estimats per categoria</p>
      </div>

      {/* KPIs */}
      <div className="pr-mc-grid">
        <div className="pr-mc">
          <p className="pr-mc-l">Als {years} anys</p>
          <p className="pr-mc-v g">{fmtEur(last.total)}</p>
          <p className="pr-mc-sub">+{pct.toFixed(1)}% vs avui</p>
        </div>
        <div className="pr-mc">
          <p className="pr-mc-l">Capital aportat</p>
          <p className="pr-mc-v">{fmtEur(last.cost)}</p>
        </div>
        <div className="pr-mc">
          <p className="pr-mc-l">Guany d'interès</p>
          <p className="pr-mc-v g">{fmtEur(totalGain)}</p>
        </div>
        <div className="pr-mc">
          <p className="pr-mc-l">Aportació/mes</p>
          <p className="pr-mc-v">{fmtEur(totalMonthly)}</p>
        </div>
      </div>

      {/* Slider millorat */}
      <div className="pr-slider-panel">
        <div className="pr-slider-top">
          <span className="pr-slider-lbl">Horitzó temporal</span>
          <span className="pr-slider-val">{years}<span>anys</span></span>
        </div>

        {/* Track personalitzat */}
        <div className="pr-slider-track">
          <div className="pr-slider-fill" style={{ width: `${sliderPct}%` }} />
          <div className="pr-slider-thumb" style={{ left: `${sliderPct}%` }} />
          <input type="range" min="1" max="40" step="1" value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="pr-range" />
        </div>

        {/* Botons ràpids */}
        <div className="pr-year-btns" style={{ marginTop: 12 }}>
          {QUICK_YEARS.map(y => (
            <button key={y} className={`pr-year-btn${years === y ? ' on' : ''}`}
              onClick={() => setYears(y)}>
              {y}a
            </button>
          ))}
        </div>
      </div>

      {/* Gràfic evolució */}
      <div className="pr-chart-panel">
        <p className="pr-chart-title">Evolució del portfoli</p>
        <div className="pr-legend">
          <div className="pr-legend-item"><div className="pr-legend-dot" style={{ background: 'rgba(80,210,110,0.75)' }} />Valor projectat</div>
          <div className="pr-legend-item"><div className="pr-legend-dot" style={{ background: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(255,255,255,0.25)' }} />Capital aportat</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="any" tick={{ fontSize: 10, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.24)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.24)' }} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<PrTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="Valor" stroke="rgba(80,210,110,0.75)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Capital" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gràfic de barres — guany per any */}
      <div className="pr-chart-panel">
        <p className="pr-chart-title">Guany net per any</p>
        <ResponsiveContainer width="100%" height={Math.min(years * 18 + 40, 220)}>
          <BarChart data={yearlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={v => `${v}a`} tick={{ fontSize: 10, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.24)' }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(years / 10) - 1)} />
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.24)' }} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<GainTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="yearGain" radius={[2, 2, 0, 0]}>
              {yearlyData.map((entry, i) => (
                <Cell key={i} fill={entry.yearGain >= 0 ? 'rgba(80,210,110,0.55)' : 'rgba(255,90,70,0.55)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Taula anual detallada */}
      <div className="pr-chart-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <p className="pr-chart-title" style={{ padding: '14px 16px 0' }}>Desglossament per any</p>
        <div className="pr-year-table">
          <div className="pr-year-table-hdr">
            <span>Any</span>
            <span>Valor total</span>
            <span>Guany any</span>
            <span>Interès pur</span>
            <span>% any</span>
          </div>
          {yearlyData.map(row => (
            <div key={row.year} className={`pr-year-row${row.year === years ? ' total' : ''}`}>
              <span className="pr-yr-n">{row.year}a</span>
              <span className="pr-yr-v">{fmtEur(row.total)}</span>
              <span className={`pr-yr-v ${row.yearGain >= 0 ? 'g' : ''}`}>
                {row.yearGain >= 0 ? '+' : ''}{fmtEur(row.yearGain)}
              </span>
              <span className="pr-yr-v sm">
                {row.interest >= 0 ? '+' : ''}{fmtEur(Math.round(row.interest))}
              </span>
              <span className={`pr-yr-v ${row.gainPct >= 0 ? 'g' : ''}`}>
                {row.gainPct >= 0 ? '+' : ''}{row.gainPct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Aportació mensual per actiu */}
      <div className="pr-chart-panel">
        <p className="pr-chart-title">Aportació mensual per actiu</p>
        {allAssets.map(asset => (
          <div key={asset.id} className="pr-asset-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="pr-asset-name">{asset.name}</p>
              <p className="pr-asset-meta">{asset.category?.toUpperCase()} · {getRate(asset)}% anual estimat</p>
            </div>
            <input type="number" inputMode="decimal" min="0" step="10"
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