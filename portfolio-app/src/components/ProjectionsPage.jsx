import { useState, useMemo, useEffect } from 'react'
import { fmtEur, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Fallback per si no es pot obtenir el rendiment històric
const FALLBACK_RETURNS = { etf: 8, stock: 9, robo: 6.5, estalvi: 1.5, efectiu: 1.8, crypto: 15 }
const QUICK_YEARS = [1, 3, 5, 10, 15, 20, 30]

function fv(pv, pmt, r, n) {
  if (r === 0) return pv + pmt * n
  const m = r / 100 / 12
  return pv * Math.pow(1 + m, n) + pmt * (Math.pow(1 + m, n) - 1) / m
}

// Obté el CAGR dels últims 10 anys d'un ticker via Yahoo Finance.
// En local: fetch directe (Vite dev server no té CORS).
// En producció (Netlify): usa la nostra Netlify Function /.netlify/functions/yahoo-proxy.
async function fetchHistoricalCAGR(ticker) {
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    let data = null

    if (isLocal) {
      try {
        const now  = Math.floor(Date.now() / 1000)
        const from = now - 10 * 365 * 24 * 3600
        const url  = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${from}&period2=${now}&interval=1mo&events=history`
        const res  = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (res.ok) data = await res.json()
      } catch { /* fallback al proxy */ }
    }

    // Producció (Netlify) o local sense dades → proxy propi
    if (!data?.chart?.result?.[0]) {
      const res = await fetch(`/.netlify/functions/yahoo-proxy?ticker=${encodeURIComponent(ticker)}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) data = await res.json()
    }

    const result = data?.chart?.result?.[0]
    if (!result) return null

    // Alguns ETFs (renda fixa) no tenen adjclose — usem close com a fallback
    const closes =
      result?.indicators?.adjclose?.[0]?.adjclose ||
      result?.indicators?.quote?.[0]?.close

    if (!closes || closes.length < 2) return null
    const valid = closes.filter(v => v != null && v > 0)
    if (valid.length < 2) return null
    const first = valid[0]
    const last  = valid.at(-1)
    if (!first || !last || first <= 0) return null
    const actualYears = valid.length / 12
    const cagr = (Math.pow(last / first, 1 / actualYears) - 1) * 100
    return Math.round(cagr * 10) / 10
  } catch {
    return null
  }
}

