import { useState, useMemo, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { fetchNextDividend } from '../hooks/useDividends'

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const DivTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'7px 11px', fontFamily:FONTS.sans }}>
      <p style={{ fontSize:10, color:COLORS.textMuted, marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:500, fontFamily:FONTS.mono, color:COLORS.neonGreen }}>{fmtEur(payload[0]?.value)}</p>
    </div>
  )
}

const styles = `
  .dv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  .dv-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .dv-sub   { font-size:12px; color:${COLORS.textMuted}; }

  /* KPIs */
  .dv-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; }
  .dv-kpi  { background:${COLORS.surface}; padding:14px 14px; }
  .dv-kpi-l { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; }
  .dv-kpi-v { font-size:18px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.5px; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .dv-kpi-v.g { color:${COLORS.neonGreen}; }
  .dv-kpi-sub { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }

  /* Panel */
  .dv-panel { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:16px; }
  .dv-panel-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:14px; }

  /* Calendari / upcoming */
  .dv-cal-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid ${COLORS.border}; }
  .dv-cal-row:last-child { border-bottom:none; }
  .dv-cal-date { width:44px; height:44px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
  .dv-cal-day { font-size:16px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; line-height:1; }
  .dv-cal-mon { font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.06em; margin-top:2px; }
  .dv-cal-info { flex:1; min-width:0; }
  .dv-cal-name { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dv-cal-meta { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .dv-cal-amount { font-size:13px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; flex-shrink:0; }
  .dv-yield-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:2px 6px; border-radius:2px; background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; flex-shrink:0; }

  /* Historial */
  .dv-tx { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .dv-tx:last-child { border-bottom:none; }
  .dv-tx-dot { width:6px; height:6px; border-radius:50%; background:${COLORS.neonGreen}; flex-shrink:0; margin-right:10px; }
  .dv-tx-info { flex:1; min-width:0; }
  .dv-tx-name { font-size:12px; font-weight:500; color:${COLORS.textSecondary}; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dv-tx-date { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .dv-tx-amount { font-size:13px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; flex-shrink:0; margin-left:10px; font-variant-numeric:tabular-nums; }
  .dv-tx-per { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; text-align:right; margin-top:2px; }
  .dv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:${COLORS.textMuted}; margin-left:6px; flex-shrink:0; transition:all 80ms; }
  .dv-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* Yield table */
  .dv-yield-row { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .dv-yield-row:last-child { border-bottom:none; }
  .dv-yield-name { flex:1; font-size:12px; font-weight:500; color:${COLORS.textSecondary}; }
  .dv-yield-bar-wrap { width:80px; height:2px; background:${COLORS.border}; border-radius:1px; overflow:hidden; margin:0 12px; flex-shrink:0; }
  .dv-yield-bar { height:100%; background:${COLORS.neonGreen}; border-radius:1px; }
  .dv-yield-val { font-size:12px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; min-width:52px; text-align:right; }

  .dv-empty { padding:40px 0; text-align:center; }
  .dv-empty-main { font-size:13px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .dv-empty-sub  { font-size:11px; color:${COLORS.textMuted}; opacity:0.5; }

  /* Header buttons */
  .dv-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:0; gap:12px; }
  .dv-btn-add { display:flex; align-items:center; gap:5px; padding:6px 12px; background:${COLORS.neonPurple}; color:#fff; border:none; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:opacity 100ms; white-space:nowrap; flex-shrink:0; }
  .dv-btn-add:hover { opacity:0.85; }

  /* Modal */
  .dv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
  .dv-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px; width:100%; max-width:400px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90vh; overflow-y:auto; }
  .dv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .dv-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .dv-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .dv-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .dv-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; }
  .dv-inp:focus { border-color:${COLORS.neonPurple}; }
  .dv-inp::placeholder { color:${COLORS.textMuted}; }
  .dv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .dv-sel { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; cursor:pointer; }
  .dv-sel option { background:${COLORS.surface}; }
  .dv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .dv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .dv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .dv-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .dv-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .dv-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; background:${COLORS.neonGreen}; color:#000; cursor:pointer; transition:opacity 100ms; }
  .dv-btn-ok:hover { opacity:0.85; }
  .dv-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }

  /* Calendari */
  .dv-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-top:10px; }
  .dv-cal-dow { font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.08em; text-align:center; padding:4px 0 8px; }
  .dv-cal-cell { aspect-ratio:1; border-radius:3px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; cursor:default; font-size:11px; font-family:${FONTS.mono}; color:${COLORS.textMuted}; transition:background 80ms; min-height:32px; }
  .dv-cal-cell.other-month { opacity:0.25; }
  .dv-cal-cell.today { color:${COLORS.textPrimary}; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; }
  .dv-cal-cell.has-event { color:${COLORS.textPrimary}; cursor:pointer; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; }
  .dv-cal-cell.has-event:hover { background:rgba(0,255,136,0.15); }
  .dv-cal-cell.has-recorded { background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.neonGreen}; cursor:pointer; }
  .dv-cal-cell.has-recorded:hover { border-color:${COLORS.borderGreen}; }
  .dv-cal-cell-num { font-size:11px; font-weight:500; line-height:1; }
  .dv-cal-dot { width:4px; height:4px; border-radius:50%; background:${COLORS.neonGreen}; margin-top:3px; flex-shrink:0; }
  .dv-cal-dot.rec { background:${COLORS.neonCyan}; }

  .dv-cal-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
  .dv-cal-month { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; text-transform:capitalize; }
  .dv-cal-nav-btn { width:26px; height:26px; background:transparent; border:1px solid ${COLORS.border}; border-radius:3px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .dv-cal-nav-btn:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }

  .dv-cal-legend { display:flex; gap:14px; margin-top:10px; padding-top:10px; border-top:1px solid ${COLORS.border}; }
  .dv-cal-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:${COLORS.textMuted}; }
  .dv-cal-legend-dot { width:8px; height:8px; border-radius:2px; flex-shrink:0; }

  .dv-cal-tooltip { position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:${COLORS.elevated}; border:1px solid ${COLORS.borderMid}; border-radius:4px; padding:6px 10px; white-space:nowrap; z-index:10; pointer-events:none; font-size:10px; color:${COLORS.textSecondary}; min-width:120px; }
  .dv-cal-tooltip-name { font-weight:500; color:${COLORS.textPrimary}; margin-bottom:2px; font-size:11px; }
`


