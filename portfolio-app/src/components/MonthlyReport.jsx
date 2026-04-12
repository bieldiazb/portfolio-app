import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

function fmtPct(n) { return `${Math.abs(n).toFixed(2)}%` }

const styles = `
  .mr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }
  .mr-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .mr-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(123,97,255,0.07) 0%,transparent 70%); pointer-events:none; }
  .mr-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .mr-hero-title { font-size:36px; font-weight:600; color:#fff; font-family:${FONTS.num}; line-height:1; margin-bottom:6px; }
  .mr-hero-sub { font-size:12px; color:rgba(255,255,255,0.28); margin-bottom:16px; }
  .mr-hero-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.05); }
  .mr-hero-m-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .mr-hero-m-v { font-size:16px; font-weight:300; color:#fff; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .mr-hero-m-v.g { color:${COLORS.neonGreen}; }
  .mr-hero-m-v.r { color:${COLORS.neonRed}; }
  .mr-hero-m-v.p { color:${COLORS.neonPurple}; }
  .mr-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .mr-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:14px; }
  .mr-sel-row { display:flex; gap:10px; }
  .mr-sel-group { display:flex; flex-direction:column; gap:6px; flex:1; }
  .mr-sel-lbl { font-size:9px; font-weight:600; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.12em; }
  .mr-sel { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 13px; font-family:${FONTS.sans}; font-size:15px; color:#fff; outline:none; cursor:pointer; -webkit-appearance:none; transition:border-color 100ms; }
  .mr-sel:focus { border-color:rgba(123,97,255,0.35); }
  .mr-sel option { background:#1a1a1a; }
  .mr-preview { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }
  .mr-preview-hdr { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); }
  .mr-preview-name { font-size:12px; font-weight:600; color:rgba(255,255,255,0.55); }
  .mr-preview-date { font-size:10px; color:rgba(255,255,255,0.25); font-family:${FONTS.num}; text-transform:capitalize; }
  .mr-preview-body { padding:14px; display:flex; flex-direction:column; gap:14px; }
  .mr-kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .mr-kpi { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; }
  .mr-kpi-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .mr-kpi-v { font-size:16px; font-weight:300; font-family:${FONTS.num}; color:#fff; font-variant-numeric:tabular-nums; }
  .mr-kpi-v.g { color:${COLORS.neonGreen}; }
  .mr-kpi-v.r { color:${COLORS.neonRed}; }
  .mr-kpi-sub { font-size:10px; color:rgba(255,255,255,0.22); margin-top:2px; font-family:${FONTS.num}; }
  .mr-evo-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .mr-evo-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; }
  .mr-evo-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); letter-spacing:0.10em; margin-bottom:5px; text-transform:capitalize; }
  .mr-evo-v { font-size:16px; font-weight:300; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .mr-evo-sub { font-size:10px; color:rgba(255,255,255,0.20); font-family:${FONTS.num}; }
  .mr-dist { display:flex; flex-direction:column; gap:10px; }
  .mr-dist-row { }
  .mr-dist-meta { display:flex; justify-content:space-between; margin-bottom:5px; }
  .mr-dist-name { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,0.55); }
  .mr-dist-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .mr-dist-val { font-size:11px; color:rgba(255,255,255,0.28); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .mr-track { height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
  .mr-fill { height:100%; border-radius:2px; }
  .mr-pos-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .mr-pos-row:last-child { border-bottom:none; }
  .mr-pos-av { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .mr-pos-name { flex:1; font-size:12px; font-weight:500; color:rgba(255,255,255,0.60); min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mr-pos-val { font-size:12px; font-family:${FONTS.num}; color:rgba(255,255,255,0.55); font-variant-numeric:tabular-nums; }
  .mr-sec-l { font-size:9px; font-weight:600; color:rgba(255,255,255,0.22); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:10px; }
  .mr-actions { display:flex; gap:8px; }
  .mr-btn-dl { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; background:${COLORS.neonPurple}; border:none; border-radius:10px; font-family:${FONTS.sans}; font-size:14px; font-weight:700; color:#fff; cursor:pointer; transition:opacity 100ms; }
  .mr-btn-dl:hover { opacity:0.85; }
  .mr-btn-dl:disabled { opacity:0.35; cursor:not-allowed; }
  .mr-btn-email { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; background:transparent; border:1px solid rgba(255,255,255,0.09); border-radius:10px; font-family:${FONTS.sans}; font-size:14px; font-weight:600; color:rgba(255,255,255,0.45); cursor:pointer; transition:all 100ms; }
  .mr-btn-email:hover { border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.75); }
  .mr-btn-email:disabled { opacity:0.35; cursor:not-allowed; }
  .mr-spin { width:14px; height:14px; border:1.5px solid rgba(255,255,255,0.20); border-top-color:#fff; border-radius:50%; animation:mrspin .7s linear infinite; flex-shrink:0; }
  @keyframes mrspin { to { transform:rotate(360deg); } }
  .mr-note { font-size:11px; color:rgba(255,255,255,0.18); text-align:center; }
  .mr-toast { padding:12px 16px; border-radius:10px; font-size:12px; font-weight:500; text-align:center; }
  .mr-toast.ok  { background:rgba(0,255,136,0.07); border:1px solid rgba(0,255,136,0.20); color:${COLORS.neonGreen}; }
  .mr-toast.err { background:rgba(255,59,59,0.07); border:1px solid rgba(255,59,59,0.18); color:${COLORS.neonRed}; }
`

