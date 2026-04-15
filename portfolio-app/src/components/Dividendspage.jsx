import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { fetchDividendInfo } from '../hooks/Usedividends'

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)
const ChevronLeft = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
const ChevronRight = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>

// Tooltip usa var(--c-*) directament — s'adapta al tema
const DivTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{background:'var(--c-elevated)',border:`1px solid var(--c-border)`,borderRadius:5,padding:'6px 10px',fontFamily:FONTS.sans}}>
      <p style={{fontSize:10,color:'var(--c-text-muted)',marginBottom:3}}>{label}</p>
      <p style={{fontSize:13,fontWeight:500,fontFamily:FONTS.mono,color:COLORS.neonGreen}}>{fmtEur(payload[0]?.value)}</p>
    </div>
  )
}

const DAYS_CA  = ['Dl','Dm','Dc','Dj','Dv','Ds','Dg']
const FREQ_LABEL = {1:'Anual',2:'Semestral',4:'Trimestral',6:'Bimestral',12:'Mensual'}

function daysUntil(dateStr) {
  const today=new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(dateStr+'T00:00:00')-today)/86400000)
}
function fmtDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr+'T12:00:00').toLocaleDateString('ca-ES',{day:'numeric',month:'short'})
}

const styles = `
  .dv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .dv-hero { background:linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%); border:1px solid var(--c-border); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .dv-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,var(--c-bg-green) 0%,transparent 70%); pointer-events:none; }
  .dv-hero-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
  .dv-hero-label { font-size:11px; font-weight:500; color:var(--c-text-muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .dv-hero-total { font-size:36px; font-weight:600; color:var(--c-text-primary); letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; }
  .dv-hero-total span { font-size:30px; opacity:0.7; }
  .dv-btn-add { display:flex; align-items:center; gap:5px; padding:7px 13px; background:${COLORS.neonGreen}; color:#000; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; flex-shrink:0; }
  .dv-btn-add:hover { opacity:0.85; }
  .dv-hero-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:14px; padding-top:14px; border-top:1px solid var(--c-border); }
  .dv-hero-metric-l { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .dv-hero-metric-v { font-size:18px; font-weight:500; font-family:${FONTS.num}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; }
  .dv-hero-metric-v.g { color:${COLORS.neonGreen}; }
  .dv-hero-metric-sub { font-size:12px; color:var(--c-text-muted); font-family:${FONTS.num}; margin-top:2px; }

  /* ── Layout 2 columnes (desktop) ── */
  .dv-layout { display:grid; grid-template-columns:1fr; gap:12px; }
  @media (min-width:900px) { .dv-layout { grid-template-columns:1fr 320px; } }
  .dv-col-main { display:flex; flex-direction:column; gap:12px; }
  .dv-col-side { display:flex; flex-direction:column; gap:12px; }

  /* ── Panel genèric ── */
  .dv-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; padding:16px; }
  .dv-panel-title { font-size:10px; font-weight:600; color:var(--c-text-secondary); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:12px; }

  /* ── Per actiu ── */
  .dv-asset-card { background:var(--c-elevated); border:1px solid var(--c-border); border-radius:8px; overflow:hidden; margin-bottom:8px; }
  .dv-asset-card:last-child { margin-bottom:0; }
  .dv-asset-hdr { display:flex; align-items:center; gap:10px; padding:11px 13px; background:var(--c-elevated); }
  .dv-asset-av { width:28px; height:28px; border-radius:8px; background:var(--c-bg-green); color:${COLORS.neonGreen}; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .dv-asset-name { flex:1; font-size:13px; font-weight:600; color:var(--c-text-primary); }
  .dv-asset-ticker { font-size:10px; font-family:${FONTS.mono}; color:var(--c-text-muted); }
  .dv-asset-body { padding:10px 13px; display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .dv-asset-stat-l { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:3px; }
  .dv-asset-stat-v { font-size:12px; font-weight:500; font-family:${FONTS.num}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; }
  .dv-asset-stat-v.g { color:${COLORS.neonGreen}; }
  .dv-asset-dates { padding:0 13px 11px; display:flex; gap:6px; flex-wrap:wrap; }
  .dv-date-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:20px; }
  .dv-date-pill.ex  { background:var(--c-bg-amber); border:1px solid var(--c-border-amber); }
  .dv-date-pill.pay { background:var(--c-bg-green); border:1px solid var(--c-border-green); }
  .dv-date-pill-type { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; }
  .dv-date-pill.ex .dv-date-pill-type { color:${COLORS.neonAmber}; }
  .dv-date-pill.pay .dv-date-pill-type { color:${COLORS.neonGreen}; }
  .dv-date-pill-date { font-size:11px; font-weight:600; font-family:${FONTS.num}; color:var(--c-text-primary); }
  .dv-date-pill-days { font-size:10px; color:var(--c-text-secondary); font-family:${FONTS.mono}; }
  .dv-earn-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:20px; background:var(--c-bg-purple); border:1px solid var(--c-border-purple); }
  .dv-earn-type { font-size:9px; font-weight:700; color:var(--c-purple); text-transform:uppercase; letter-spacing:0.08em; }
  .dv-earn-date { font-size:11px; font-weight:600; font-family:${FONTS.mono}; color:var(--c-text-primary); }
  .dv-earn-eps { font-size:10px; color:var(--c-text-secondary); font-family:${FONTS.mono}; }

  /* ── Calendari compacte ── */
  .dv-cal-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .dv-cal-month { font-size:12px; font-weight:500; color:var(--c-text-primary); text-transform:capitalize; }
  .dv-cal-nav-btn { width:22px; height:22px; background:transparent; border:1px solid var(--c-border); border-radius:3px; color:var(--c-text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .dv-cal-nav-btn:hover { border-color:var(--c-text-disabled); color:var(--c-text-primary); }
  .dv-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
  .dv-cal-dow { font-size:8px; font-weight:600; color:var(--c-text-disabled); text-align:center; padding:0 0 5px; }
  .dv-cal-cell { aspect-ratio:1; border-radius:3px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-family:${FONTS.num}; color:var(--c-text-muted); min-height:24px; position:relative; transition:background 80ms; }
  .dv-cal-cell.other { opacity:0.18; }
  .dv-cal-cell.today { color:var(--c-text-primary); background:var(--c-surface); border:1px solid var(--c-border-mid); }
  .dv-cal-cell.pay   { color:${COLORS.neonGreen}; background:var(--c-bg-green); border:1px solid var(--c-border-green); cursor:pointer; font-weight:700; }
  .dv-cal-cell.ex    { color:${COLORS.neonAmber}; background:var(--c-bg-amber); border:1px solid var(--c-border-amber); cursor:pointer; font-weight:700; }
  .dv-cal-cell.past  { color:${COLORS.neonCyan}; background:var(--c-bg-cyan); border:1px solid var(--c-border-cyan); cursor:pointer; }
  .dv-cal-cell.rec   { color:${COLORS.neonCyan}; background:var(--c-bg-cyan); border:1px solid var(--c-border-cyan); cursor:pointer; }
  .dv-cal-cell.earn  { color:var(--c-purple); background:var(--c-bg-purple); border:1px solid var(--c-border-purple); cursor:pointer; }
  .dv-cal-cell-num { font-size:10px; font-weight:500; line-height:1; }
  .dv-cal-dot { width:3px; height:3px; border-radius:50%; background:currentColor; margin-top:2px; }

  /* Popup del calendari — usa variables CSS */
  .dv-cal-pop { position:absolute; bottom:calc(100% + 4px); left:50%; transform:translateX(-50%); background:var(--c-elevated); border:1px solid var(--c-border); border-radius:6px; padding:8px 10px; white-space:nowrap; z-index:20; pointer-events:none; min-width:160px; box-shadow:0 8px 24px rgba(0,0,0,0.15); }
  .dv-cal-pop::after { content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%); border:4px solid transparent; border-top-color:var(--c-border); }
  .dv-cal-pop-type { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:4px; display:block; }
  .dv-cal-pop-name { font-size:11px; font-weight:600; color:var(--c-text-primary); margin-bottom:2px; }
  .dv-cal-pop-meta { font-size:10px; color:var(--c-text-secondary); font-family:${FONTS.mono}; }
  .dv-cal-pop-amt  { font-size:11px; color:${COLORS.neonGreen}; font-family:${FONTS.mono}; font-weight:600; }

  .dv-cal-legend { display:flex; gap:10px; margin-top:10px; padding-top:10px; border-top:1px solid var(--c-border); flex-wrap:wrap; }
  .dv-cal-legend-item { display:flex; align-items:center; gap:4px; font-size:9px; color:var(--c-text-muted); }
  .dv-cal-legend-dot  { width:6px; height:6px; border-radius:2px; flex-shrink:0; }

  /* ── Upcoming ── */
  .dv-up-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--c-border); }
  .dv-up-row:last-child { border-bottom:none; }
  .dv-up-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:2px 7px; border-radius:10px; flex-shrink:0; }
  .dv-up-badge.pay  { background:var(--c-bg-green); color:${COLORS.neonGreen}; }
  .dv-up-badge.ex   { background:var(--c-bg-amber); color:${COLORS.neonAmber}; }
  .dv-up-badge.soon { background:var(--c-bg-red); color:${COLORS.neonRed}; }
  .dv-up-name { flex:1; font-size:12px; font-weight:500; color:var(--c-text-secondary); min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dv-up-meta { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .dv-up-amt  { font-size:12px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; flex-shrink:0; }

  /* ── Yield ── */
  .dv-yield-row { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid var(--c-border); }
  .dv-yield-row:last-child { border-bottom:none; }
  .dv-yield-name { flex:1; font-size:12px; font-weight:500; color:var(--c-text-secondary); }
  .dv-yield-bar-wrap { width:60px; height:2px; background:var(--c-border); border-radius:1px; overflow:hidden; margin:0 10px; flex-shrink:0; }
  .dv-yield-bar { height:100%; background:${COLORS.neonGreen}; border-radius:1px; }
  .dv-yield-val { font-size:12px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; min-width:44px; text-align:right; }

  /* ── Historial ── */
  .dv-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid var(--c-border); }
  .dv-tx:last-child { border-bottom:none; }
  .dv-tx-dot { width:5px; height:5px; border-radius:50%; background:${COLORS.neonGreen}; flex-shrink:0; margin-right:10px; }
  .dv-tx-info { flex:1; min-width:0; }
  .dv-tx-name { font-size:12px; font-weight:500; color:var(--c-text-secondary); margin-bottom:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dv-tx-date { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .dv-tx-amount { font-size:13px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; flex-shrink:0; margin-left:10px; font-variant-numeric:tabular-nums; }
  .dv-tx-per { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; text-align:right; }
  .dv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:var(--c-text-disabled); margin-left:6px; transition:all 80ms; }
  .dv-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  .dv-empty { padding:32px 0; text-align:center; }
  .dv-empty-main { font-size:13px; color:var(--c-text-muted); font-weight:500; margin-bottom:4px; }
  .dv-empty-sub  { font-size:11px; color:var(--c-text-disabled); }

  .dv-spin-wrap { display:flex; align-items:center; gap:8px; padding:12px 0; font-size:11px; color:var(--c-text-muted); }
  .dv-spin { width:11px; height:11px; border:1.5px solid var(--c-border); border-top-color:var(--c-text-secondary); border-radius:50%; animation:dvspin .7s linear infinite; flex-shrink:0; }
  @keyframes dvspin { to { transform:rotate(360deg); } }

  /* ── Modal ── */
  .dv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
  @media (min-width:640px) { .dv-overlay { align-items:center; padding:16px; } }
  .dv-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:12px 12px 0 0; width:100%; padding:20px 16px 100px; font-family:${FONTS.sans}; max-height:92dvh; overflow-y:auto; }
  @media (min-width:640px) { .dv-modal { border-radius:10px; max-width:400px; padding:24px 20px; } }
  .dv-modal-drag { width:36px; height:4px; border-radius:2px; background:${COLORS.border}; margin:0 auto 16px; display:block; }
  @media (min-width:640px) { .dv-modal-drag { display:none; } }
  .dv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .dv-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .dv-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .dv-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .dv-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .dv-inp:focus { border-color:${COLORS.neonGreen}; }
  .dv-inp::placeholder { color:${COLORS.textMuted}; }
  .dv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .dv-sel { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; cursor:pointer; -webkit-appearance:none; }
  .dv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .dv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .dv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .dv-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; }
  .dv-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; background:${COLORS.neonGreen}; color:#000; cursor:pointer; }
  .dv-btn-ok:hover { opacity:0.85; }
  .dv-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }
  .dv-hint { font-size:11px; color:${COLORS.textMuted}; padding:7px 10px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; border-radius:4px; font-family:${FONTS.mono}; }
`