// ── Calendari de dividends ─────────────────────────────────────────────────────
const DAYS_CA = ['Dl','Dm','Dc','Dj','Dv','Ds','Dg']

function CalendarSection({ dividends, upcomingData }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [hovered, setHovered] = useState(null)

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Primer dia de la setmana (0=Dl...6=Dg)
  const firstDay = new Date(year, month, 1).getDay()
  const offset   = (firstDay + 6) % 7 // ajust per Dl=0
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()

  // Dividends registrats en aquest mes (per data de pagament)
  const recordedByDay = useMemo(() => {
    const map = {}
    dividends.forEach(d => {
      if (!d.payDate) return
      const dt = new Date(d.payDate)
      if (dt.getFullYear()===year && dt.getMonth()===month) {
        const day = dt.getDate()
        if (!map[day]) map[day] = []
        map[day].push(d)
      }
    })
    return map
  }, [dividends, year, month])

  // Ex-dates de Yahoo en aquest mes
  const upcomingByDay = useMemo(() => {
    const map = {}
    Object.values(upcomingData).forEach(({ inv, info }) => {
      if (!info?.exDate) return
      const dt = new Date(info.exDate)
      if (dt.getFullYear()===year && dt.getMonth()===month) {
        const day = dt.getDate()
        if (!map[day]) map[day] = []
        map[day].push({ inv, info })
      }
    })
    return map
  }, [upcomingData, year, month])

  // Construeix les cel·les
  const cells = []
  // Dies del mes anterior
  for (let i = offset-1; i >= 0; i--) {
    cells.push({ day: daysInPrev-i, currentMonth: false })
  }
  // Dies del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, recorded: recordedByDay[d]||[], upcoming: upcomingByDay[d]||[] })
  }
  // Dies del mes següent
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, currentMonth: false })
  }

  const monthName = viewDate.toLocaleDateString('ca-ES', { month:'long', year:'numeric' })

  return (
    <div className="dv-panel">
      <div className="dv-cal-nav">
        <button className="dv-cal-nav-btn" onClick={prevMonth}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="dv-cal-month">{monthName}</span>
        <button className="dv-cal-nav-btn" onClick={nextMonth}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className="dv-cal-grid">
        {DAYS_CA.map(d => <div key={d} className="dv-cal-dow">{d}</div>)}
        {cells.map((cell, i) => {
          const isToday = cell.currentMonth &&
            today.getDate()===cell.day && today.getMonth()===month && today.getFullYear()===year
          const hasRec = cell.currentMonth && cell.recorded?.length > 0
          const hasUpc = cell.currentMonth && cell.upcoming?.length > 0
          const isHovered = hovered === i

          let cls = 'dv-cal-cell'
          if (!cell.currentMonth) cls += ' other-month'
          else if (hasRec) cls += ' has-recorded'
          else if (hasUpc) cls += ' has-event'
          else if (isToday) cls += ' today'

          return (
            <div key={i} className={cls}
              onMouseEnter={()=>(hasRec||hasUpc)&&setHovered(i)}
              onMouseLeave={()=>setHovered(null)}
            >
              <span className="dv-cal-cell-num">{cell.day}</span>
              {hasRec && <div className="dv-cal-dot rec"/>}
              {!hasRec && hasUpc && <div className="dv-cal-dot"/>}

              {isHovered && (hasRec || hasUpc) && (
                <div className="dv-cal-tooltip">
                  {hasRec && cell.recorded.map((d,j) => (
                    <div key={j}>
                      <p className="dv-cal-tooltip-name">{d.assetName}</p>
                      <p style={{color:COLORS.neonGreen,fontFamily:FONTS.mono}}>{fmtEur(d.amount)} cobrat</p>
                    </div>
                  ))}
                  {hasUpc && cell.upcoming.map(({inv,info},j) => (
                    <div key={j}>
                      <p className="dv-cal-tooltip-name">{inv.name}</p>
                      <p style={{color:COLORS.neonGreen,fontFamily:FONTS.mono,fontSize:10}}>Ex-date · {inv.ticker}</p>
                      {info.dividendRate && <p style={{color:COLORS.textMuted,fontSize:10,fontFamily:FONTS.mono}}>${(info.dividendRate/4).toFixed(4)}/acció</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="dv-cal-legend">
        <div className="dv-cal-legend-item">
          <div className="dv-cal-legend-dot" style={{background:COLORS.bgGreen,border:`1px solid ${COLORS.borderGreen}`}}/>
          Ex-date (Yahoo)
        </div>
        <div className="dv-cal-legend-item">
          <div className="dv-cal-legend-dot" style={{background:COLORS.elevated,border:`1px solid ${COLORS.border}`}}/>
          Pagament registrat
        </div>
      </div>
    </div>
  )
}

// ── Upcoming dividends (llegeix de meta Yahoo) ─────────────────────────────────
function UpcomingSection({ investments, data, loading }) {

  const upcoming = Object.values(data)
    .filter(({ info }) => info?.exDate)
    .sort((a, b) => a.info.exDate.localeCompare(b.info.exDate))

  if (loading) return (
    <div className="dv-panel">
      <p className="dv-panel-title">Proper dividend (ex-date)</p>
      <p style={{ fontSize:12, color:COLORS.textMuted, textAlign:'center', padding:'20px 0' }}>Carregant...</p>
    </div>
  )

  if (!upcoming.length) return (
    <div className="dv-panel">
      <p className="dv-panel-title">Proper dividend (ex-date)</p>
      <div className="dv-empty">
        <p className="dv-empty-main">Cap dividend proper trobat</p>
        <p className="dv-empty-sub">Yahoo Finance pot no tenir dades per alguns actius</p>
      </div>
    </div>
  )

  return (
    <div className="dv-panel">
      <p className="dv-panel-title">Proper dividend (ex-date)</p>
      {upcoming.map(({ inv, info }) => {
        const d    = new Date(info.exDate)
        const day  = d.getDate()
        const mon  = d.toLocaleDateString('ca-ES', { month:'short' }).replace('.','')
        const qty  = inv.totalQty || inv.qty || 0
        const rate = info.dividendRate || info.trailingAnnualDividendRate
        const quarterly = rate ? rate / 4 : null
        const estimated = quarterly && qty > 0 ? quarterly * qty : null
        const yld = info.dividendYield || info.trailingAnnualDividendYield

        return (
          <div key={inv.id} className="dv-cal-row">
            <div className="dv-cal-date">
              <span className="dv-cal-day">{day}</span>
              <span className="dv-cal-mon">{mon}</span>
            </div>
            <div className="dv-cal-info">
              <p className="dv-cal-name">{inv.name}</p>
              <p className="dv-cal-meta">
                {inv.ticker}
                {quarterly ? ` · ~$${quarterly.toFixed(4)}/acció` : ''}
                {qty > 0 ? ` · ${qty.toFixed(4)} u.` : ''}
              </p>
            </div>
            {yld && <span className="dv-yield-badge">{(yld * 100).toFixed(2)}%</span>}
            {estimated && <span className="dv-cal-amount">~{fmtEur(estimated)}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── Yield per actiu (sobre cost) ───────────────────────────────────────────────
function YieldSection({ investments, dividends }) {
  const yieldData = useMemo(() => {
    return investments
      .filter(inv => ['etf','stock'].includes(inv.type))
      .map(inv => {
        const totalReceived = dividends
          .filter(d => d.assetId === inv.id)
          .reduce((s, d) => s + d.amount, 0)
        const cost = inv.totalCost || inv.initialValue || 0
        const yieldOnCost = cost > 0 ? (totalReceived / cost) * 100 : 0
        return { inv, totalReceived, yieldOnCost }
      })
      .filter(x => x.totalReceived > 0)
      .sort((a, b) => b.yieldOnCost - a.yieldOnCost)
  }, [investments, dividends])

  if (!yieldData.length) return null

  const maxYield = Math.max(...yieldData.map(x => x.yieldOnCost), 0.01)

  return (
    <div className="dv-panel">
      <p className="dv-panel-title">Yield sobre cost (YoC)</p>
      {yieldData.map(({ inv, totalReceived, yieldOnCost }) => (
        <div key={inv.id} className="dv-yield-row">
          <span className="dv-yield-name">{inv.name}</span>
          <div className="dv-yield-bar-wrap">
            <div className="dv-yield-bar" style={{ width:`${(yieldOnCost/maxYield)*100}%` }}/>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <p className="dv-yield-val">{yieldOnCost.toFixed(2)}%</p>
            <p style={{ fontSize:10, color:COLORS.textMuted, fontFamily:FONTS.mono }}>{fmtEur(totalReceived)} rebut</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Component principal ────────────────────────────────────────────────────────
export default function DividendsPage({
  dividends, addDividend, removeDividend,
  byMonth, totalThisYear, totalAll,
  investments = [],
}) {
  const [showModal, setShowModal] = useState(false)
  const [upcomingData, setUpcomingData] = useState({})
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const thisYear = new Date().getFullYear().toString()

  // Carrega ex-dates de Yahoo per tots els actius elegibles
  useEffect(() => {
    const eligible = investments.filter(i => i.ticker && ['etf','stock'].includes(i.type))
    if (!eligible.length) { setUpcomingLoading(false); return }
    Promise.all(eligible.map(async inv => {
      const info = await fetchNextDividend(inv.ticker)
      return { inv, info }
    })).then(results => {
      const map = {}
      results.forEach(({ inv, info }) => {
        if (info?.exDate || info?.dividendRate) map[inv.id] = { inv, info }
      })
      setUpcomingData(map)
      setUpcomingLoading(false)
    })
  }, [investments.length]) // eslint-disable-line

  // Gràfic: últims 12 mesos
  const chartData = useMemo(() => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d   = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const lbl = d.toLocaleDateString('ca-ES', { month:'short' }).replace('.','')
      months.push({ key, lbl, amount: byMonth[key] || 0 })
    }
    return months
  }, [byMonth])

  // Dividends ordenats per data desc
  const sorted = [...dividends].sort((a,b) => b.payDate?.localeCompare(a.payDate||'') || 0)

  // Per actiu (nombre de pagaments)
  const numAssets = new Set(dividends.map(d => d.assetId)).size

  return (
    <div className="dv">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div className="dv-hdr">
        <div>
          <h2 className="dv-title">Dividends</h2>
          <p className="dv-sub">Ingressos passius del teu portfoli</p>
        </div>
        <button className="dv-btn-add" onClick={()=>setShowModal(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar dividend
        </button>
      </div>

      {/* KPIs */}
      <div className="dv-kpis">
        <div className="dv-kpi">
          <p className="dv-kpi-l">Any {thisYear}</p>
          <p className="dv-kpi-v g">{fmtEur(totalThisYear)}</p>
          <p className="dv-kpi-sub">{fmtEur(totalThisYear/12)}/mes mitjà</p>
        </div>
        <div className="dv-kpi">
          <p className="dv-kpi-l">Total acumulat</p>
          <p className="dv-kpi-v g">{fmtEur(totalAll)}</p>
          <p className="dv-kpi-sub">{dividends.length} pagaments</p>
        </div>
        <div className="dv-kpi">
          <p className="dv-kpi-l">Actius pagadors</p>
          <p className="dv-kpi-v">{numAssets}</p>
          <p className="dv-kpi-sub">de {investments.filter(i=>['etf','stock'].includes(i.type)).length} elegibles</p>
        </div>
      </div>

      {/* Calendari */}
      <CalendarSection dividends={dividends} upcomingData={upcomingData}/>

      {/* Gràfic mensual */}
      <div className="dv-panel">
        <p className="dv-panel-title">Ingressos per mes (últims 12 mesos)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
            <XAxis dataKey="lbl" tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fontFamily:FONTS.mono,fill:COLORS.textMuted}} axisLine={false} tickLine={false} width={36} tickFormatter={v=>v>0?fmtEur(v).replace('€','')+'€':''}/>
            <Tooltip content={<DivTooltip/>} cursor={{fill:COLORS.elevated}}/>
            <Bar dataKey="amount" radius={[2,2,0,0]}>
              {chartData.map((e,i) => (
                <Cell key={i} fill={e.amount>0?COLORS.neonGreen:COLORS.border} fillOpacity={e.amount>0?0.70:1}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Proper dividend */}
      <UpcomingSection investments={investments} data={upcomingData} loading={upcomingLoading}/>

      {/* Yield sobre cost */}
      <YieldSection investments={investments} dividends={dividends}/>

      {/* Historial */}
      <div className="dv-panel">
        <p className="dv-panel-title">Historial de pagaments</p>
        {sorted.length===0 ? (
          <div className="dv-empty">
            <p className="dv-empty-main">Cap dividend registrat</p>
            <p className="dv-empty-sub">Registra el primer cobrament amb el botó de dalt</p>
          </div>
        ) : sorted.map(d => (
          <div key={d.id} className="dv-tx">
            <div className="dv-tx-dot"/>
            <div className="dv-tx-info">
              <p className="dv-tx-name">{d.assetName} {d.ticker ? `(${d.ticker})` : ''}</p>
              <p className="dv-tx-date">{d.payDate} {d.note ? `· ${d.note}` : ''}</p>
            </div>
            <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
              <p className="dv-tx-amount">{fmtEur(d.amount)}</p>
              {d.perShare>0 && d.shares>0 && (
                <p className="dv-tx-per">{fmtEur(d.perShare)}/u. · {d.shares} u.</p>
              )}
            </div>
            <button className="dv-tx-del" onClick={()=>removeDividend(d.id)}><TrashIcon size={11}/></button>
          </div>
        ))}
      </div>

      {showModal && (
        <AddDividendModal
          investments={investments}
          onAdd={async data => { await addDividend(data); setShowModal(false) }}
          onClose={()=>setShowModal(false)}
        />
      )}
    </div>
  )
}

// ── Modal afegir dividend ──────────────────────────────────────────────────────
function AddDividendModal({ investments, onAdd, onClose }) {
  const eligible = investments.filter(i => ['etf','stock'].includes(i.type))
  const [form, setForm] = useState({
    assetId:  eligible[0]?.id || '',
    amount:   '',
    shares:   '',
    payDate:  new Date().toISOString().split('T')[0],
    note:     '',
  })
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const selectedAsset = eligible.find(i => i.id === form.assetId)

  // Auto-omplir shares de la posició actual
  useEffect(() => {
    if (selectedAsset && !form.shares) {
      const qty = selectedAsset.totalQty || selectedAsset.qty || 0
      if (qty > 0) set('shares', qty.toFixed(4))
    }
  }, [form.assetId]) // eslint-disable-line

  const submit = async () => {
    if (!form.assetId) return setError('Selecciona un actiu')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Introdueix un import vàlid')
    if (!form.payDate) return setError('Introdueix la data de pagament')
    setError('')
    await onAdd({
      assetId:   form.assetId,
      assetName: selectedAsset?.name || '',
      ticker:    selectedAsset?.ticker || '',
      amount:    parseFloat(form.amount),
      shares:    parseFloat(form.shares) || 0,
      payDate:   form.payDate,
      note:      form.note,
    })
  }

  return (
    <div className="dv-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="dv-modal">
        <div className="dv-modal-hdr">
          <h3 className="dv-modal-title">Registrar dividend</h3>
          <button className="dv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="dv-fgroup">
          <div>
            <label className="dv-lbl">Actiu</label>
            <select className="dv-sel" value={form.assetId} onChange={e=>set('assetId',e.target.value)}>
              {eligible.length===0
                ? <option value="">Cap ETF/acció registrada</option>
                : eligible.map(i => <option key={i.id} value={i.id}>{i.name}{i.ticker?` (${i.ticker})`:''}</option>)
              }
            </select>
          </div>
          <div className="dv-grid2">
            <div>
              <label className="dv-lbl">Import cobrat (€)</label>
              <input type="number" inputMode="decimal" step="any" className="dv-inp mono" autoFocus value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00"/>
            </div>
            <div>
              <label className="dv-lbl">Accions tingudes</label>
              <input type="number" inputMode="decimal" step="any" className="dv-inp mono" value={form.shares} onChange={e=>set('shares',e.target.value)} placeholder="0"/>
            </div>
          </div>
          {form.amount && form.shares && parseFloat(form.shares)>0 && (
            <div style={{ padding:'8px 12px', background:COLORS.elevated, border:`1px solid ${COLORS.border}`, borderRadius:4 }}>
              <p style={{ fontSize:11, color:COLORS.textMuted, fontFamily:FONTS.mono }}>
                {fmtEur(parseFloat(form.amount)/parseFloat(form.shares))}/acció
                · yield estimat: {selectedAsset?.totalCost>0?((parseFloat(form.amount)*4/selectedAsset.totalCost)*100).toFixed(2):'—'}% anual
              </p>
            </div>
          )}
          <div className="dv-grid2">
            <div>
              <label className="dv-lbl">Data de pagament</label>
              <input type="date" className="dv-inp" value={form.payDate} onChange={e=>set('payDate',e.target.value)}/>
            </div>
            <div>
              <label className="dv-lbl">Nota</label>
              <input className="dv-inp" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Q1 2025..."/>
            </div>
          </div>
          {error && <p className="dv-error">{error}</p>}
        </div>
        <div className="dv-mfooter">
          <button className="dv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="dv-btn-ok" onClick={submit}>Registrar</button>
        </div>
      </div>
    </div>
  )
}