function buildPdfHtml({ month, year, investments, savings, cryptos, commodities, snapshots }) {
  const totalInv = investments.reduce((s,i) => s + (i.totalQty && i.currentPrice ? i.totalQty * i.currentPrice : i.totalCostEur || i.totalCost || 0), 0)
  const totalSav = savings.reduce((s,sv) => s + (sv.balance || sv.amount || 0), 0)
  const totalCry = cryptos.reduce((s,c) => s + ((c.totalQty||c.qty) && c.currentPrice ? (c.totalQty||c.qty) * c.currentPrice : c.totalCost || 0), 0)
  const totalCom = (commodities||[]).reduce((s,c) => s + (c.totalCost || 0), 0)
  const total    = totalInv + totalSav + totalCry + totalCom
  const totalCostInv = investments.reduce((s,i) => s + (i.totalCostEur || i.totalCost || 0), 0)
  const totalCostCry = cryptos.reduce((s,c) => s + (c.totalCost || 0), 0)
  const totalCost    = totalCostInv + totalCostCry
  const gain         = totalInv + totalCry - totalCostInv - totalCostCry
  const gainPct      = totalCost > 0 ? (gain / totalCost) * 100 : 0

  const pad = n => String(n).padStart(2,'0')
  const monthKey  = `${year}-${pad(month+1)}`
  const prevDate  = new Date(year, month-1, 1)
  const prevKey   = `${prevDate.getFullYear()}-${pad(prevDate.getMonth()+1)}`
  const thisSnaps = (snapshots||[]).filter(s=>s.date?.startsWith(monthKey)).sort((a,b)=>a.date<b.date?-1:1)
  const prevSnaps = (snapshots||[]).filter(s=>s.date?.startsWith(prevKey)).sort((a,b)=>a.date<b.date?-1:1)
  const monthChange = thisSnaps.length>=2 ? thisSnaps[thisSnaps.length-1].total - thisSnaps[0].total : null
  const prevChange  = prevSnaps.length>=2  ? prevSnaps[prevSnaps.length-1].total - prevSnaps[0].total  : null
  const monthName = new Date(year, month, 1).toLocaleDateString('ca-ES', { month:'long', year:'numeric' }).replace(/^./, s => s.toUpperCase())
  const prevMonthName = prevDate.toLocaleDateString('ca-ES', { month:'long' })
  const today = new Date().toLocaleDateString('ca-ES', { day:'2-digit', month:'long', year:'numeric' })

  const dist = [
    { l:'Inversions', v:totalInv, c:'#1a6cf5' },
    { l:'Estalvis',   v:totalSav, c:'#0da65c' },
    { l:'Crypto',     v:totalCry, c:'#e8820c' },
    { l:'Mat. prim.', v:totalCom, c:'#b07d15' },
  ].filter(d => d.v > 0.01)

  const allAssets = [
    ...investments.map(i => {
      const val  = i.totalQty && i.currentPrice ? i.totalQty * i.currentPrice : i.totalCostEur || i.totalCost || 0
      const cost = i.totalCostEur || i.totalCost || 0
      return { n:i.name, ticker:i.ticker||'', val, cost, pg: val - cost, cat:'inv' }
    }),
    ...savings.map(s => ({ n:s.name, ticker:'', val:s.balance||s.amount||0, cost:s.balance||s.amount||0, pg:null, cat:'sav' })),
    ...cryptos.map(c => {
      const val = (c.totalQty||c.qty) && c.currentPrice ? (c.totalQty||c.qty)*c.currentPrice : c.totalCost||0
      return { n:c.name, ticker:c.symbol||'', val, cost:c.totalCost||0, pg: c.totalCost>0 ? val-(c.totalCost||0) : null, cat:'cry' }
    }),
    ...(commodities||[]).map(c => ({ n:c.name, ticker:c.symbol||'', val:c.totalCost||0, cost:c.totalCost||0, pg:null, cat:'com' })),
  ].sort((a,b) => b.val - a.val)

  const eur = n => {
    if (n == null) return '—'
    return new Intl.NumberFormat('ca-ES', { style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2 }).format(n)
  }

  return `<!DOCTYPE html>
<html lang="ca"><head><meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#fff; color:#1a1a1a; font-size:12px; line-height:1.5; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page { padding:48px 52px; max-width:740px; margin:0 auto; }
  .accent-bar { height:3px; background:linear-gradient(90deg,#1a6cf5 0%,#0da65c 50%,#e8820c 100%); }
  .hdr { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:20px; border-bottom:2px solid #1a1a1a; margin-bottom:28px; }
  .hdr-eyebrow { font-size:8px; font-weight:700; color:#999; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:10px; }
  .hdr-month { font-size:36px; font-weight:300; color:#1a1a1a; line-height:1; letter-spacing:-0.5px; }
  .hdr-right { text-align:right; }
  .hdr-total-l { font-size:8px; color:#999; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:6px; }
  .hdr-total-v { font-size:28px; font-weight:600; color:#1a1a1a; letter-spacing:-0.5px; margin-bottom:4px; }
  .hdr-gain { font-size:12px; font-weight:600; letter-spacing:-0.2px; }
  .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border:1px solid #e8e8e8; border-radius:8px; overflow:hidden; margin-bottom:28px; page-break-inside:avoid; }
  .kpi { padding:14px 16px; border-right:1px solid #e8e8e8; background:#fafafa; }
  .kpi:last-child { border-right:none; }
  .kpi-l { font-size:8px; font-weight:700; color:#aaa; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:6px; }
  .kpi-v { font-size:15px; font-weight:600; color:#1a1a1a; letter-spacing:-0.3px; }
  .kpi-sub { font-size:9px; color:#bbb; margin-top:3px; }
  .green { color:#1a7a45; } .red { color:#c0392b; } .grey { color:#777; }
  .section { margin-bottom:26px; }
  .section-title { font-size:8px; font-weight:700; color:#aaa; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #f0f0f0; }
  .dist-row { margin-bottom:10px; page-break-inside:avoid; break-inside:avoid; }
  .dist-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
  .dist-label { display:flex; align-items:center; gap:7px; font-size:11px; font-weight:500; color:#444; }
  .dist-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .dist-val { font-size:11px; color:#888; font-variant-numeric:tabular-nums; }
  .dist-track { height:4px; background:#f0f0f0; border-radius:2px; overflow:hidden; }
  .dist-fill { height:100%; border-radius:2px; }
  /* Taula — mai tallar una fila pel mig */
  table { width:100%; border-collapse:collapse; font-size:11px; }
  thead { display:table-header-group; }
  tbody tr { page-break-inside:avoid; break-inside:avoid; }
  thead tr { border-bottom:1.5px solid #ddd; }
  th { padding:6px 0 8px; font-size:8px; font-weight:700; color:#bbb; letter-spacing:0.10em; text-transform:uppercase; text-align:left; }
  th.r { text-align:right; }
  td { padding:9px 0; border-bottom:1px solid #f5f5f5; color:#444; vertical-align:middle; }
  td.r { text-align:right; font-variant-numeric:tabular-nums; }
  tr:last-child td { border-bottom:none; }
  .td-name { font-weight:600; color:#222; }
  .td-ticker { font-size:9px; color:#bbb; font-family:monospace; margin-top:1px; }
  .footer { display:flex; justify-content:space-between; align-items:center; padding-top:16px; border-top:1px solid #eee; margin-top:8px; page-break-inside:avoid; }
  .footer-logo { font-size:9px; font-weight:800; color:#ccc; letter-spacing:0.18em; text-transform:uppercase; }
  .footer-date { font-size:9px; color:#ccc; }
</style></head><body>
<div class="accent-bar"></div>
<div class="page">
  <div class="hdr">
    <div><div class="hdr-eyebrow">Cartera &middot; Informe mensual</div><div class="hdr-month">${monthName}</div></div>
    <div class="hdr-right">
      <div class="hdr-total-l">Patrimoni total</div>
      <div class="hdr-total-v">${eur(total)}</div>
      <div class="hdr-gain ${gain>=0?'green':'red'}">${gain>=0?'&#9650;':'&#9660;'} ${eur(Math.abs(gain))} (${fmtPct(gainPct)})</div>
    </div>
  </div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-l">Canvi del mes</div><div class="kpi-v ${monthChange===null?'grey':monthChange>=0?'green':'red'}">${monthChange===null?'—':(monthChange>=0?'+':'')+eur(monthChange)}</div></div>
    <div class="kpi"><div class="kpi-l">${prevMonthName} (ant.)</div><div class="kpi-v ${prevChange===null?'grey':prevChange>=0?'green':'red'}">${prevChange===null?'—':(prevChange>=0?'+':'')+eur(prevChange)}</div></div>
    <div class="kpi"><div class="kpi-l">Guany acumulat</div><div class="kpi-v ${gain>=0?'green':'red'}">${gain>=0?'+':''  }${eur(gain)}</div><div class="kpi-sub">${fmtPct(gainPct)} sobre cost</div></div>
    <div class="kpi"><div class="kpi-l">Capital aportat</div><div class="kpi-v grey">${eur(totalCost+totalSav+totalCom)}</div><div class="kpi-sub">${investments.length+savings.length+cryptos.length+(commodities?.length||0)} posicions</div></div>
  </div>
  <div class="section">
    <div class="section-title">Distribució del portfoli</div>
    ${dist.map(d => { const pct = total>0?(d.v/total*100):0; return `<div class="dist-row"><div class="dist-meta"><div class="dist-label"><div class="dist-dot" style="background:${d.c}"></div>${d.l}</div><div class="dist-val">${eur(d.v)} &middot; ${pct.toFixed(1)}%</div></div><div class="dist-track"><div class="dist-fill" style="width:${pct.toFixed(1)}%;background:${d.c}"></div></div></div>` }).join('')}
  </div>
  <div class="section">
    <div class="section-title">Posicions del portfoli</div>
    <table>
      <thead><tr><th>Actiu</th><th class="r">Valor actual</th><th class="r">Cost EUR</th><th class="r">P&amp;G</th><th class="r">P&amp;G %</th><th class="r">Pes</th></tr></thead>
      <tbody>
        ${allAssets.map(a => { const w=total>0?(a.val/total*100):0; const pgPct=a.pg!==null&&a.cost>0?(a.pg/a.cost*100):null; return `<tr><td><div class="td-name">${a.n}</div>${a.ticker?`<div class="td-ticker">${a.ticker}</div>`:''}</td><td class="r">${eur(a.val)}</td><td class="r">${eur(a.cost)}</td><td class="r ${a.pg===null?'grey':a.pg>=0?'green':'red'}">${a.pg===null?'—':(a.pg>=0?'+':'')+eur(a.pg)}</td><td class="r ${pgPct===null?'grey':pgPct>=0?'green':'red'}">${pgPct===null?'—':(pgPct>=0?'+':'')+pgPct.toFixed(2)+'%'}</td><td class="r grey">${w.toFixed(1)}%</td></tr>` }).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer"><div class="footer-logo">Cartera</div><div class="footer-date">Generat el ${today}</div></div>
</div></body></html>`
}

