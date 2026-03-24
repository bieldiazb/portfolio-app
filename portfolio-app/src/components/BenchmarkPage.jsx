import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SHARED_STYLES } from './design-tokens'

const BENCHMARKS = [
  { id: 'IWDA.AS', label: 'MSCI World',    color: 'rgba(100,155,255,0.75)' },
  { id: 'GSPC=X', label: 'S&P 500',        color: 'rgba(255,170,70,0.75)'  }, // sense ^ per evitar encoding
  { id: 'VWCE.DE', label: 'FTSE All-World', color: 'rgba(180,130,255,0.65)' },
]

const PERIODS = [
  { id: '3M',  label: '3M',  months: 3,   range: '3mo', interval: '1wk' },
  { id: '1Y',  label: '1A',  months: 12,  range: '1y',  interval: '1mo' },
  { id: '3Y',  label: '3A',  months: 36,  range: '3y',  interval: '1mo' },
  { id: 'ALL', label: 'Tot', months: 999, range: '5y',  interval: '1mo' },
]

// En dev usa el proxy de Vite (/yahoo → query1.finance.yahoo.com)
// En producció usa corsproxy.io
const fetchYahoo = async (ticker, range, interval) => {
  const path = `/v8/finance/chart/${ticker}?range=${range}&interval=${interval}&includePrePost=false`

  // Primer intent: proxy Vite (dev) o ruta relativa (prod amb rewrite)
  const urls = [
    `/yahoo${path}`,
    `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com${path}`)}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue

      // corsproxy retorna JSON directament
      // proxy Vite retorna JSON directament
      const data = await res.json()
      const result = data?.chart?.result?.[0]
      if (!result) continue

      const timestamps = result.timestamp || []
      const closes     = result.indicators?.quote?.[0]?.close || []
      const prices     = timestamps
        .map((t, i) => ({
          date:  new Date(t * 1000).toISOString().split('T')[0],
          price: closes[i],
        }))
        .filter(p => p.price != null)

      if (prices.length > 0) return prices
    } catch {
      // Prova el següent
    }
  }
  return []
}

const bmStyles = `
  .bm-v2 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }
  .bm-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .bm-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
  .bm-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); margin: 0; }
  .bm-period-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; padding: 2px; }
  .bm-ptab { padding: 4px 10px; border-radius: 3px; border: none; background: transparent; font-family: 'Geist Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.28); cursor: pointer; transition: all 100ms; }
  .bm-ptab.on { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.72); }
  .bm-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
  .bm-li { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.38); }
  .bm-li-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .bm-loading { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 48px 0; font-size: 12px; color: rgba(255,255,255,0.28); }
  .bm-spin { width: 14px; height: 14px; border: 1px solid rgba(255,255,255,0.12); border-top-color: rgba(255,255,255,0.55); border-radius: 50%; animation: bmspin .7s linear infinite; flex-shrink: 0; }
  @keyframes bmspin { to { transform: rotate(360deg); } }
  .bm-error { padding: 32px 0; text-align: center; }
  .bm-error-main { font-size: 12px; color: rgba(255,255,255,0.28); }
  .bm-error-sub { font-size: 10px; color: rgba(255,255,255,0.16); margin-top: 4px; }
  .bm-retry { margin-top: 12px; padding: 7px 14px; border: 1px solid rgba(255,255,255,0.10); background: transparent; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; color: rgba(255,255,255,0.42); cursor: pointer; transition: all 100ms; }
  .bm-retry:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.65); }
  .bm-table { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.05); }
  .bm-tr { display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .bm-tr:last-child { border-bottom: none; }
  .bm-tr-name { flex: 1; font-size: 12px; color: rgba(255,255,255,0.52); }
  .bm-tr-bar-wrap { width: 88px; height: 3px; background: rgba(255,255,255,0.06); border-radius: 1.5px; overflow: hidden; margin: 0 12px; flex-shrink: 0; }
  .bm-tr-bar { height: 100%; border-radius: 1.5px; transition: width 600ms; }
  .bm-tr-val { font-family: 'Geist Mono', monospace; font-size: 12px; min-width: 58px; text-align: right; }
  .bm-win  { color: rgba(80,210,110,0.85); }
  .bm-lose { color: rgba(255,90,70,0.80); }
  .bm-neu  { color: rgba(255,255,255,0.42); }
  .bm-summary { margin-top: 12px; padding: 10px 12px; border-radius: 6px; font-size: 11.5px; line-height: 1.6; }
  .bm-summary.out { background: rgba(80,210,110,0.05); border: 1px solid rgba(80,210,110,0.12); color: rgba(255,255,255,0.48); }
  .bm-summary.und { background: rgba(255,90,70,0.04); border: 1px solid rgba(255,90,70,0.10); color: rgba(255,255,255,0.48); }
  .bm-note { margin-top: 10px; padding: 9px 11px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 5px; font-size: 11px; color: rgba(255,255,255,0.26); }
`

const BmTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, padding: '9px 12px', fontFamily: "'Geist', sans-serif", minWidth: 130 }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.34)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: parseFloat(p.value) >= 0 ? 'rgba(80,210,110,0.78)' : 'rgba(255,90,70,0.78)' }}>
            {parseFloat(p.value) >= 0 ? '+' : ''}{parseFloat(p.value).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export default function BenchmarkPage({ snapshots = [] }) {
  const [period, setPeriod]       = useState('1Y')
  const [benchData, setBenchData] = useState({})
  const [loading, setLoading]     = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const p = PERIODS.find(x => x.id === period)
    if (!p) return

    setLoading(true)
    setFetchError(false)

    Promise.all(
      BENCHMARKS.map(async bm => {
        const prices = await fetchYahoo(bm.id, p.range, p.interval)
        return { id: bm.id, prices }
      })
    ).then(results => {
      const map = {}
      results.forEach(r => { map[r.id] = r.prices })
      setBenchData(map)
      setLoading(false)
      if (Object.values(map).every(arr => arr.length === 0)) setFetchError(true)
    })
  }, [period, retryCount])

  const portfolioReturn = useMemo(() => {
    if (snapshots.length < 2) return null
    const months  = PERIODS.find(p => p.id === period)?.months ?? 12
    const cutoff  = new Date(); cutoff.setMonth(cutoff.getMonth() - months)
    const sorted  = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date))
    const inRange = sorted.filter(s => new Date(s.date) >= cutoff)
    if (inRange.length < 2) return null
    const start = inRange[0].total, end = inRange[inRange.length - 1].total
    return start > 0 ? ((end - start) / start) * 100 : null
  }, [snapshots, period])

  const chartData = useMemo(() => {
    const snapSorted = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date))
    const allDates = new Set()
    snapSorted.forEach(s => allDates.add(s.date))
    BENCHMARKS.forEach(bm => (benchData[bm.id] || []).forEach(p => allDates.add(p.date)))
    const sorted = [...allDates].sort()
    if (sorted.length < 2) return []

    const basePortfolio = snapSorted[0]?.total
    const baseBench = {}
    BENCHMARKS.forEach(bm => { baseBench[bm.id] = (benchData[bm.id] || [])[0]?.price })

    return sorted.map(date => {
      const row  = { date: date.slice(5) }
      const snap = [...snapSorted].reverse().find(s => s.date <= date)
      if (snap && basePortfolio)
        row['Cartera'] = +((snap.total / basePortfolio - 1) * 100).toFixed(2)
      BENCHMARKS.forEach(bm => {
        const p = [...(benchData[bm.id] || [])].reverse().find(x => x.date <= date)
        if (p && baseBench[bm.id])
          row[bm.label] = +((p.price / baseBench[bm.id] - 1) * 100).toFixed(2)
      })
      return row
    })
  }, [snapshots, benchData])

  const returns = useMemo(() => {
    const list = []
    if (portfolioReturn !== null)
      list.push({ name: 'La meva cartera', ret: portfolioReturn, color: 'rgba(80,210,110,0.80)', isPortfolio: true })
    BENCHMARKS.forEach(bm => {
      const prices = benchData[bm.id] || []
      if (prices.length < 2) return
      list.push({ name: bm.label, ret: ((prices[prices.length - 1].price - prices[0].price) / prices[0].price) * 100, color: bm.color })
    })
    const months = PERIODS.find(p => p.id === period)?.months ?? 12
    list.push({ name: 'Inflació (IPC)', ret: +(2.9 * months / 12).toFixed(1), color: 'rgba(255,255,255,0.28)' })
    return list.sort((a, b) => b.ret - a.ret)
  }, [portfolioReturn, benchData, period])

  const maxRet      = Math.max(...returns.map(r => Math.abs(r.ret)), 1)
  const pRank       = returns.findIndex(r => r.isPortfolio)
  const outperforms = pRank === 0

  return (
    <div className="bm-v2">
      <style>{`${SHARED_STYLES}${bmStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Benchmark vs mercat</h2>
        <p className="sec-v2-sub">Rendiment del portfoli vs índexs de referència</p>
      </div>

      <div className="bm-panel">
        <div className="bm-top">
          <p className="bm-panel-title">Rendiment normalitzat (base 0%)</p>
          <div className="bm-period-tabs">
            {PERIODS.map(p => (
              <button key={p.id} className={`bm-ptab${period === p.id ? ' on' : ''}`} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bm-legend">
          <div className="bm-li"><div className="bm-li-dot" style={{ background: 'rgba(80,210,110,0.80)' }} />La meva cartera</div>
          {BENCHMARKS.map(bm => (
            <div key={bm.id} className="bm-li">
              <div className="bm-li-dot" style={{ background: bm.color }} />{bm.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="bm-loading"><div className="bm-spin" />Carregant dades de mercat...</div>
        ) : fetchError ? (
          <div className="bm-error">
            <p className="bm-error-main">No s'han pogut carregar les dades</p>
            <p className="bm-error-sub">Yahoo Finance pot estar temporalment no disponible</p>
            <button className="bm-retry" onClick={() => setRetryCount(c => c + 1)}>Tornar a intentar</button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.22)' }} axisLine={false} tickLine={false} interval={Math.floor((chartData.length || 1) / 5)} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.22)' }} axisLine={false} tickLine={false} width={38} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              <Tooltip content={<BmTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="Cartera" stroke="rgba(80,210,110,0.80)" strokeWidth={2} dot={false} connectNulls />
              {BENCHMARKS.map(bm => (
                <Line key={bm.id} type="monotone" dataKey={bm.label} stroke={bm.color} strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {!loading && !fetchError && returns.length > 0 && (
          <div className="bm-table">
            {returns.map((r, i) => (
              <div key={i} className="bm-tr">
                <div className="bm-tr-name" style={r.isPortfolio ? { color: 'rgba(255,255,255,0.72)', fontWeight: 500 } : {}}>
                  {r.name}
                </div>
                <div className="bm-tr-bar-wrap">
                  <div className="bm-tr-bar" style={{ width: `${Math.abs(r.ret) / maxRet * 100}%`, background: r.color }} />
                </div>
                <div className={`bm-tr-val ${r.ret > 2 ? 'bm-win' : r.ret < 0 ? 'bm-lose' : 'bm-neu'}`}>
                  {r.ret >= 0 ? '+' : ''}{r.ret.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !fetchError && portfolioReturn !== null && (
          <div className={`bm-summary ${outperforms ? 'out' : 'und'}`}>
            {outperforms
              ? <><strong style={{ color: 'rgba(80,210,110,0.85)' }}>La cartera supera tots els índexs</strong> en el període.</>
              : <>La cartera queda per sota d'alguns índexs. Revisa la distribució al <strong>Rebalanceig</strong>.</>
            }
          </div>
        )}

        {snapshots.length < 5 && (
          <div className="bm-note">
            El rendiment propi es calcularà quan s'acumulin més dies de dades d'historial.
          </div>
        )}
      </div>
    </div>
  )
}