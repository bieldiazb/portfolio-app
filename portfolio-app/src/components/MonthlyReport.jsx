import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'


function fmtPct(n) { return `${Math.abs(n).toFixed(2)}%` }

const styles = `
  .mr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .mr-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .mr-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(123,97,255,0.07) 0%,transparent 70%); pointer-events:none; }
  .mr-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .mr-hero-title { font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; font-family:${FONTS.num}; line-height:1; margin-bottom:6px; }
  .mr-hero-sub { font-size:12px; color:rgba(255,255,255,0.28); margin-bottom:16px; }
  .mr-hero-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.05); }
  .mr-hero-m-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .mr-hero-m-v { font-size:16px; font-weight:300; color:#fff; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .mr-hero-m-v.g { color:${COLORS.neonGreen}; }
  .mr-hero-m-v.r { color:${COLORS.neonRed}; }
  .mr-hero-m-v.p { color:${COLORS.neonPurple}; }

  /* ── Panel ── */
  .mr-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .mr-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:14px; }

  /* Selectors mes/any */
  .mr-sel-row { display:flex; gap:10px; }
  .mr-sel-group { display:flex; flex-direction:column; gap:6px; flex:1; }
  .mr-sel-lbl { font-size:9px; font-weight:600; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.12em; }
  .mr-sel { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 13px; font-family:${FONTS.sans}; font-size:15px; color:#fff; outline:none; cursor:pointer; -webkit-appearance:none; transition:border-color 100ms; }
  .mr-sel:focus { border-color:rgba(123,97,255,0.35); }
  .mr-sel option { background:#1a1a1a; }

  /* Preview card */
  .mr-preview { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }
  .mr-preview-hdr { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.05); }
  .mr-preview-name { font-size:12px; font-weight:600; color:rgba(255,255,255,0.55); letter-spacing:-0.2px; }
  .mr-preview-date { font-size:10px; color:rgba(255,255,255,0.25); font-family:${FONTS.num}; text-transform:capitalize; }
  .mr-preview-body { padding:14px; display:flex; flex-direction:column; gap:14px; }

  /* KPI pair */
  .mr-kpi-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .mr-kpi { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; }
  .mr-kpi-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .mr-kpi-v { font-size:16px; font-weight:300; font-family:${FONTS.num}; color:#fff; font-variant-numeric:tabular-nums; }
  .mr-kpi-v.g { color:${COLORS.neonGreen}; }
  .mr-kpi-v.r { color:${COLORS.neonRed}; }
  .mr-kpi-sub { font-size:10px; color:rgba(255,255,255,0.22); margin-top:2px; font-family:${FONTS.num}; }

  /* Evolució duo */
  .mr-evo-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .mr-evo-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:12px; }
  .mr-evo-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; text-transform:capitalize; }
  .mr-evo-v { font-size:16px; font-weight:300; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .mr-evo-sub { font-size:10px; color:rgba(255,255,255,0.20); font-family:${FONTS.num}; }

  /* Distribució */
  .mr-dist { display:flex; flex-direction:column; gap:10px; }
  .mr-dist-row { }
  .mr-dist-meta { display:flex; justify-content:space-between; margin-bottom:5px; }
  .mr-dist-name { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,0.55); }
  .mr-dist-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .mr-dist-val { font-size:11px; color:rgba(255,255,255,0.28); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .mr-track { height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
  .mr-fill { height:100%; border-radius:2px; }

  /* Posicions */
  .mr-pos-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .mr-pos-row:last-child { border-bottom:none; }
  .mr-pos-av { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .mr-pos-name { flex:1; font-size:12px; font-weight:500; color:rgba(255,255,255,0.60); min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mr-pos-val { font-size:12px; font-family:${FONTS.num}; color:rgba(255,255,255,0.55); font-variant-numeric:tabular-nums; }

  /* Secció label interna */
  .mr-sec-l { font-size:9px; font-weight:600; color:rgba(255,255,255,0.22); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:10px; }

  /* Actions */
  .mr-actions { display:flex; gap:8px; }
  .mr-btn-dl {
    flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
    padding:14px; background:${COLORS.neonPurple}; border:none; border-radius:10px;
    font-family:${FONTS.sans}; font-size:14px; font-weight:700; color:#fff;
    cursor:pointer; transition:opacity 100ms;
  }
  .mr-btn-dl:hover { opacity:0.85; }
  .mr-btn-dl:disabled { opacity:0.35; cursor:not-allowed; }
  .mr-btn-email {
    flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
    padding:14px; background:transparent; border:1px solid rgba(255,255,255,0.09); border-radius:10px;
    font-family:${FONTS.sans}; font-size:14px; font-weight:600; color:rgba(255,255,255,0.45);
    cursor:pointer; transition:all 100ms;
  }
  .mr-btn-email:hover { border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.75); }
  .mr-btn-email:disabled { opacity:0.35; cursor:not-allowed; }

  .mr-spin { width:14px; height:14px; border:1.5px solid rgba(255,255,255,0.20); border-top-color:#fff; border-radius:50%; animation:mrspin .7s linear infinite; flex-shrink:0; }
  @keyframes mrspin { to { transform:rotate(360deg); } }

  .mr-note { font-size:11px; color:rgba(255,255,255,0.18); text-align:center; }
  .mr-toast { padding:12px 16px; border-radius:10px; font-size:12px; font-weight:500; text-align:center; }
  .mr-toast.ok  { background:rgba(0,255,136,0.07); border:1px solid rgba(0,255,136,0.20); color:${COLORS.neonGreen}; }
  .mr-toast.err { background:rgba(255,59,59,0.07); border:1px solid rgba(255,59,59,0.18); color:${COLORS.neonRed}; }
`