const TYPE_AV = {
  etf:      { bg:'rgba(0,212,255,0.10)',  color:COLORS.neonCyan   },
  stock:    { bg:'rgba(123,97,255,0.10)', color:COLORS.neonPurple },
  crypto:   { bg:'rgba(255,149,0,0.10)',  color:COLORS.neonAmber  },
  estalvi:  { bg:'rgba(0,255,136,0.10)',  color:COLORS.neonGreen  },
  robo:     { bg:'rgba(255,149,0,0.10)',  color:COLORS.neonAmber  },
  commodity:{ bg:'rgba(200,150,26,0.10)', color:'#c8961a'         },
}

export default function MonthlyReport({ investments=[], savings=[], cryptos=[], commodities=[], snapshots=[], userEmail='' }) {
  const [generating, setGenerating] = useState(false)
  const [emailing, setEmailing]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => { const d=new Date(); d.setMonth(d.getMonth()-1); return d.getMonth() })
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear())

  const showToast = (type, msg) => { setToast({type,msg}); setTimeout(()=>setToast(null),5000) }
  const months = Array.from({length:12},(_,i)=>({value:i,label:new Date(2024,i,1).toLocaleDateString('ca-ES',{month:'long'})}))

  const totalInv = investments.reduce((s,i)=>s+(i.totalQty&&i.currentPrice?i.totalQty*i.currentPrice:i.totalCostEur||i.totalCost||0),0)
  const totalSav = savings.reduce((s,sv)=>s+(sv.balance||sv.amount||0),0)
  const totalCry = cryptos.reduce((s,c)=>s+((c.totalQty||c.qty)&&c.currentPrice?(c.totalQty||c.qty)*c.currentPrice:c.totalCost||0),0)
  const totalCom = (commodities||[]).reduce((s,c)=>s+(c.totalCost||0),0)
  const total    = totalInv+totalSav+totalCry+totalCom
  const totalCostInv = investments.reduce((s,i)=>s+(i.totalCostEur||i.totalCost||0),0)
  const totalCostCry = cryptos.reduce((s,c)=>s+(c.totalCost||0),0)
  const totalCost    = totalCostInv+totalCostCry
  const gain         = totalInv+totalCry-totalCostInv-totalCostCry
  const gainPct      = totalCost>0?(gain/totalCost)*100:0

  const pad = n => String(n).padStart(2,'0')
  const monthKey  = `${selectedYear}-${pad(selectedMonth+1)}`
  const prevDate  = new Date(selectedYear,selectedMonth-1,1)
  const prevKey   = `${prevDate.getFullYear()}-${pad(prevDate.getMonth()+1)}`
  const thisSnaps = snapshots.filter(s=>s.date?.startsWith(monthKey)).sort((a,b)=>a.date<b.date?-1:1)
  const prevSnaps = snapshots.filter(s=>s.date?.startsWith(prevKey)).sort((a,b)=>a.date<b.date?-1:1)
  const monthChange    = thisSnaps.length>=2?thisSnaps[thisSnaps.length-1].total-thisSnaps[0].total:null
  const monthChangePct = thisSnaps[0]?.total>0&&monthChange!=null?(monthChange/thisSnaps[0].total)*100:null
  const prevChange     = prevSnaps.length>=2?prevSnaps[prevSnaps.length-1].total-prevSnaps[0].total:null
  const prevChangePct  = prevSnaps[0]?.total>0&&prevChange!=null?(prevChange/prevSnaps[0].total)*100:null
  const prevMonthName  = prevDate.toLocaleDateString('ca-ES',{month:'long'})

  const topPositions = useMemo(()=>[
    ...investments.map(i=>({name:i.name,val:i.totalQty&&i.currentPrice?i.totalQty*i.currentPrice:i.totalCostEur||i.totalCost||0,type:i.type})),
    ...savings.map(s=>({name:s.name,val:s.balance||s.amount||0,type:'estalvi'})),
    ...cryptos.map(c=>({name:c.name,val:(c.totalQty||c.qty)&&c.currentPrice?(c.totalQty||c.qty)*c.currentPrice:c.totalCost||0,type:'crypto'})),
    ...(commodities||[]).map(c=>({name:c.name,val:c.totalCost||0,type:'commodity'})),
  ].sort((a,b)=>b.val-a.val).slice(0,5),[investments,savings,cryptos,commodities])

  const dist = [
    {label:'Inversions',val:totalInv,color:COLORS.neonCyan},
    {label:'Estalvis',  val:totalSav,color:COLORS.neonGreen},
    {label:'Crypto',    val:totalCry,color:COLORS.neonAmber},
    {label:'Mat. prim.',val:totalCom,color:'#c8961a'},
  ].filter(d=>d.val>0.01)

  const monthLabel = () => new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long',year:'numeric'}).replace(/\s/g,'_')

  // ── getPdfBlob: renderitza per pàgines detectant elements tallats ─────────
  const getPdfBlob = async () => {
    const [{default:jsPDF},{default:html2canvas}] = await Promise.all([import('jspdf'),import('html2canvas')])
    const A4_W = 794  // px a 96dpi

    const host = document.createElement('div')
    host.style.cssText = `position:fixed;left:-9999px;top:0;width:${A4_W}px;background:white;`
    host.innerHTML = buildPdfHtml({month:selectedMonth,year:selectedYear,investments,savings,cryptos,commodities,snapshots})
    document.body.appendChild(host)
    await new Promise(r => setTimeout(r, 400))

    const pdf     = new jsPDF({orientation:'portrait',unit:'px',format:'a4'})
    const pdfW    = pdf.internal.pageSize.getWidth()
    const pdfH    = pdf.internal.pageSize.getHeight()
    const scale   = pdfW / A4_W
    const pageHpx = Math.floor(pdfH / scale)  // alçada pàgina en px HTML

    const totalH   = host.scrollHeight
    const hostRect = host.getBoundingClientRect()
    const noBreak  = Array.from(host.querySelectorAll('tr, .dist-row, .kpi, .hdr, .kpi-grid, .footer'))

    // Calcula punts de tall segurs (just abans de cada element tallat)
    const safeBreaks = [0]
    let nextCut = pageHpx
    while (nextCut < totalH) {
      let bestCut = nextCut
      for (const el of noBreak) {
        const r     = el.getBoundingClientRect()
        const elTop = r.top - hostRect.top
        const elBot = elTop + r.height
        if (elTop < nextCut && elBot > nextCut + 2) {
          bestCut = Math.max(elTop - 6, safeBreaks[safeBreaks.length-1] + 60)
          break
        }
      }
      safeBreaks.push(bestCut)
      nextCut = bestCut + pageHpx
    }
    safeBreaks.push(totalH)

    // Renderitza cada franja com a canvas independent
    for (let i = 0; i < safeBreaks.length - 1; i++) {
      const yStart = safeBreaks[i]
      const sliceH = Math.min(safeBreaks[i+1] - yStart, pageHpx)
      if (sliceH < 10) continue
      if (i > 0) pdf.addPage()

      const wrap = document.createElement('div')
      wrap.style.cssText = `position:fixed;left:-9999px;top:0;width:${A4_W}px;height:${sliceH}px;overflow:hidden;background:white;`
      const clone = host.cloneNode(true)
      clone.style.cssText = `width:${A4_W}px;background:white;transform:translateY(-${yStart}px);transform-origin:top left;`
      wrap.appendChild(clone)
      document.body.appendChild(wrap)
      await new Promise(r => setTimeout(r, 30))

      const canvas = await html2canvas(wrap, { scale:2, useCORS:true, backgroundColor:'#ffffff', logging:false, width:A4_W, height:sliceH })
      document.body.removeChild(wrap)
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceH * scale)
    }

    document.body.removeChild(host)
    return pdf
  }

  const handleDownload = async () => {
    setGenerating(true)
    try { const p=await getPdfBlob(); p.save(`cartera-${monthLabel()}.pdf`); showToast('ok','PDF descarregat correctament ✓') }
    catch(err) { console.error(err); showToast('err','Error generant el PDF.') }
    setGenerating(false)
  }

  const handleEmail = async () => {
    setEmailing(true)
    try {
      const p=await getPdfBlob(); p.save(`cartera-${monthLabel()}.pdf`)
      const sub = encodeURIComponent(`Informe Cartera · ${new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long',year:'numeric'})}`)
      const bod = encodeURIComponent("Hola,\n\nAdjunt l'informe mensual del teu portfoli Cartera.\n\nGenerat per Cartera.")
      window.location.href = `mailto:${userEmail||''}?subject=${sub}&body=${bod}`
      showToast('ok',"PDF descarregat. Adjunta'l al correu.")
    } catch(err) { console.error(err); showToast('err',"Error preparant l'email.") }
    setEmailing(false)
  }

  return (
    <div className="mr">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <div className="mr-hero">
        <p className="mr-hero-label">Informe mensual PDF</p>
        <p className="mr-hero-title">Resum del portfoli</p>
        <p className="mr-hero-sub">Descarrega l'informe en format PDF per guardar o compartir</p>
        <div className="mr-hero-metrics">
          <div><p className="mr-hero-m-l">Patrimoni total</p><p className="mr-hero-m-v">{fmtEur(total)}</p></div>
          <div><p className="mr-hero-m-l">Guany acumulat</p><p className={`mr-hero-m-v ${gain>=0?'g':'r'}`}>{gain>=0?'+':''}{fmtEur(gain)}</p></div>
          <div><p className="mr-hero-m-l">Posicions</p><p className="mr-hero-m-v p">{investments.length+savings.length+cryptos.length+(commodities?.length||0)}</p></div>
        </div>
      </div>
      <div className="mr-panel">
        <p className="mr-panel-title">Selecciona el mes de l'informe</p>
        <div className="mr-sel-row">
          <div className="mr-sel-group">
            <span className="mr-sel-lbl">Mes</span>
            <select className="mr-sel" value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))}>
              {months.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="mr-sel-group">
            <span className="mr-sel-lbl">Any</span>
            <select className="mr-sel" value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))}>
              {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="mr-panel">
        <p className="mr-panel-title">Previsualització del contingut</p>
        <div className="mr-preview">
          <div className="mr-preview-hdr">
            <span className="mr-preview-name">Cartera · Informe mensual</span>
            <span className="mr-preview-date">{new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long',year:'numeric'})}</span>
          </div>
          <div className="mr-preview-body">
            <div className="mr-kpi-grid">
              <div className="mr-kpi"><p className="mr-kpi-l">Patrimoni total</p><p className="mr-kpi-v">{fmtEur(total)}</p><p className="mr-kpi-sub">{investments.length+savings.length+cryptos.length+(commodities?.length||0)} posicions</p></div>
              <div className="mr-kpi"><p className="mr-kpi-l">Guany acumulat</p><p className={`mr-kpi-v ${gain>=0?'g':'r'}`}>{gain>=0?'+':''}{fmtEur(gain)}</p><p className="mr-kpi-sub">{fmtPct(gainPct)} sobre cost EUR</p></div>
            </div>
            <div>
              <p className="mr-sec-l">Evolució mensual</p>
              <div className="mr-evo-grid">
                <div className="mr-evo-card">
                  <p className="mr-evo-l">{new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long'})}</p>
                  <p className="mr-evo-v" style={{color:monthChange!=null?(monthChange>=0?COLORS.neonGreen:COLORS.neonRed):'rgba(255,255,255,0.25)'}}>{monthChange!=null?(monthChange>=0?'+':'')+fmtEur(monthChange):'—'}</p>
                  <p className="mr-evo-sub">{monthChangePct!=null?fmtPct(Math.abs(monthChangePct)):'sense snapshots'}</p>
                </div>
                <div className="mr-evo-card">
                  <p className="mr-evo-l">{prevMonthName}</p>
                  <p className="mr-evo-v" style={{color:prevChange!=null?(prevChange>=0?COLORS.neonGreen:COLORS.neonRed):'rgba(255,255,255,0.20)'}}>{prevChange!=null?(prevChange>=0?'+':'')+fmtEur(prevChange):'—'}</p>
                  <p className="mr-evo-sub">{prevChangePct!=null?fmtPct(Math.abs(prevChangePct)):'sense dades'}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="mr-sec-l">Distribució</p>
              <div className="mr-dist">
                {dist.map(d=>{ const pct=total>0?(d.val/total*100):0; return (<div key={d.label} className="mr-dist-row"><div className="mr-dist-meta"><div className="mr-dist-name"><div className="mr-dist-dot" style={{background:d.color}}/>{d.label}</div><span className="mr-dist-val">{fmtEur(d.val)} · {pct.toFixed(1)}%</span></div><div className="mr-track"><div className="mr-fill" style={{width:`${pct}%`,background:d.color,opacity:0.7}}/></div></div>) })}
              </div>
            </div>
            <div>
              <p className="mr-sec-l">Top posicions</p>
              {topPositions.map((p,i)=>{ const tc=TYPE_AV[p.type]||TYPE_AV.etf; return (<div key={i} className="mr-pos-row"><div className="mr-pos-av" style={{background:tc.bg,color:tc.color}}>{p.name.slice(0,2).toUpperCase()}</div><span className="mr-pos-name">{p.name}</span><span className="mr-pos-val">{fmtEur(p.val)}</span></div>) })}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className={`mr-toast ${toast.type}`}>{toast.msg}</div>}
      <div className="mr-actions">
        <button className="mr-btn-dl" onClick={handleDownload} disabled={generating||emailing}>
          {generating?<><div className="mr-spin"/>Generant PDF...</>:<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Descarregar PDF</>}
        </button>
        <button className="mr-btn-email" onClick={handleEmail} disabled={generating||emailing}>
          {emailing?<><div className="mr-spin"/>Preparant...</>:<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Enviar email</>}
        </button>
      </div>
      <p className="mr-note">Requereix: <code style={{fontFamily:FONTS.mono,fontSize:10}}>npm install jspdf html2canvas</code></p>
      <div style={{height:16}}/>
    </div>
  )
}