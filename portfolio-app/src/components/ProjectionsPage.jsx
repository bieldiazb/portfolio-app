import { useState, useMemo } from 'react'
import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const DEFAULT_RETURNS = { etf: 8, stock: 9, robo: 6.5, estalvi: 1.5, efectiu: 1.8, crypto: 15 }
const QUICK_YEARS    = [1, 3, 5, 10, 15, 20, 30]

function fv(pv, pmt, r, n) {
  if (r === 0) return pv + pmt * n
  const m = r / 100 / 12
  return pv * Math.pow(1 + m, n) + pmt * (Math.pow(1 + m, n) - 1) / m
}

const prStyles = `
  .pr { font-family:'Geist',sans-serif; display:flex; flex-direction:column; gap:16px; }

  .pr-title { font-size:18px; font-weight:600; color:rgba(255,255,255,0.90); letter-spacing:-0.3px; margin-bottom:4px; }
  .pr-sub { font-size:13px; color:rgba(255,255,255,0.35); }

  /* KPI grid */
  .pr-kpi-grid {
    display:grid; grid-template-columns:1fr 1fr;
    gap:1px; background:rgba(255,255,255,0.05);
    border-radius:16px; overflow:hidden;
  }
  .pr-kpi { background:#0d1117; padding:18px 16px; }
  .pr-kpi.dim { background:rgba(255,255,255,0.012); }
  .pr-kpi-l { font-size:11px; font-weight:500; color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px; }
  .pr-kpi-v { font-size:22px; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:-0.8px; font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .pr-kpi-v.g { color:rgba(80,210,110,0.90); }
  .pr-kpi-sub { font-size:11px; color:rgba(255,255,255,0.25); }
  .pr-kpi-sub.g { color:rgba(80,210,110,0.55); font-weight:600; }

  /* Slider panel */
  .pr-slider-panel {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px; padding:20px 18px;
  }
  .pr-slider-top { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:16px; }
  .pr-slider-lbl { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.06em; }
  .pr-slider-val { font-size:32px; font-weight:700; color:#fff; letter-spacing:-1.5px; font-variant-numeric:tabular-nums; }
  .pr-slider-val span { font-size:16px; font-weight:400; color:rgba(255,255,255,0.35); margin-left:4px; }

  .pr-track { position:relative; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; margin-bottom:18px; }
  .pr-fill { position:absolute; left:0; top:0; height:100%; background:rgba(80,210,110,0.70); border-radius:2px; pointer-events:none; }
  .pr-thumb { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; border:2.5px solid rgba(80,210,110,0.85); top:-6px; transform:translateX(-50%); pointer-events:none; }
  .pr-range { position:absolute; inset:0; width:100%; opacity:0; cursor:pointer; height:20px; top:-8px; -webkit-appearance:none; appearance:none; margin:0; }

  .pr-quick-btns { display:flex; gap:6px; flex-wrap:wrap; }
  .pr-qbtn { padding:6px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); font-size:12px; font-weight:600; color:rgba(255,255,255,0.32); cursor:pointer; transition:all 100ms; font-family:'Geist',sans-serif; }
  .pr-qbtn:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.55); }
  .pr-qbtn.on { border-color:rgba(80,210,110,0.40); background:rgba(80,210,110,0.09); color:rgba(80,210,110,0.88); }

  /* Chart panel */
  .pr-chart-panel {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px; padding:18px;
  }
  .pr-chart-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .pr-chart-title { font-size:13px; font-weight:600; color:rgba(255,255,255,0.70); }
  .pr-legend { display:flex; gap:14px; }
  .pr-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,0.32); }
  .pr-legend-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }

  /* Taula anual */
  .pr-table-panel {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px; overflow:hidden;
  }
  .pr-table-hdr-row { padding:14px 18px 10px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .pr-table-title { font-size:13px; font-weight:600; color:rgba(255,255,255,0.70); }
  .pr-col-hdr { display:grid; grid-template-columns:36px 1fr 1fr 1fr; padding:8px 18px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .pr-col-hdr span { font-size:10px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.06em; }
  .pr-col-hdr span:not(:first-child) { text-align:right; }
  .pr-yr-row { display:grid; grid-template-columns:36px 1fr 1fr 1fr; padding:10px 18px; border-bottom:1px solid rgba(255,255,255,0.03); transition:background 80ms; }
  .pr-yr-row:last-child { border-bottom:none; }
  .pr-yr-row:hover { background:rgba(255,255,255,0.025); }
  .pr-yr-row.last { background:rgba(80,210,110,0.04); border-top:1px solid rgba(80,210,110,0.10); }
  .pr-yr-n { font-size:12px; font-weight:500; color:rgba(255,255,255,0.35); font-family:'Geist Mono',monospace; }
  .pr-yr-v { font-size:12px; font-family:'Geist Mono',monospace; color:rgba(255,255,255,0.65); text-align:right; }
  .pr-yr-v.g { color:rgba(80,210,110,0.82); }
  .pr-yr-row.last .pr-yr-n { font-weight:700; color:rgba(80,210,110,0.82); font-size:13px; }
  .pr-yr-row.last .pr-yr-v { font-size:13px; font-weight:700; color:rgba(255,255,255,0.90); }
  .pr-yr-row.last .pr-yr-v.g { color:rgba(80,210,110,0.88); }

  /* Aportació per actiu */
  .pr-contrib-panel {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:16px; padding:18px;
  }
  .pr-asset-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .pr-asset-row:last-of-type { border-bottom:none; }
  .pr-asset-av { width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:rgba(255,255,255,0.45); flex-shrink:0; }
  .pr-asset-info { flex:1; min-width:0; }
  .pr-asset-name { font-size:13px; font-weight:500; color:rgba(255,255,255,0.75); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .pr-asset-meta { font-size:10px; color:rgba(255,255,255,0.25); }
  .pr-inp { width:72px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:8px 10px; font-family:'Geist Mono',monospace; font-size:14px; font-weight:500; color:rgba(255,255,255,0.80); outline:none; text-align:right; transition:border-color 100ms; touch-action:manipulation; }
  .pr-inp:focus { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.07); }
  .pr-unit { font-size:11px; color:rgba(255,255,255,0.25); white-space:nowrap; flex-shrink:0; }
  .pr-total-row { display:flex; justify-content:space-between; align-items:center; padding-top:14px; margin-top:2px; border-top:1px solid rgba(255,255,255,0.06); }
  .pr-total-l { font-size:12px; color:rgba(255,255,255,0.40); font-weight:500; }
  .pr-total-v { font-size:18px; font-weight:700; color:rgba(255,255,255,0.82); font-family:'Geist Mono',monospace; letter-spacing:-0.5px; }
`

const PrTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'10px 13px', fontFamily:"'Geist',sans-serif" }}>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:8 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:14, marginBottom:3 }}>
          <span style={{ fontSize:11, color:p.color }}>{p.name}</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontFamily:"'Geist Mono',monospace" }}>{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const GainTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value || 0
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'8px 12px', fontFamily:"'Geist Mono',monospace" }}>
      <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:4 }}>Any {label}</p>
      <p style={{ fontSize:13, color:val>=0?'rgba(80,210,110,0.85)':'rgba(255,90,70,0.80)' }}>{val>=0?'+':''}{fmtEur(val)}</p>
    </div>
  )
}

export default function ProjectionsPage({ investments, savings, cryptos = [] }) {
  const [years, setYears]             = useState(10)
  const [contributions, setContributions] = useState({})

  const allAssets = [
    ...investments.map(i => ({ ...i, category: i.type })),
    ...savings.map(s  => ({ ...s, category: 'estalvi', currentPrice: null })),
    ...cryptos.map(c  => ({ ...c, category: 'crypto', initialValue: c.initialValue || 0 })),
  ]

  const getContrib = id  => parseFloat(contributions[id] || 0)
  const getRate    = a   => DEFAULT_RETURNS[a.category] || 8

  const calcTotal = (months) => {
    let total = 0, cost = 0
    allAssets.forEach(a => {
      const pv  = a.category === 'estalvi' ? (a.amount || 0) : (getEffectiveValue?.(a) || a.initialValue || 0)
      const pmt = getContrib(a.id)
      total += fv(pv, pmt, getRate(a), months)
      cost  += pv + pmt * months
    })
    return { total: Math.round(total), cost: Math.round(cost) }
  }

  const chartData = useMemo(() => {
    const pts = []
    const step = Math.max(1, Math.floor(years / 24))
    for (let y = 0; y <= years; y += step) {
      const { total, cost } = calcTotal(y * 12)
      pts.push({ any: y === 0 ? 'Avui' : `${y}a`, 'Valor': total, 'Capital': cost })
    }
    return pts
  }, [years, contributions, allAssets.length])

  const yearlyData = useMemo(() => {
    const rows = []
    let prevTotal = calcTotal(0).total
    const totalMonthly = allAssets.reduce((s, a) => s + getContrib(a.id), 0)
    for (let y = 1; y <= years; y++) {
      const { total, cost } = calcTotal(y * 12)
      const yearGain = total - prevTotal
      rows.push({
        year: y, total, cost, yearGain,
        interest: yearGain - totalMonthly * 12,
        gainPct: prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0,
      })
      prevTotal = total
    }
    return rows
  }, [years, contributions, allAssets.length])

  const last          = calcTotal(years * 12)
  const today         = calcTotal(0)
  const totalGain     = last.total - last.cost
  const totalMonthly  = allAssets.reduce((s, a) => s + getContrib(a.id), 0)
  const pct           = today.total > 0 ? ((last.total - today.total) / today.total) * 100 : 0
  const sliderPct     = ((years - 1) / 39) * 100

  return (
    <div className="pr">
      <style>{`${SHARED_STYLES}${prStyles}`}</style>

      <div>
        <h2 className="pr-title">Projeccions</h2>
        <p className="pr-sub">Simulació basada en rendiments estimats per categoria</p>
      </div>

      {/* KPIs */}
      <div className="pr-kpi-grid">
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
      <div className="pr-slider-panel">
        <div className="pr-slider-top">
          <span className="pr-slider-lbl">Horitzó temporal</span>
          <span className="pr-slider-val">{years}<span>anys</span></span>
        </div>
        <div className="pr-track">
          <div className="pr-fill" style={{ width:`${sliderPct}%` }} />
          <div className="pr-thumb" style={{ left:`${sliderPct}%` }} />
          <input type="range" min="1" max="40" step="1" value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="pr-range" />
        </div>
        <div className="pr-quick-btns">
          {QUICK_YEARS.map(y => (
            <button key={y} className={`pr-qbtn${years===y?' on':''}`} onClick={() => setYears(y)}>{y}a</button>
          ))}
        </div>
      </div>

      {/* Gràfic evolució */}
      <div className="pr-chart-panel">
        <div className="pr-chart-hdr">
          <p className="pr-chart-title">Evolució del portfoli</p>
          <div className="pr-legend">
            <div className="pr-legend-item"><div className="pr-legend-dot" style={{background:'rgba(80,210,110,0.75)'}}/>Valor</div>
            <div className="pr-legend-item"><div className="pr-legend-dot" style={{background:'rgba(255,255,255,0.22)',border:'1px dashed rgba(255,255,255,0.25)'}}/>Capital</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="any" tick={{fontSize:10,fontFamily:'Geist',fill:'rgba(255,255,255,0.24)'}} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{fontSize:10,fontFamily:'Geist',fill:'rgba(255,255,255,0.24)'}} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<PrTooltip />} cursor={{stroke:'rgba(255,255,255,0.08)',strokeWidth:1}} />
            <Line type="monotone" dataKey="Valor" stroke="rgba(80,210,110,0.75)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Capital" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gràfic barres */}
      <div className="pr-chart-panel">
        <p className="pr-chart-title" style={{marginBottom:14}}>Guany net per any</p>
        <ResponsiveContainer width="100%" height={Math.min(years*18+40,220)}>
          <BarChart data={yearlyData} margin={{top:4,right:4,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={v=>`${v}a`} tick={{fontSize:10,fontFamily:'Geist',fill:'rgba(255,255,255,0.24)'}} axisLine={false} tickLine={false} interval={Math.max(0,Math.floor(years/10)-1)} />
            <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{fontSize:10,fontFamily:'Geist',fill:'rgba(255,255,255,0.24)'}} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<GainTooltip />} cursor={{fill:'rgba(255,255,255,0.03)'}} />
            <Bar dataKey="yearGain" radius={[3,3,0,0]}>
              {yearlyData.map((e,i) => (
                <Cell key={i} fill={e.yearGain>=0?'rgba(80,210,110,0.55)':'rgba(255,90,70,0.55)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Taula anual */}
      <div className="pr-table-panel">
        <div className="pr-table-hdr-row">
          <p className="pr-table-title">Desglossament per any</p>
        </div>
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
      <div className="pr-contrib-panel">
        <p className="pr-chart-title" style={{marginBottom:14}}>Aportació mensual per actiu</p>
        {allAssets.map(a => (
          <div key={a.id} className="pr-asset-row">
            <div className="pr-asset-av">{a.name?.slice(0,2).toUpperCase()}</div>
            <div className="pr-asset-info">
              <p className="pr-asset-name">{a.name}</p>
              <p className="pr-asset-meta">{a.category?.toUpperCase()} · {getRate(a)}% anual estimat</p>
            </div>
            <input type="number" inputMode="decimal" min="0" step="10"
              value={contributions[a.id] || ''}
              onChange={e => setContributions(c => ({ ...c, [a.id]: e.target.value }))}
              placeholder="0" className="pr-inp" />
            <span className="pr-unit">€/mes</span>
          </div>
        ))}
        {totalMonthly > 0 && (
          <div className="pr-total-row">
            <span className="pr-total-l">Total mensual</span>
            <span className="pr-total-v">{fmtEur(totalMonthly)}</span>
          </div>
        )}
      </div>
    </div>
  )
}