// ── Builder HTML per al PDF ───────────────────────────────────────────────────
function buildPdfHtml({ month, year, investments, savings, cryptos, commodities, snapshots }) {
  const totalInv = investments.reduce((s,i)=>s+(i.qty&&i.currentPrice?i.qty*i.currentPrice:i.initialValue||0),0)
  const totalSav = savings.reduce((s,sv)=>s+sv.amount,0)
  const totalCry = cryptos.reduce((s,c)=>s+((c.totalQty||c.qty)&&c.currentPrice?(c.totalQty||c.qty)*c.currentPrice:c.totalCost||0),0)
  const totalCom = (commodities||[]).reduce((s,c)=>s+(c.totalCost||0),0)
  const total    = totalInv+totalSav+totalCry+totalCom
  const totalCost= investments.reduce((s,i)=>s+(i.initialValue||i.totalCost||0),0)+cryptos.reduce((s,c)=>s+(c.totalCost||0),0)
  const gain     = total-totalCost-totalSav-totalCom
  const gainPct  = totalCost>0?(gain/totalCost)*100:0

  const pad = n => String(n).padStart(2,'0')
  const monthKey = `${year}-${pad(month+1)}`
  const prevDate = new Date(year,month-1,1)
  const prevKey  = `${prevDate.getFullYear()}-${pad(prevDate.getMonth()+1)}`
  const thisSnaps = (snapshots||[]).filter(s=>s.date?.startsWith(monthKey)).sort((a,b)=>a.date<b.date?-1:1)
  const prevSnaps = (snapshots||[]).filter(s=>s.date?.startsWith(prevKey)).sort((a,b)=>a.date<b.date?-1:1)
  const monthChange = thisSnaps.length>=2?thisSnaps[thisSnaps.length-1].total-thisSnaps[0].total:0
  const prevChange  = prevSnaps.length>=2?prevSnaps[prevSnaps.length-1].total-prevSnaps[0].total:null
  const monthName   = new Date(year,month,1).toLocaleDateString('ca-ES',{month:'long',year:'numeric'})
  const prevMonthName = prevDate.toLocaleDateString('ca-ES',{month:'long'})

  const dist = [
    {l:'Inversions',v:totalInv,c:'#00d4ff'},
    {l:'Estalvis',  v:totalSav,c:'#00ff88'},
    {l:'Crypto',    v:totalCry,c:'#ff9500'},
    {l:'Mat. prim.',v:totalCom,c:'#c8961a'},
  ].filter(d=>d.v>0)

  const allAssets = [
    ...investments.map(i=>({n:i.name,v:i.qty&&i.currentPrice?i.qty*i.currentPrice:i.initialValue||0,pg:(i.qty&&i.currentPrice?i.qty*i.currentPrice:i.initialValue||0)-(i.initialValue||0)})),
    ...savings.map(s=>({n:s.name,v:s.amount,pg:null})),
    ...cryptos.map(c=>({n:c.name,v:(c.totalQty||c.qty)&&c.currentPrice?(c.totalQty||c.qty)*c.currentPrice:c.totalCost||0,pg:null})),
  ].sort((a,b)=>b.v-a.v).slice(0,10)

  const today = new Date().toLocaleDateString('ca-ES',{day:'2-digit',month:'long',year:'numeric'})

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fff;color:#111;padding:40px 44px;max-width:700px;margin:0 auto;font-size:13px;}
    .hdr{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:18px;border-bottom:2px solid #111;margin-bottom:24px;}
    .hdr-left{}
    .hdr-eyebrow{font-size:9px;font-weight:700;color:#aaa;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:8px;}
    .hdr-title{font-size:28px;font-weight:300;letter-spacing:-1px;text-transform:capitalize;}
    .hdr-right{text-align:right;}
    .hdr-total-l{font-size:9px;color:#bbb;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:5px;}
    .hdr-total-v{font-size:24px;font-weight:300;letter-spacing:-0.6px;}
    .hdr-gain{font-size:11px;margin-top:4px;font-weight:600;}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:22px;}
    .kpi{padding:11px 13px;background:#f9f9f9;border-radius:6px;border:1px solid #eee;}
    .kpi-l{font-size:9px;color:#bbb;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:5px;}
    .kpi-v{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;}
    .kpi-sub{font-size:9px;color:#ccc;margin-top:2px;}
    .sec-l{font-size:9px;font-weight:700;color:#aaa;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;}
    .dist-row{margin-bottom:8px;}
    .dist-meta{display:flex;justify-content:space-between;margin-bottom:3px;font-size:11px;}
    .dist-name{display:flex;align-items:center;gap:5px;color:#555;}
    .dist-dot{width:7px;height:7px;border-radius:50%;display:inline-block;}
    .dist-val{color:#999;}
    .track{height:4px;background:#eee;border-radius:2px;overflow:hidden;}
    .fill{height:100%;border-radius:2px;}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:22px;}
    thead tr{border-bottom:1.5px solid #ddd;}
    th{text-align:left;padding:5px 0;font-weight:700;color:#bbb;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;}
    th:not(:first-child){text-align:right;}
    td{padding:8px 0;border-bottom:1px solid #f5f5f5;vertical-align:middle;}
    td:not(:first-child){text-align:right;font-variant-numeric:tabular-nums;color:#555;}
    .td-name{font-weight:600;color:#333;}
    .footer{display:flex;justify-content:space-between;padding-top:14px;border-top:1px solid #eee;font-size:9px;color:#ccc;font-weight:700;letter-spacing:0.10em;}
    section{margin-bottom:22px;}
  </style></head><body>
    <div class="hdr">
      <div class="hdr-left">
        <div class="hdr-eyebrow">Cartera · Informe mensual</div>
        <div class="hdr-title">${monthName}</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-total-l">Patrimoni total</div>
        <div class="hdr-total-v">${fmtEur(total)}</div>
        <div class="hdr-gain" style="color:${gain>=0?'#2a8a4e':'#c0392b'}">${gain>=0?'▲':'▼'} ${fmtEur(Math.abs(gain))} (${fmtPct(gainPct)})</div>
      </div>
    </div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-l">Canvi del mes</div><div class="kpi-v" style="color:${monthChange>=0?'#2a8a4e':'#c0392b'}">${monthChange>=0?'+':''}${fmtEur(monthChange)}</div></div>
      <div class="kpi"><div class="kpi-l">${prevMonthName} (ant.)</div><div class="kpi-v" style="color:${prevChange!==null?(prevChange>=0?'#2a8a4e':'#c0392b'):'#999'}">${prevChange!==null?(prevChange>=0?'+':'')+''+fmtEur(prevChange):'—'}</div></div>
      <div class="kpi"><div class="kpi-l">Guany acumulat</div><div class="kpi-v" style="color:${gain>=0?'#2a8a4e':'#c0392b'}">${gain>=0?'+':''}${fmtEur(gain)}</div><div class="kpi-sub">${fmtPct(gainPct)} sobre cost</div></div>
      <div class="kpi"><div class="kpi-l">Capital aportat</div><div class="kpi-v" style="color:#555;">${fmtEur(totalCost)}</div><div class="kpi-sub">${investments.length+savings.length+cryptos.length} posicions</div></div>
    </div>
    <section><div class="sec-l">Distribució del portfoli</div>${dist.map(d=>{const pct=total>0?(d.v/total*100):0;return`<div class="dist-row"><div class="dist-meta"><span class="dist-name"><span class="dist-dot" style="background:${d.c}"></span>${d.l}</span><span class="dist-val">${fmtEur(d.v)} · ${pct.toFixed(1)}%</span></div><div class="track"><div class="fill" style="width:${pct}%;background:${d.c}"></div></div></div>`}).join('')}</section>
    <section><div class="sec-l">Posicions del portfoli</div>
    <table><thead><tr><th>Actiu</th><th>Valor</th><th>P&amp;G</th><th>Pes</th></tr></thead><tbody>${allAssets.map(a=>{const w=total>0?(a.v/total*100):0;const cost=a.v-a.pg;const pgPct=a.pg!==null&&cost>0?(a.pg/cost)*100:null;return`<tr><td class="td-name">${a.n}</td><td>${fmtEur(a.v)}</td><td style="color:${a.pg===null?'#ccc':a.pg>=0?'#2a8a4e':'#c0392b'}">${a.pg===null?'—':(a.pg>=0?'+':'')+fmtEur(a.pg)}</td><td>${w.toFixed(1)}%</td></tr>`}).join('')}</tbody></table></section>
    <div class="footer"><div>CARTERA</div><div>Generat el ${today}</div></div>
  </body></html>`
}

const TYPE_AV = {
  etf:     { bg:'rgba(0,212,255,0.10)',   color:COLORS.neonCyan   },
  stock:   { bg:'rgba(123,97,255,0.10)',  color:COLORS.neonPurple },
  crypto:  { bg:'rgba(255,149,0,0.10)',   color:COLORS.neonAmber  },
  estalvi: { bg:'rgba(0,255,136,0.10)',   color:COLORS.neonGreen  },
  robo:    { bg:'rgba(255,149,0,0.10)',   color:COLORS.neonAmber  },
}

export default function MonthlyReport({ investments=[], savings=[], cryptos=[], commodities=[], snapshots=[], userEmail='' }) {
  const [generating, setGenerating] = useState(false)
  const [emailing, setEmailing]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => { const d=new Date(); d.setMonth(d.getMonth()-1); return d.getMonth() })
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear())

  const showToast = (type, msg) => { setToast({type,msg}); setTimeout(()=>setToast(null),5000) }
  const months = Array.from({length:12},(_,i)=>({value:i,label:new Date(2024,i,1).toLocaleDateString('ca-ES',{month:'long'})}))

  // Càlculs del mes seleccionat
  const totalInv = investments.reduce((s,i)=>s+(i.qty&&i.currentPrice?i.qty*i.currentPrice:i.initialValue||0),0)
  const totalSav = savings.reduce((s,sv)=>s+sv.amount,0)
  const totalCry = cryptos.reduce((s,c)=>s+((c.totalQty||c.qty)&&c.currentPrice?(c.totalQty||c.qty)*c.currentPrice:c.totalCost||0),0)
  const totalCom = (commodities||[]).reduce((s,c)=>s+(c.totalCost||0),0)
  const total    = totalInv+totalSav+totalCry+totalCom
  const totalCost= investments.reduce((s,i)=>s+(i.initialValue||i.totalCost||0),0)+cryptos.reduce((s,c)=>s+(c.totalCost||0),0)
  const gain     = total-totalCost-totalSav-totalCom
  const gainPct  = totalCost>0?(gain/totalCost)*100:0

  const pad = n => String(n).padStart(2,'0')
  const monthKey  = `${selectedYear}-${pad(selectedMonth+1)}`
  const prevDate  = new Date(selectedYear,selectedMonth-1,1)
  const prevKey   = `${prevDate.getFullYear()}-${pad(prevDate.getMonth()+1)}`
  const thisSnaps = snapshots.filter(s=>s.date?.startsWith(monthKey)).sort((a,b)=>a.date<b.date?-1:1)
  const prevSnaps = snapshots.filter(s=>s.date?.startsWith(prevKey)).sort((a,b)=>a.date<b.date?-1:1)
  const monthChange    = thisSnaps.length>=2?thisSnaps[thisSnaps.length-1].total-thisSnaps[0].total:0
  const monthChangePct = thisSnaps[0]?.total>0?(monthChange/thisSnaps[0].total)*100:0
  const prevChange     = prevSnaps.length>=2?prevSnaps[prevSnaps.length-1].total-prevSnaps[0].total:null
  const prevChangePct  = prevSnaps[0]?.total>0&&prevChange!==null?(prevChange/prevSnaps[0].total)*100:null
  const prevMonthName  = prevDate.toLocaleDateString('ca-ES',{month:'long'})

  const topPositions = useMemo(()=>[
    ...investments.map(i=>({name:i.name,val:i.qty&&i.currentPrice?i.qty*i.currentPrice:i.initialValue||0,type:i.type})),
    ...savings.map(s=>({name:s.name,val:s.amount,type:'estalvi'})),
    ...cryptos.map(c=>({name:c.name,val:(c.totalQty||c.qty)&&c.currentPrice?(c.totalQty||c.qty)*c.currentPrice:c.totalCost||0,type:'crypto'})),
  ].sort((a,b)=>b.val-a.val).slice(0,5),[investments,savings,cryptos])

  const dist = [
    {label:'Inversions',val:totalInv,color:COLORS.neonCyan},
    {label:'Estalvis',  val:totalSav,color:COLORS.neonGreen},
    {label:'Crypto',    val:totalCry,color:COLORS.neonAmber},
    {label:'Mat. prim.',val:totalCom,color:'#c8961a'},
  ].filter(d=>d.val>0)

  const monthLabel = () => new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long',year:'numeric'}).replace(' ','_')

  const getPdfBlob = async () => {
    const [{default:jsPDF},{default:html2canvas}] = await Promise.all([import('jspdf'),import('html2canvas')])
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;background:white;'
    container.innerHTML = buildPdfHtml({month:selectedMonth,year:selectedYear,investments,savings,cryptos,commodities,snapshots})
    document.body.appendChild(container)
    const canvas = await html2canvas(container,{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false,width:700})
    document.body.removeChild(container)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({orientation:'portrait',unit:'px',format:'a4'})
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = (canvas.height*pdfW)/canvas.width
    const pageH = pdf.internal.pageSize.getHeight()
    let yOff = 0
    while (yOff<pdfH) { if(yOff>0)pdf.addPage(); pdf.addImage(imgData,'PNG',0,-yOff,pdfW,pdfH); yOff+=pageH }
    return pdf
  }

  const handleDownload = async () => {
    setGenerating(true)
    try { const p=await getPdfBlob(); p.save(`cartera-${monthLabel()}.pdf`); showToast('ok','PDF descarregat correctament ✓') }
    catch(err) { console.error(err); showToast('err','Error generant el PDF. Comprova jspdf i html2canvas.') }
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

      {/* ── Hero ── */}
      <div className="mr-hero">
        <p className="mr-hero-label">Informe mensual PDF</p>
        <p className="mr-hero-title">Resum del portfoli</p>
        <p className="mr-hero-sub">Descarrega l'informe en format PDF per guardar o compartir</p>
        <div className="mr-hero-metrics">
          <div>
            <p className="mr-hero-m-l">Patrimoni total</p>
            <p className="mr-hero-m-v">{fmtEur(total)}</p>
          </div>
          <div>
            <p className="mr-hero-m-l">Guany acumulat</p>
            <p className={`mr-hero-m-v ${gain>=0?'g':'r'}`}>{gain>=0?'+':''}{fmtEur(gain)}</p>
          </div>
          <div>
            <p className="mr-hero-m-l">Posicions</p>
            <p className="mr-hero-m-v p">{investments.length+savings.length+cryptos.length}</p>
          </div>
        </div>
      </div>

      {/* ── Selector de mes ── */}
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

      {/* ── Preview ── */}
      <div className="mr-panel">
        <p className="mr-panel-title">Previsualització del contingut</p>
        <div className="mr-preview">
          <div className="mr-preview-hdr">
            <span className="mr-preview-name">Cartera · Informe mensual</span>
            <span className="mr-preview-date">{new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long',year:'numeric'})}</span>
          </div>
          <div className="mr-preview-body">

            {/* KPIs */}
            <div className="mr-kpi-grid">
              <div className="mr-kpi">
                <p className="mr-kpi-l">Patrimoni total</p>
                <p className="mr-kpi-v">{fmtEur(total)}</p>
                <p className="mr-kpi-sub">{investments.length+savings.length+cryptos.length} posicions</p>
              </div>
              <div className="mr-kpi">
                <p className="mr-kpi-l">Guany acumulat</p>
                <p className={`mr-kpi-v ${gain>=0?'g':'r'}`}>{gain>=0?'+':''}{fmtEur(gain)}</p>
                <p className="mr-kpi-sub">{fmtPct(gainPct)} sobre cost</p>
              </div>
            </div>

            {/* Evolució mensual */}
            <div>
              <p className="mr-sec-l">Evolució mensual</p>
              <div className="mr-evo-grid">
                <div className="mr-evo-card">
                  <p className="mr-evo-l">{new Date(selectedYear,selectedMonth,1).toLocaleDateString('ca-ES',{month:'long'})}</p>
                  <p className="mr-evo-v" style={{color:monthChange>=0?COLORS.neonGreen:COLORS.neonRed}}>
                    {monthChange>=0?'+':''}{fmtEur(monthChange)}
                  </p>
                  <p className="mr-evo-sub">{monthChange!==0?fmtPct(Math.abs(monthChangePct)):'sense snapshots'}</p>
                </div>
                <div className="mr-evo-card">
                  <p className="mr-evo-l">{prevMonthName}</p>
                  <p className="mr-evo-v" style={{color:prevChange!==null?(prevChange>=0?COLORS.neonGreen:COLORS.neonRed):'rgba(255,255,255,0.20)'}}>
                    {prevChange!==null?(prevChange>=0?'+':'')+fmtEur(prevChange):'—'}
                  </p>
                  <p className="mr-evo-sub">{prevChangePct!==null?fmtPct(Math.abs(prevChangePct)):'sense dades'}</p>
                </div>
              </div>
            </div>

            {/* Distribució */}
            <div>
              <p className="mr-sec-l">Distribució</p>
              <div className="mr-dist">
                {dist.map(d=>{
                  const pct=total>0?(d.val/total*100):0
                  return (
                    <div key={d.label} className="mr-dist-row">
                      <div className="mr-dist-meta">
                        <div className="mr-dist-name">
                          <div className="mr-dist-dot" style={{background:d.color}}/>
                          {d.label}
                        </div>
                        <span className="mr-dist-val">{fmtEur(d.val)} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="mr-track"><div className="mr-fill" style={{width:`${pct}%`,background:d.color,opacity:0.7}}/></div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top posicions */}
            <div>
              <p className="mr-sec-l">Top posicions</p>
              {topPositions.map((p,i)=>{
                const tc = TYPE_AV[p.type]||TYPE_AV.etf
                return (
                  <div key={i} className="mr-pos-row">
                    <div className="mr-pos-av" style={{background:tc.bg,color:tc.color}}>{p.name.slice(0,2).toUpperCase()}</div>
                    <span className="mr-pos-name">{p.name}</span>
                    <span className="mr-pos-val">{fmtEur(p.val)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={`mr-toast ${toast.type}`}>{toast.msg}</div>}

      {/* Accions */}
      <div className="mr-actions">
        <button className="mr-btn-dl" onClick={handleDownload} disabled={generating||emailing}>
          {generating ? (
            <><div className="mr-spin"/>Generant PDF...</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Descarregar PDF</>
          )}
        </button>
        <button className="mr-btn-email" onClick={handleEmail} disabled={generating||emailing}>
          {emailing ? (
            <><div className="mr-spin"/>Preparant...</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Enviar email</>
          )}
        </button>
      </div>

      <p className="mr-note">Requereix: <code style={{fontFamily:`${FONTS.mono}`,fontSize:10}}>npm install jspdf html2canvas</code></p>
      <div style={{height:16}}/>
    </div>
  )
}