function AssetDividendInfo({ inv, info, dividends }) {
  if (!info || typeof info !== 'object') return null
  const safeInfo = {
    histDivs:[], allDates:[], noDividends:false,
    ...info,
    histDivs: Array.isArray(info.histDivs) ? info.histDivs : [],
    allDates:  Array.isArray(info.allDates)  ? info.allDates  : [],
  }
  info = safeInfo

  const qty     = inv.totalQty || inv.qty || 0
  const freq    = info.frequency || 4
  const rate    = info.dividendRate || info.trailingRate || 0
  const yield_  = info.dividendYield || info.trailingYield || 0
  const perPay  = info.perPayment || (rate && freq ? +(rate/freq).toFixed(4) : null)
  const estPay  = perPay && qty > 0 ? +(perPay*qty).toFixed(2) : null
  const totalRec= dividends.filter(d=>d.assetId===inv.id).reduce((s,d)=>s+d.amount,0)

  const lastExDate  = info.lastExDate  || null
  const lastPayDate = info.lastPayDate || null
  const nextExDate  = info.nextExDate  || null
  const nextPayDate = info.nextPayDate || null
  const showExDate  = nextExDate  || lastExDate
  const showPayDate = nextPayDate || lastPayDate
  const isProjected = !!(nextExDate || nextPayDate)
  const recentHist  = safeInfo.histDivs.filter(h=>h?.exDate||h?.payDate||h?.date).slice(0,3)

  return (
    <div className="dv-asset-card">
      <div className="dv-asset-hdr">
        <div className="dv-asset-av">{(inv.name||'?').slice(0,2).toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}>
          <p className="dv-asset-name">{inv.name}</p>
          <p className="dv-asset-ticker">{inv.ticker} · {FREQ_LABEL[freq]||freq+'x/any'}</p>
        </div>
      </div>
      <div className="dv-asset-body">
        <div><p className="dv-asset-stat-l">Per acció</p><p className="dv-asset-stat-v g">{perPay?`$${perPay}`:'—'}</p></div>
        <div><p className="dv-asset-stat-l">Estimat</p><p className="dv-asset-stat-v g">{estPay?fmtEur(estPay):'—'}</p></div>
        <div><p className="dv-asset-stat-l">Yield</p><p className="dv-asset-stat-v">{yield_>0?`${(yield_*100).toFixed(2)}%`:'—'}</p></div>
        <div><p className="dv-asset-stat-l">Rebut</p><p className="dv-asset-stat-v g">{totalRec>0?fmtEur(totalRec):'—'}</p></div>
      </div>
      <div className="dv-asset-dates">
        {showExDate && (
          <div className="dv-date-pill ex">
            <span className="dv-date-pill-type">Ex{isProjected?' ~':' ✓'}</span>
            <span className="dv-date-pill-date">{fmtDateShort(showExDate)}</span>
            <span className="dv-date-pill-days">{(()=>{const d=daysUntil(showExDate);return d===0?'avui':d<0?`fa ${Math.abs(d)}d`:`en ${d}d`})()}</span>
          </div>
        )}
        {showPayDate && (
          <div className="dv-date-pill pay">
            <span className="dv-date-pill-type">Pay{isProjected?' ~':' ✓'}</span>
            <span className="dv-date-pill-date">{fmtDateShort(showPayDate)}</span>
            <span className="dv-date-pill-days">{(()=>{const d=daysUntil(showPayDate);return d===0?'avui':d<0?`fa ${Math.abs(d)}d`:`en ${d}d`})()}</span>
          </div>
        )}
        {info.earningsStart && (
          <div className="dv-earn-pill">
            <span className="dv-earn-type">Earnings</span>
            <span className="dv-earn-date">{fmtDateShort(info.earningsStart)}</span>
            {info.epsEstimate && <span className="dv-earn-eps">EPS ${info.epsEstimate.toFixed(2)}</span>}
          </div>
        )}
        {recentHist.length>0 && (
          <div style={{display:'flex',flexDirection:'column',gap:2,alignSelf:'center',marginLeft:4}}>
            {recentHist.map((h,i)=>(
              <span key={i} style={{fontSize:9,fontFamily:FONTS.mono,color:'var(--c-text-muted)'}}>
                {(h.payDate||h.exDate||h.date||'').slice(0,7)} ${(typeof h.amount==='number'?h.amount:0).toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarSection({ dividends, upcomingData, loading }) {
  const today = new Date()
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [hovered, setHovered] = useState(null)
  const year  = view.getFullYear()
  const month = view.getMonth()

  const firstDow  = (new Date(year,month,1).getDay()+6)%7
  const daysInMon = new Date(year,month+1,0).getDate()
  const daysInPrev= new Date(year,month,0).getDate()

  const recByDay = useMemo(()=>{
    const m={}
    dividends.forEach(d=>{
      if(!d.payDate)return
      const dt=new Date(d.payDate+'T12:00:00')
      if(dt.getFullYear()===year&&dt.getMonth()===month){
        const day=dt.getDate(); if(!m[day])m[day]=[]
        m[day].push({type:'rec',data:d})
      }
    }); return m
  },[dividends,year,month])

  const payByDay = useMemo(()=>{
    const m={}
    Object.values(upcomingData).forEach(({inv,info})=>{
      ;(info?.allDates||[]).forEach(({date:ds,isPast})=>{
        const dt=new Date(ds+'T12:00:00')
        if(dt.getFullYear()===year&&dt.getMonth()===month){
          const day=dt.getDate(); if(!m[day])m[day]=[]
          m[day].push({inv,info,isPast})
        }
      })
    }); return m
  },[upcomingData,year,month])

  const exByDay = useMemo(()=>{
    const m={}
    Object.values(upcomingData).forEach(({inv,info})=>{
      ;(info?.allDates||[]).forEach(({exDate:ds})=>{
        if(!ds)return
        const dt=new Date(ds+'T12:00:00')
        if(dt.getFullYear()===year&&dt.getMonth()===month){
          const day=dt.getDate(); if(!m[day])m[day]=[]
          if(!m[day].find(x=>x.inv.id===inv.id))m[day].push({inv,info})
        }
      })
    }); return m
  },[upcomingData,year,month])

  const earnByDay = useMemo(()=>{
    const m={}
    Object.values(upcomingData).forEach(({inv,info})=>{
      if(!info?.earningsStart)return
      const dt=new Date(info.earningsStart+'T12:00:00')
      if(dt.getFullYear()===year&&dt.getMonth()===month){
        const day=dt.getDate(); if(!m[day])m[day]=[]
        m[day].push({inv,info})
      }
    }); return m
  },[upcomingData,year,month])

  const cells=[]
  for(let i=firstDow-1;i>=0;i--) cells.push({day:daysInPrev-i,cur:false})
  for(let d=1;d<=daysInMon;d++) cells.push({day:d,cur:true,rec:recByDay[d]||[],pay:payByDay[d]||[],ex:exByDay[d]||[],earn:earnByDay[d]||[]})
  while(cells.length<42) cells.push({day:cells.length-daysInMon-firstDow+1,cur:false})

  const monthName=view.toLocaleDateString('ca-ES',{month:'long',year:'numeric'})

  return (
    <div className="dv-panel">
      <div className="dv-cal-nav">
        <button className="dv-cal-nav-btn" onClick={()=>setView(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}><ChevronLeft/></button>
        <span className="dv-cal-month">{monthName}</span>
        <button className="dv-cal-nav-btn" onClick={()=>setView(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}><ChevronRight/></button>
      </div>
      {loading ? (
        <div className="dv-spin-wrap"><div className="dv-spin"/> Carregant...</div>
      ) : (
        <div className="dv-cal-grid">
          {DAYS_CA.map(d=><div key={d} className="dv-cal-dow">{d}</div>)}
          {cells.map((cell,i)=>{
            if(!cell.cur) return <div key={i} className="dv-cal-cell other"><span className="dv-cal-cell-num">{cell.day}</span></div>
            const isToday=today.getDate()===cell.day&&today.getMonth()===month&&today.getFullYear()===year
            const hasRec =cell.rec.length>0, hasPay=cell.pay.length>0
            const hasEx  =cell.ex.length>0,  hasEarn=cell.earn.length>0
            const hasEvent=hasRec||hasPay||hasEx||hasEarn
            const hasPast=hasPay&&cell.pay.every(p=>p.isPast)
            let cls='dv-cal-cell'
            if(hasRec)            cls+=' rec'
            else if(hasEarn)      cls+=' earn'
            else if(hasPay&&!hasPast) cls+=' pay'
            else if(hasPast)      cls+=' past'
            else if(hasEx)        cls+=' ex'
            else if(isToday)      cls+=' today'
            return (
              <div key={i} className={cls}
                onMouseEnter={()=>hasEvent&&setHovered(i)}
                onMouseLeave={()=>setHovered(null)}
                style={{cursor:hasEvent?'pointer':'default'}}
              >
                <span className="dv-cal-cell-num">{cell.day}</span>
                {hasEvent&&<div className="dv-cal-dot"/>}
                {hovered===i&&hasEvent&&(
                  <div className="dv-cal-pop">
                    {hasRec&&cell.rec.map((r,j)=>(
                      <div key={j} style={{marginBottom:4}}>
                        <span className="dv-cal-pop-type" style={{color:COLORS.neonCyan}}>✓ Cobrat</span>
                        <p className="dv-cal-pop-name">{r.data.assetName}</p>
                        <p className="dv-cal-pop-amt">{fmtEur(r.data.amount)}</p>
                      </div>
                    ))}
                    {hasEarn&&cell.earn.map(({inv,info},j)=>(
                      <div key={j} style={{marginBottom:4}}>
                        <span className="dv-cal-pop-type" style={{color:'var(--c-purple)'}}>📊 Earnings</span>
                        <p className="dv-cal-pop-name">{inv.name}</p>
                        {info.epsEstimate&&<p className="dv-cal-pop-meta">EPS est: ${info.epsEstimate.toFixed(2)}</p>}
                      </div>
                    ))}
                    {hasPay&&cell.pay.map(({inv,info,isPast},j)=>{
                      const qty=inv.totalQty||inv.qty||0
                      const perPay=info.perPayment||(info.dividendRate?+(info.dividendRate/(info.frequency||4)).toFixed(4):null)
                      const est=perPay&&qty>0?+(perPay*qty).toFixed(2):null
                      return (
                        <div key={j} style={{marginBottom:4}}>
                          <span className="dv-cal-pop-type" style={{color:isPast?COLORS.neonCyan:COLORS.neonGreen}}>{isPast?'📋 Passat':'💸 Pay Date'}</span>
                          <p className="dv-cal-pop-name">{inv.name}</p>
                          {est&&<p className="dv-cal-pop-amt">{isPast?'':' ~'}{fmtEur(est)}</p>}
                        </div>
                      )
                    })}
                    {hasEx&&!hasPay&&cell.ex.map(({inv},j)=>(
                      <div key={j}>
                        <span className="dv-cal-pop-type" style={{color:COLORS.neonAmber}}>📋 Ex-Div</span>
                        <p className="dv-cal-pop-name">{inv.name}</p>
                        <p className="dv-cal-pop-meta">cal tenir avui</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="dv-cal-legend">
        {[
          {color:'var(--c-bg-amber)',  border:'var(--c-border-amber)', label:'Ex-div'},
          {color:'var(--c-bg-green)',  border:'var(--c-border-green)', label:'Pay date'},
          {color:'var(--c-bg-purple)', border:'var(--c-border-purple)',label:'Earnings'},
          {color:'var(--c-bg-cyan)',   border:'var(--c-border-cyan)',  label:'Cobrat'},
        ].map((l,i)=>(
          <div key={i} className="dv-cal-legend-item">
            <div className="dv-cal-legend-dot" style={{background:l.color,border:`1px solid ${l.border}`}}/>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function UpcomingList({ upcomingData }) {
  const today=new Date().toISOString().split('T')[0]
  const items=useMemo(()=>{
    const list=[]
    Object.values(upcomingData).forEach(({inv,info})=>{
      if(!info?.allDates)return
      const qty=inv.totalQty||inv.qty||0
      const perPay=info.perPayment||(info.dividendRate?+(info.dividendRate/(info.frequency||4)).toFixed(4):null)
      const est=perPay&&qty>0?+(perPay*qty).toFixed(2):null
      const usePayDate=info.nextPayDate||(info.allDates||[]).find(d=>d.date>=today&&!d.isPast)?.date
      const useExDate =info.nextExDate ||(info.allDates||[]).find(d=>d.date>=today&&!d.isPast)?.exDate
      if(!usePayDate)return
      const dPay=daysUntil(usePayDate), dEx=useExDate?daysUntil(useExDate):null
      list.push({inv,info,usePayDate,useExDate,dPay,dEx,est})
    })
    return list.sort((a,b)=>a.usePayDate.localeCompare(b.usePayDate))
  },[upcomingData,today])

  if(!items.length)return null
  return (
    <div className="dv-panel">
      <p className="dv-panel-title">Propers pagaments</p>
      {items.map(({inv,usePayDate,useExDate,dPay,dEx,est},i)=>(
        <div key={i} className="dv-up-row">
          <div style={{display:'flex',flexDirection:'column',gap:3,flexShrink:0,minWidth:80}}>
            {useExDate&&<span className="dv-up-badge ex">EX {fmtDateShort(useExDate)}</span>}
            <span className={`dv-up-badge pay${dPay<=7?' soon':''}`}>PAY {fmtDateShort(usePayDate)}</span>
          </div>
          <div style={{flex:1,minWidth:0,marginLeft:8}}>
            <p className="dv-up-name">{inv.name}</p>
            <p className="dv-up-meta">{inv.ticker}{dPay!==null?` · en ${dPay}d`:''}</p>
          </div>
          {est&&<span className="dv-up-amt">~{fmtEur(est)}</span>}
        </div>
      ))}
    </div>
  )
}

function YieldSection({ investments, dividends }) {
  const data=useMemo(()=>{
    return investments
      .filter(i=>['etf','stock'].includes(i.type))
      .map(inv=>{
        const total=dividends.filter(d=>d.assetId===inv.id).reduce((s,d)=>s+d.amount,0)
        const cost=inv.totalCostEur||inv.totalCost||inv.initialValue||0
        const yoc=cost>0?(total/cost)*100:0
        return {inv,total,yoc}
      })
      .filter(x=>x.total>0)
      .sort((a,b)=>b.yoc-a.yoc)
  },[investments,dividends])

  if(!data.length)return null
  const maxYoc=Math.max(...data.map(x=>x.yoc),0.01)
  return (
    <div className="dv-panel">
      <p className="dv-panel-title">Yield sobre cost (YoC)</p>
      {data.map(({inv,total,yoc})=>(
        <div key={inv.id} className="dv-yield-row">
          <span className="dv-yield-name">{inv.name}</span>
          <div className="dv-yield-bar-wrap"><div className="dv-yield-bar" style={{width:`${(yoc/maxYoc)*100}%`}}/></div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <p className="dv-yield-val">{yoc.toFixed(2)}%</p>
            <p style={{fontSize:9,color:'var(--c-text-muted)',fontFamily:FONTS.mono}}>{fmtEur(total)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DividendsPage({
  dividends, addDividend, removeDividend,
  byMonth, totalThisYear, totalAll,
  investments=[],
}) {
  const [showModal,setShowModal]       = useState(false)
  const [upcomingData,setUpcomingData] = useState({})
  const [loadingCal,setLoadingCal]     = useState(true)
  const thisYear=new Date().getFullYear().toString()

  useEffect(()=>{
    const eligible=investments.filter(i=>i.ticker&&['etf','stock'].includes(i.type))
    if(!eligible.length){setLoadingCal(false);return}
    Promise.all(eligible.map(async inv=>({inv,info:await fetchDividendInfo(inv.ticker)}))).then(results=>{
      const map={}
      results.forEach(({inv,info})=>{if(info)map[inv.id]={inv,info}})
      setUpcomingData(map); setLoadingCal(false)
    })
  },[investments.length]) // eslint-disable-line

  const chartData=useMemo(()=>{
    const months=[]
    for(let i=11;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i)
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const lbl=d.toLocaleDateString('ca-ES',{month:'short'}).replace('.','')
      months.push({key,lbl,amount:byMonth[key]||0})
    }
    return months
  },[byMonth])

  const sorted   =[...dividends].sort((a,b)=>(b.payDate||'').localeCompare(a.payDate||''))
  const numAssets=new Set(dividends.map(d=>d.assetId)).size
  const eligible =investments.filter(i=>i.ticker&&['etf','stock'].includes(i.type))

  return (
    <div className="dv">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div className="dv-hero">
        <div className="dv-hero-top">
          <div>
            <p className="dv-hero-label">Dividends</p>
            <p className="dv-hero-total">{fmtEur(totalThisYear).replace('€','')}<span>€</span></p>
          </div>
          <button className="dv-btn-add" onClick={()=>setShowModal(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Registrar
          </button>
        </div>
        <div className="dv-hero-metrics">
          <div>
            <p className="dv-hero-metric-l">Any {thisYear}</p>
            <p className="dv-hero-metric-v g">{fmtEur(totalThisYear)}</p>
            <p className="dv-hero-metric-sub">{fmtEur(totalThisYear/12)}/mes</p>
          </div>
          <div>
            <p className="dv-hero-metric-l">Total acumulat</p>
            <p className="dv-hero-metric-v">{fmtEur(totalAll)}</p>
            <p className="dv-hero-metric-sub">{dividends.length} pagaments</p>
          </div>
          <div>
            <p className="dv-hero-metric-l">Actius</p>
            <p className="dv-hero-metric-v">{eligible.length}</p>
            <p className="dv-hero-metric-sub">{numAssets} amb historial</p>
          </div>
        </div>
      </div>

      <div className="dv-layout">
        <div className="dv-col-main">
          {eligible.length>0 && (
            <div className="dv-panel">
              <p className="dv-panel-title">Per actiu — Dividends &amp; Earnings</p>
              {loadingCal ? (
                <div className="dv-spin-wrap"><div className="dv-spin"/> Carregant dades...</div>
              ) : (
                eligible.map(inv=>(
                  <AssetDividendInfo key={inv.id} inv={inv} info={upcomingData[inv.id]?.info} dividends={dividends}/>
                ))
              )}
            </div>
          )}

          <UpcomingList upcomingData={upcomingData}/>

          <div className="dv-panel">
            <p className="dv-panel-title">Ingressos per mes (últims 12)</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
                <XAxis dataKey="lbl" tick={{fontSize:9,fontFamily:FONTS.mono,fill:'var(--c-text-muted)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fontFamily:FONTS.mono,fill:'var(--c-text-muted)'}} axisLine={false} tickLine={false} width={30} tickFormatter={v=>v>0?`${v}€`:''}/>
                <Tooltip content={<DivTooltip/>} cursor={{fill:'var(--c-elevated)'}}/>
                <Bar dataKey="amount" radius={[2,2,0,0]}>
                  {chartData.map((e,i)=><Cell key={i} fill={e.amount>0?COLORS.neonGreen:'var(--c-border)'} fillOpacity={e.amount>0?0.7:1}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <YieldSection investments={investments} dividends={dividends}/>

          <div className="dv-panel">
            <p className="dv-panel-title">Historial de pagaments</p>
            {sorted.length===0 ? (
              <div className="dv-empty">
                <p className="dv-empty-main">Cap dividend registrat</p>
                <p className="dv-empty-sub">Registra el primer cobrament</p>
              </div>
            ) : sorted.map(d=>(
              <div key={d.id} className="dv-tx">
                <div className="dv-tx-dot"/>
                <div className="dv-tx-info">
                  <p className="dv-tx-name">{d.assetName}{d.ticker?` (${d.ticker})`:''}</p>
                  <p className="dv-tx-date">{d.payDate}{d.note?` · ${d.note}`:''}</p>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                  <p className="dv-tx-amount">{fmtEur(d.amount)}</p>
                  {d.perShare>0&&d.shares>0&&<p className="dv-tx-per">{fmtEur(d.perShare)}/u. · {d.shares}u.</p>}
                </div>
                <button className="dv-tx-del" onClick={()=>removeDividend(d.id)}><TrashIcon size={11}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="dv-col-side">
          <CalendarSection dividends={dividends} upcomingData={upcomingData} loading={loadingCal}/>
        </div>
      </div>

      <div style={{height:16}}/>

      {showModal && (
        <AddDividendModal
          investments={investments}
          onAdd={async data=>{await addDividend(data);setShowModal(false)}}
          onClose={()=>setShowModal(false)}
        />
      )}
    </div>
  )
}

function AddDividendModal({ investments, onAdd, onClose }) {
  const eligible=investments.filter(i=>['etf','stock'].includes(i.type))
  const [form,setForm]=useState({assetId:eligible[0]?.id||'',amount:'',shares:'',payDate:new Date().toISOString().split('T')[0],note:''})
  const [error,setError]=useState('')
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const selectedAsset=eligible.find(i=>i.id===form.assetId)
  useEffect(()=>{
    if(selectedAsset){const qty=selectedAsset.totalQty||selectedAsset.qty||0;if(qty>0)set('shares',qty.toFixed(4))}
  },[form.assetId]) // eslint-disable-line
  const amt=parseFloat(form.amount)||0, shr=parseFloat(form.shares)||0
  const perShare=shr>0?amt/shr:null
  const yieldEst=selectedAsset?.totalCost>0&&amt>0?((amt*4/selectedAsset.totalCost)*100).toFixed(2):null
  const submit=async()=>{
    if(!form.assetId)return setError('Selecciona un actiu')
    if(amt<=0)return setError('Introdueix un import vàlid')
    if(!form.payDate)return setError('Introdueix la data de pagament')
    setError('')
    await onAdd({assetId:form.assetId,assetName:selectedAsset?.name||'',ticker:selectedAsset?.ticker||'',amount:amt,shares:shr,payDate:form.payDate,note:form.note})
  }
  return (
    <div className="dv-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="dv-modal">
        <div className="dv-modal-drag"/>
        <div className="dv-modal-hdr">
          <h3 className="dv-modal-title">Registrar dividend</h3>
          <button className="dv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="dv-fgroup">
          <div>
            <label className="dv-lbl">Actiu</label>
            <select className="dv-sel" value={form.assetId} onChange={e=>set('assetId',e.target.value)}>
              {eligible.length===0?<option value="">Cap ETF/acció registrada</option>:eligible.map(i=><option key={i.id} value={i.id}>{i.name}{i.ticker?` (${i.ticker})`:''}</option>)}
            </select>
          </div>
          <div className="dv-grid2">
            <div><label className="dv-lbl">Import cobrat (€)</label><input type="number" inputMode="decimal" step="any" className="dv-inp mono" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00"/></div>
            <div><label className="dv-lbl">Accions tingudes</label><input type="number" inputMode="decimal" step="any" className="dv-inp mono" value={form.shares} onChange={e=>set('shares',e.target.value)} placeholder="0"/></div>
          </div>
          {amt>0&&shr>0&&<p className="dv-hint">{fmtEur(perShare)}/acció{yieldEst?` · yield ~${yieldEst}% anual (x4)`:''}</p>}
          <div className="dv-grid2">
            <div><label className="dv-lbl">Data de pagament</label><input type="date" className="dv-inp" value={form.payDate} onChange={e=>set('payDate',e.target.value)}/></div>
            <div><label className="dv-lbl">Nota</label><input className="dv-inp" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Q1 2025..."/></div>
          </div>
          {error&&<p className="dv-error">{error}</p>}
        </div>
        <div className="dv-mfooter">
          <button className="dv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="dv-btn-ok" onClick={submit}>Registrar</button>
        </div>
      </div>
    </div>
  )
}