const styles = `
  .pr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .pr-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .pr-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(123,97,255,0.07) 0%,transparent 70%); pointer-events:none; }
  .pr-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .pr-hero-total {
    font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; line-height:1;
    font-family:${FONTS.num}; font-variant-numeric:tabular-nums; margin-bottom:4px;
  }
  .pr-hero-total span { font-size:30px; opacity:0.7; }
  .pr-hero-sub { font-size:12px; color:rgba(255,255,255,0.30); margin-bottom:14px; }
  .pr-hero-sub strong { color:${COLORS.neonGreen}; font-weight:600; }
  .pr-hero-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.06); }
  .pr-hero-m-label { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:3px; }
  .pr-hero-m-val {
    font-size:20px; font-weight:400; color:#fff; letter-spacing:0px; font-variant-numeric:tabular-nums;
    font-family:${FONTS.num};
  }
  .pr-hero-m-val.g { color:${COLORS.neonGreen}; }
  .pr-hero-m-val.p { color:${COLORS.neonPurple}; }
  .pr-hero-m-sub { font-size:10px; color:rgba(255,255,255,0.25); margin-top:1px; }

  /* ── Slider ── */
  .pr-slider { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:18px 16px; }
  .pr-slider-top { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:16px; }
  .pr-slider-lbl { font-size:10px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; }
  .pr-slider-val {
    font-size:36px; font-weight:600; letter-spacing:0.5px; color:#fff; font-variant-numeric:tabular-nums;
    font-family:${FONTS.num};
  }
  .pr-slider-val span { font-size:16px; color:rgba(255,255,255,0.30); font-weight:300; margin-left:4px; }
  .pr-track { position:relative; height:2px; background:rgba(255,255,255,0.06); border-radius:2px; margin-bottom:16px; }
  .pr-fill  { position:absolute; left:0; top:0; height:100%; background:${COLORS.neonPurple}; border-radius:2px; pointer-events:none; }
  .pr-thumb { position:absolute; width:12px; height:12px; border-radius:50%; background:${COLORS.neonPurple}; top:-5px; transform:translateX(-50%); pointer-events:none; }
  .pr-range { position:absolute; inset:0; width:100%; opacity:0; cursor:pointer; height:18px; top:-7px; -webkit-appearance:none; appearance:none; margin:0; }
  .pr-quick { display:flex; gap:4px; flex-wrap:wrap; }
  .pr-qbtn { padding:5px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.07); background:transparent; font-family:${FONTS.num}; font-size:12px; font-weight:500; color:rgba(255,255,255,0.35); cursor:pointer; transition:all 100ms; }
  .pr-qbtn:hover { color:rgba(255,255,255,0.70); border-color:rgba(255,255,255,0.15); }
  .pr-qbtn.on { background:rgba(123,97,255,0.12); border-color:rgba(123,97,255,0.30); color:${COLORS.neonPurple}; }

  /* ── Panel genèric ── */
  .pr-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .pr-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:14px; }

  /* ── Llegenda gràfic ── */
  .pr-legend { display:flex; gap:12px; }
  .pr-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:rgba(255,255,255,0.30); }
  .pr-legend-dot { width:7px; height:2px; border-radius:1px; flex-shrink:0; }

  /* ── Taula anual ── */
  .pr-col-hdr { display:grid; grid-template-columns:36px 1fr 1fr 1fr; padding:7px 14px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .pr-col-hdr span { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.10em; }
  .pr-col-hdr span:not(:first-child) { text-align:right; }
  .pr-yr-row { display:grid; grid-template-columns:36px 1fr 1fr 1fr; padding:9px 14px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 80ms; }
  .pr-yr-row:last-child { border-bottom:none; }
  .pr-yr-row:hover { background:rgba(255,255,255,0.02); }
  .pr-yr-row.last { background:rgba(123,97,255,0.07); border-top:1px solid rgba(123,97,255,0.15); }
  .pr-yr-n { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); font-family:${FONTS.num}; }
  .pr-yr-v { font-size:12px; font-family:${FONTS.num}; color:rgba(255,255,255,0.55); text-align:right; font-variant-numeric:tabular-nums; font-weight:400; }
  .pr-yr-v.g { color:${COLORS.neonGreen}; }
  .pr-yr-row.last .pr-yr-n { color:${COLORS.neonPurple}; font-weight:600; }
  .pr-yr-row.last .pr-yr-v { color:#fff; font-weight:500; }
  .pr-yr-row.last .pr-yr-v.g { color:${COLORS.neonGreen}; }

  /* ── Aportació per actiu ── */
  .pr-asset-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .pr-asset-row:last-of-type { border-bottom:none; }
  .pr-asset-av { width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); flex-shrink:0; font-family:${FONTS.mono}; }
  .pr-asset-name { font-size:12px; font-weight:500; color:rgba(255,255,255,0.60); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .pr-asset-meta { font-size:10px; color:rgba(255,255,255,0.25); }
  .pr-asset-meta .historical { color:${COLORS.neonGreen}; opacity:0.7; }
  .pr-asset-meta .fallback { color:${COLORS.neonAmber}; opacity:0.7; }
  .pr-inp { width:68px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:7px 9px; font-family:${FONTS.num}; font-size:14px; font-weight:400; color:#fff; outline:none; text-align:right; transition:border-color 120ms; -webkit-appearance:none; }
  .pr-inp:focus { border-color:${COLORS.neonPurple}; }
  .pr-unit { font-size:10px; color:rgba(255,255,255,0.25); white-space:nowrap; flex-shrink:0; }
  .pr-total-row { display:flex; justify-content:space-between; align-items:center; padding-top:12px; margin-top:2px; border-top:1px solid rgba(255,255,255,0.06); }
  .pr-total-l { font-size:11px; color:rgba(255,255,255,0.40); font-weight:500; }
  .pr-total-v { font-size:18px; font-weight:300; color:#fff; font-family:${FONTS.num}; letter-spacing:-0.5px; font-variant-numeric:tabular-nums; }

  /* ── Rate override input ── */
  .pr-rate-row { display:flex; align-items:center; gap:6px; margin-top:4px; }
  .pr-rate-inp { width:52px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:5px; padding:4px 7px; font-family:${FONTS.num}; font-size:12px; color:#fff; outline:none; text-align:right; transition:border-color 120ms; -webkit-appearance:none; }
  .pr-rate-inp:focus { border-color:${COLORS.neonPurple}; }
  .pr-rate-unit { font-size:10px; color:rgba(255,255,255,0.25); }
`

const PrTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a1a', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 6, padding: '9px 12px', fontFamily: FONTS.sans }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 7 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 12, color: '#fff', fontFamily: FONTS.num, fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const GainTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value || 0
  return (
    <div style={{ background: '#1a1a1a', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 6, padding: '7px 10px' }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Any {label}</p>
      <p style={{ fontSize: 14, color: val >= 0 ? COLORS.neonGreen : COLORS.neonRed, fontFamily: FONTS.num, fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>{val >= 0 ? '+' : ''}{fmtEur(val)}</p>
    </div>
  )
}

export default function ProjectionsPage({ investments, savings, cryptos = [] }) {
  const [years, setYears]             = useState(10)
  const [contributions, setContrib]   = useState({})
  // historicalRates: { [id]: number | null }  — null = carregant, number = CAGR, undefined = no s'ha intentat
  const [historicalRates, setHistRates] = useState({})
  // rateOverrides: taxes manuals per actiu (l'usuari pot sobreescriure)
  const [rateOverrides, setRateOver]  = useState({})

  const allAssets = useMemo(() => [
    ...investments.map(i  => ({ ...i, category: i.type })),
    ...savings.map(s      => ({ ...s, category: 'estalvi', currentPrice: null })),
    ...cryptos.map(c      => ({ ...c, category: 'crypto', initialValue: c.initialValue || 0 })),
  ], [investments, savings, cryptos])

  // Clau estable per detectar canvis de tickers (no només longitud)
  const tickerKey = allAssets
    .filter(a => a.category === 'etf' || a.category === 'stock')
    .map(a => `${a.id}:${a.ticker}`)
    .join(',')

  // Carrega el CAGR històric per a cada ETF/acció
  useEffect(() => {
    const investmentAssets = allAssets.filter(a => a.category === 'etf' || a.category === 'stock')
    investmentAssets.forEach(a => {
      if (!a.ticker) return
      const key = a.id
      if (historicalRates[key] !== undefined) return // ja s'ha carregat o s'està carregant
      setHistRates(prev => ({ ...prev, [key]: null })) // null = carregant
      fetchHistoricalCAGR(a.ticker).then(cagr => {
        setHistRates(prev => ({ ...prev, [key]: cagr ?? 'error' }))
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey])

  const getContrib = id => parseFloat(contributions[id] || 0)

  // Taxa efectiva per a cada actiu:
  // - estalvi: usa acc.rate (el que l'usuari ha configurat)
  // - etf/stock: usa CAGR històric si disponible, sinó fallback
  // - override manual sempre té prioritat
  const getRate = a => {
    if (rateOverrides[a.id] !== undefined && rateOverrides[a.id] !== '') {
      return parseFloat(rateOverrides[a.id]) || 0
    }
    if (a.category === 'estalvi') {
      return typeof a.rate === 'number' ? a.rate : (parseFloat(a.rate) || FALLBACK_RETURNS.estalvi)
    }
    if (a.category === 'etf' || a.category === 'stock') {
      const hist = historicalRates[a.id]
      if (typeof hist === 'number') return hist
    }
    return FALLBACK_RETURNS[a.category] ?? 8
  }

  const getRateStatus = a => {
    if (a.category === 'estalvi') return { label: `${getRate(a)}% TAE configurat`, type: 'configured' }
    if (a.category === 'etf' || a.category === 'stock') {
      const hist = historicalRates[a.id]
      if (hist === undefined) return { label: `${FALLBACK_RETURNS[a.category]}% est. (per defecte)`, type: 'fallback' }
      if (hist === null)      return { label: 'carregant historial...', type: 'loading' }
      if (hist === 'error')   return { label: `${FALLBACK_RETURNS[a.category]}% est. (sense dades)`, type: 'fallback' }
      return { label: `${hist}% CAGR 10a (Yahoo Finance)`, type: 'historical' }
    }
    return { label: `${getRate(a)}% anual estimat`, type: 'fallback' }
  }

  const calcTotal = (months) => {
    let total = 0, cost = 0
    allAssets.forEach(a => {
      // estalvi → saldo actual | inversions → valor de mercat actual (getEffectiveValue) | crypto → valor inicial
      const pv  = a.category === 'estalvi'
        ? (a.balance || 0)
        : a.category === 'crypto'
          ? (a.initialValue || 0)
          : (getEffectiveValue?.(a) || a.totalCostEur || 0)
      const pmt = getContrib(a.id)
      total += fv(pv, pmt, getRate(a), months)
      cost  += pv + pmt * months
    })
    return { total: Math.round(total), cost: Math.round(cost) }
  }

  const chartData = useMemo(() => {
    const pts = [], step = Math.max(1, Math.floor(years / 24))
    for (let y = 0; y <= years; y += step) {
      const { total, cost } = calcTotal(y * 12)
      pts.push({ any: y === 0 ? 'Avui' : `${y}a`, Valor: total, Capital: cost })
    }
    return pts
  }, [years, contributions, historicalRates, rateOverrides, allAssets.length])

  const yearlyData = useMemo(() => {
    const rows = []; let prev = calcTotal(0).total
    for (let y = 1; y <= years; y++) {
      const { total, cost } = calcTotal(y * 12)
      const yearGain = total - prev
      rows.push({ year: y, total, cost, yearGain, gainPct: prev > 0 ? ((total - prev) / prev) * 100 : 0 })
      prev = total
    }
    return rows
  }, [years, contributions, historicalRates, rateOverrides, allAssets.length])

  const last         = calcTotal(years * 12)
  const today        = calcTotal(0)
  const totalGain    = last.total - last.cost
  const totalMonthly = allAssets.reduce((s, a) => s + getContrib(a.id), 0)
  const pct          = today.total > 0 ? ((last.total - today.total) / today.total) * 100 : 0
  const sliderPct    = ((years - 1) / 39) * 100

  return (
    <div className="pr">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="pr-hero">
        <p className="pr-hero-label">Projeccions · {years} anys</p>
        <p className="pr-hero-total">
          {fmtEur(last.total).replace('€', '')}<span>€</span>
        </p>
        <p className="pr-hero-sub">
          <strong>+{pct.toFixed(1)}%</strong> vs avui · simulació basada en rendiments estimats
        </p>
        <div className="pr-hero-metrics">
          <div>
            <p className="pr-hero-m-label">Guany interès</p>
            <p className="pr-hero-m-val g">{fmtEur(totalGain)}</p>
            <p className="pr-hero-m-sub">sobre {fmtEur(last.cost)} inv.</p>
          </div>
          <div>
            <p className="pr-hero-m-label">Capital aportat</p>
            <p className="pr-hero-m-val">{fmtEur(last.cost)}</p>
            <p className="pr-hero-m-sub">inclou aportacions</p>
          </div>
          <div>
            <p className="pr-hero-m-label">Aportació/mes</p>
            <p className="pr-hero-m-val p">{fmtEur(totalMonthly)}</p>
            <p className="pr-hero-m-sub">configurables</p>
          </div>
        </div>
      </div>

      {/* Slider horitzó temporal */}
      <div className="pr-slider">
        <div className="pr-slider-top">
          <span className="pr-slider-lbl">Horitzó temporal</span>
          <span className="pr-slider-val">{years}<span>anys</span></span>
        </div>
        <div className="pr-track">
          <div className="pr-fill" style={{ width: `${sliderPct}%` }} />
          <div className="pr-thumb" style={{ left: `${sliderPct}%` }} />
          <input type="range" min="1" max="40" step="1" value={years} onChange={e => setYears(Number(e.target.value))} className="pr-range" />
        </div>
        <div className="pr-quick">
          {QUICK_YEARS.map(y => (
            <button key={y} className={`pr-qbtn${years === y ? ' on' : ''}`} onClick={() => setYears(y)}>{y}a</button>
          ))}
        </div>
      </div>

      {/* Evolució */}
      <div className="pr-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="pr-panel-title" style={{ margin: 0 }}>Evolució del portfoli</p>
          <div className="pr-legend">
            <div className="pr-legend-item"><div className="pr-legend-dot" style={{ background: COLORS.neonGreen }} />Valor</div>
            <div className="pr-legend-item"><div className="pr-legend-dot" style={{ background: 'rgba(255,255,255,0.25)' }} />Capital</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="any" tick={{ fontSize: 10, fontFamily: FONTS.num, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: FONTS.num, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<PrTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="Valor" stroke={COLORS.neonGreen} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Capital" stroke="rgba(255,255,255,0.20)" strokeWidth={1} dot={false} strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Guany per any */}
      <div className="pr-panel">
        <p className="pr-panel-title">Guany net per any</p>
        <ResponsiveContainer width="100%" height={Math.min(years * 16 + 40, 180)}>
          <BarChart data={yearlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tickFormatter={v => `${v}a`} tick={{ fontSize: 10, fontFamily: FONTS.num, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(years / 10) - 1)} />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: FONTS.num, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} width={32} />
            <Tooltip content={<GainTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="yearGain" radius={[2, 2, 0, 0]}>
              {yearlyData.map((e, i) => <Cell key={i} fill={e.yearGain >= 0 ? COLORS.neonGreen : COLORS.neonRed} fillOpacity={0.55} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Taula anual */}
      <div className="pr-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <p className="pr-panel-title" style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: 0 }}>Desglossament per any</p>
        <div className="pr-col-hdr">
          <span>Any</span><span>Valor total</span><span>Guany any</span><span>% any</span>
        </div>
        {yearlyData.map(row => (
          <div key={row.year} className={`pr-yr-row${row.year === years ? ' last' : ''}`}>
            <span className="pr-yr-n">{row.year}a</span>
            <span className="pr-yr-v">{fmtEur(row.total)}</span>
            <span className={`pr-yr-v${row.yearGain >= 0 ? ' g' : ''}`}>{row.yearGain >= 0 ? '+' : ''}{fmtEur(row.yearGain)}</span>
            <span className={`pr-yr-v${row.gainPct >= 0 ? ' g' : ''}`}>{row.gainPct >= 0 ? '+' : ''}{row.gainPct.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* Aportació per actiu */}
      <div className="pr-panel">
        <p className="pr-panel-title">Aportació mensual per actiu</p>
        {allAssets.map(a => {
          const status = getRateStatus(a)
          const isLoading = status.type === 'loading'
          return (
            <div key={a.id} className="pr-asset-row">
              <div className="pr-asset-av">{a.name?.slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="pr-asset-name">{a.name}</p>
                <p className="pr-asset-meta">
                  {a.category?.toUpperCase()} ·{' '}
                  <span className={status.type === 'historical' ? 'historical' : status.type === 'fallback' ? 'fallback' : ''}>
                    {isLoading ? '⟳ carregant...' : status.label}
                  </span>
                </p>
                {/* Override manual de taxa — disponible per a ETFs i accions */}
                {(a.category === 'etf' || a.category === 'stock') && (
                  <div className="pr-rate-row">
                    <input
                      type="number" inputMode="decimal" step="0.1" min="0" max="100"
                      className="pr-rate-inp"
                      placeholder={String(getRate(a))}
                      value={rateOverrides[a.id] ?? ''}
                      onChange={e => setRateOver(r => ({ ...r, [a.id]: e.target.value }))}
                    />
                    <span className="pr-rate-unit">% manual</span>
                  </div>
                )}
              </div>
              <input type="number" inputMode="decimal" min="0" step="10"
                value={contributions[a.id] || ''}
                onChange={e => setContrib(c => ({ ...c, [a.id]: e.target.value }))}
                placeholder="0" className="pr-inp" />
              <span className="pr-unit">€/mes</span>
            </div>
          )
        })}
        {totalMonthly > 0 && (
          <div className="pr-total-row">
            <span className="pr-total-l">Total mensual</span>
            <span className="pr-total-v">{fmtEur(totalMonthly)}</span>
          </div>
        )}
      </div>

      <div style={{ height: 16 }} />
    </div>
  )
}