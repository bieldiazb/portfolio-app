import { useState, useMemo } from 'react'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const styles = `
  .mr { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }
  .mr-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .mr-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); margin-bottom: 14px; }

  .mr-sel-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .mr-sel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 8px 11px; font-family: 'Geist', sans-serif; font-size: 16px; color: rgba(255,255,255,0.75); outline: none; cursor: pointer; touch-action: manipulation; }
  .mr-sel option { background: #111; }

  .mr-prev { border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; }
  .mr-prev-hdr { background: rgba(255,255,255,0.04); padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
  .mr-prev-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.72); letter-spacing: -0.2px; }
  .mr-prev-date { font-size: 10px; color: rgba(255,255,255,0.28); font-family: 'Geist Mono', monospace; text-transform: capitalize; }
  .mr-prev-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

  .mr-kpis { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
  .mr-kpi { padding: 11px 13px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; background: rgba(255,255,255,0.02); }
  .mr-kpi-l { font-size: 10px; color: rgba(255,255,255,0.28); margin-bottom: 4px; }
  .mr-kpi-v { font-size: 16px; font-weight: 300; font-family: 'Geist Mono', monospace; letter-spacing: -0.5px; color: rgba(255,255,255,0.80); }
  .mr-kpi-v.pos { color: rgba(80,210,110,0.85); }
  .mr-kpi-v.neg { color: rgba(255,90,70,0.85); }
  .mr-kpi-sub { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 2px; font-family: 'Geist Mono', monospace; }

  .mr-sec-lbl { font-size: 10px; color: rgba(255,255,255,0.26); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }

  .mr-dist-row { display: flex; flex-direction: column; gap: 3px; margin-bottom: 7px; }
  .mr-dist-lbl { display: flex; justify-content: space-between; font-size: 10px; }
  .mr-dist-name { color: rgba(255,255,255,0.45); }
  .mr-dist-val { color: rgba(255,255,255,0.35); font-family: 'Geist Mono', monospace; }
  .mr-dist-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
  .mr-dist-fill { height: 100%; border-radius: 2px; }

  .mr-pos { display: flex; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .mr-pos:last-child { border-bottom: none; }
  .mr-pos-av { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 600; flex-shrink: 0; margin-right: 9px; }
  .mr-pos-name { flex: 1; font-size: 12px; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mr-pos-val { font-size: 12px; font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.60); flex-shrink: 0; }

  .mr-evo { display: flex; gap: 8px; }
  .mr-evo-card { flex: 1; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; background: rgba(255,255,255,0.02); }
  .mr-evo-lbl { font-size: 10px; color: rgba(255,255,255,0.28); margin-bottom: 4px; }
  .mr-evo-v { font-size: 14px; font-family: 'Geist Mono', monospace; letter-spacing: -0.4px; }

  .mr-actions { display: flex; gap: 8px; }
  .mr-btn-dl { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: rgba(255,255,255,0.92); border: none; border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; color: #080808; cursor: pointer; transition: background 100ms; }
  .mr-btn-dl:hover { background: #fff; }
  .mr-btn-dl:disabled { opacity: 0.40; cursor: not-allowed; }
  .mr-btn-email { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.10); border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.50); cursor: pointer; transition: all 100ms; }
  .mr-btn-email:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.72); border-color: rgba(255,255,255,0.18); }
  .mr-btn-email:disabled { opacity: 0.40; cursor: not-allowed; }
  .mr-spin { width: 14px; height: 14px; border: 1.5px solid rgba(0,0,0,0.20); border-top-color: rgba(0,0,0,0.70); border-radius: 50%; animation: mrspin .7s linear infinite; flex-shrink: 0; }
  .mr-spin-w { width: 14px; height: 14px; border: 1.5px solid rgba(255,255,255,0.12); border-top-color: rgba(255,255,255,0.55); border-radius: 50%; animation: mrspin .7s linear infinite; flex-shrink: 0; }
  @keyframes mrspin { to { transform: rotate(360deg); } }
  .mr-note { font-size: 11px; color: rgba(255,255,255,0.22); text-align: center; margin-top: 4px; }
  .mr-toast { padding: 10px 14px; border-radius: 6px; font-size: 12px; text-align: center; }
  .mr-toast.ok  { background: rgba(80,210,110,0.08); border: 1px solid rgba(80,210,110,0.18); color: rgba(80,210,110,0.85); }
  .mr-toast.err { background: rgba(255,80,60,0.08); border: 1px solid rgba(255,80,60,0.16); color: rgba(255,90,70,0.85); }
`

const TYPE_COLORS = {
  etf:     { bg: 'rgba(60,130,255,0.12)',  color: 'rgba(100,160,255,0.85)' },
  stock:   { bg: 'rgba(80,200,120,0.12)',  color: 'rgba(80,210,120,0.85)'  },
  crypto:  { bg: 'rgba(255,160,60,0.12)',  color: 'rgba(255,170,70,0.85)'  },
  robo:    { bg: 'rgba(180,120,255,0.12)', color: 'rgba(180,130,255,0.85)' },
  estalvi: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.42)' },
  efectiu: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.42)' },
}

// ── PDF HTML ──────────────────────────────────────────────────────────────────
function buildPdfHtml({ month, year, investments, savings, cryptos, snapshots }) {
  const totalInv  = investments.reduce((s, i) => s + (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0), 0)
  const totalSav  = savings.reduce((s, sv) => s + sv.amount, 0)
  const totalCry  = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
  const total     = totalInv + totalSav + totalCry
  const totalCost = investments.reduce((s, i) => s + (i.initialValue || 0), 0) + cryptos.reduce((s, c) => s + (c.initialValue || 0), 0)
  const gain      = totalInv + totalCry - totalCost
  const gainPct   = totalCost > 0 ? (gain / totalCost) * 100 : 0

  const pad = n => String(n).padStart(2, '0')
  const monthKey  = `${year}-${pad(month + 1)}`
  const prevDate  = new Date(year, month - 1, 1)
  const prevKey   = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`

  const thisSnaps = (snapshots || []).filter(s => s.date?.startsWith(monthKey)).sort((a, b) => a.date < b.date ? -1 : 1)
  const prevSnaps = (snapshots || []).filter(s => s.date?.startsWith(prevKey)).sort((a, b) => a.date < b.date ? -1 : 1)

  const monthStart     = thisSnaps[0]?.total ?? total
  const monthEnd       = thisSnaps[thisSnaps.length - 1]?.total ?? total
  const monthChange    = monthEnd - monthStart
  const monthChangePct = monthStart > 0 ? (monthChange / monthStart) * 100 : 0

  const prevEnd     = prevSnaps[prevSnaps.length - 1]?.total ?? null
  const prevStart   = prevSnaps[0]?.total ?? null
  const prevChange  = prevEnd !== null && prevStart !== null ? prevEnd - prevStart : null
  const prevChangePct = prevStart && prevChange !== null ? (prevChange / prevStart) * 100 : null

  const monthName     = new Date(year, month, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })
  const prevMonthName = prevDate.toLocaleDateString('ca-ES', { month: 'long' })

  // Donut SVG
  const dist = [
    { label: 'Inversions', val: totalInv, color: '#3b82f6' },
    { label: 'Estalvis',   val: totalSav, color: '#22c55e' },
    { label: 'Crypto',     val: totalCry, color: '#f59e0b' },
  ].filter(d => d.val > 0)

  const R = 46, CX = 56, CY = 56, SW = 16
  const circ = 2 * Math.PI * R
  let cum = 0
  const segs = dist.map(d => {
    const pct = total > 0 ? d.val / total : 0
    const rot = cum * 360 - 90
    cum += pct
    return { ...d, pct, offset: circ * (1 - pct), rot }
  })
  const donutSvg = `<svg width="112" height="112" viewBox="0 0 112 112">
    ${segs.map(s => `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${SW}"
      stroke-dasharray="${circ * s.pct} ${circ * (1 - s.pct)}"
      stroke-dashoffset="${circ * 0.25}"
      transform="rotate(${s.rot} ${CX} ${CY})"/>`).join('')}
    <text x="${CX}" y="${CY - 5}" text-anchor="middle" font-size="10" font-family="Helvetica" fill="#333">${fmtEur(total).replace(',00', '')}</text>
    <text x="${CX}" y="${CY + 9}" text-anchor="middle" font-size="8" font-family="Helvetica" fill="#aaa">total</text>
  </svg>`

  // Posicions
  const allAssets = [
    ...investments.map(i => ({ name: i.name, val: i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0, pg: (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0) - (i.initialValue || 0), cat: 'inv' })),
    ...savings.map(s => ({ name: s.name, val: s.amount, pg: 0, cat: 'sav' })),
    ...cryptos.map(c => ({ name: c.name, val: c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0, pg: (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0) - (c.initialValue || 0), cat: 'cry' })),
  ].sort((a, b) => b.val - a.val)

  const g = (v, fallback = '—') => v !== null && v !== undefined ? v : fallback

  return `<div style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fff;color:#111;padding:40px 44px;max-width:700px;margin:0 auto;">

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:26px;padding-bottom:18px;border-bottom:2px solid #111;">
    <div>
      <div style="font-size:9px;font-weight:700;color:#aaa;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:7px;">Cartera · Informe mensual</div>
      <div style="font-size:26px;font-weight:300;color:#111;letter-spacing:-0.8px;text-transform:capitalize;">${monthName}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:9px;color:#bbb;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:5px;">Patrimoni total</div>
      <div style="font-size:24px;font-weight:300;color:#111;letter-spacing:-0.6px;">${fmtEur(total)}</div>
      <div style="font-size:11px;color:${gain >= 0 ? '#2a8a4e' : '#c0392b'};margin-top:3px;font-weight:500;">${gain >= 0 ? '▲' : '▼'} ${fmtEur(Math.abs(gain))} (${fmtPct(Math.abs(gainPct))})</div>
    </div>
  </div>

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:26px;">
    ${[
      { l: 'Canvi del mes',         v: (monthChange >= 0 ? '+' : '') + fmtEur(monthChange),   sub: fmtPct(Math.abs(monthChangePct)),                    c: monthChange >= 0 ? '#2a8a4e' : '#c0392b' },
      { l: prevMonthName + ' ant.', v: prevChange !== null ? (prevChange >= 0 ? '+' : '') + fmtEur(prevChange) : '—', sub: prevChangePct !== null ? fmtPct(Math.abs(prevChangePct)) : 'sense dades', c: prevChange !== null ? (prevChange >= 0 ? '#2a8a4e' : '#c0392b') : '#999' },
      { l: 'Guany acumulat',        v: (gain >= 0 ? '+' : '') + fmtEur(gain),                 sub: fmtPct(Math.abs(gainPct)) + ' sobre cost',           c: gain >= 0 ? '#2a8a4e' : '#c0392b' },
      { l: 'Capital aportat',       v: fmtEur(totalCost),                                      sub: `${investments.length + savings.length + cryptos.length} posicions`, c: '#555' },
    ].map(k => `<div style="padding:11px 13px;background:#f9f9f9;border-radius:6px;border:1px solid #eee;">
      <div style="font-size:9px;color:#bbb;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:5px;">${k.l}</div>
      <div style="font-size:14px;font-weight:500;color:${k.c};font-variant-numeric:tabular-nums;">${k.v}</div>
      <div style="font-size:9px;color:#ccc;margin-top:2px;">${k.sub}</div>
    </div>`).join('')}
  </div>

  <!-- Distribució + Donut -->
  <div style="display:flex;gap:20px;margin-bottom:26px;align-items:center;">
    <div style="flex:1;">
      <div style="font-size:9px;font-weight:700;color:#aaa;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">Distribució</div>
      ${dist.map(d => {
        const pct = total > 0 ? (d.val / total * 100) : 0
        return `<div style="margin-bottom:9px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="font-size:11px;color:#555;display:flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;border-radius:50%;background:${d.color};display:inline-block;flex-shrink:0;"></span>${d.label}
            </span>
            <span style="font-size:11px;color:#888;font-variant-numeric:tabular-nums;">${fmtEur(d.val)} · ${pct.toFixed(1)}%</span>
          </div>
          <div style="height:4px;background:#eee;border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${d.color};border-radius:2px;"></div>
          </div>
        </div>`
      }).join('')}
    </div>
    <div style="flex-shrink:0;">${donutSvg}</div>
  </div>

  <!-- Posicions -->
  <div style="margin-bottom:26px;">
    <div style="font-size:9px;font-weight:700;color:#aaa;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">Posicions</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="border-bottom:1.5px solid #ddd;">
          <th style="text-align:left;padding:5px 0;font-weight:600;color:#bbb;font-size:9px;letter-spacing:0.06em;">ACTIU</th>
          <th style="text-align:right;padding:5px 0;font-weight:600;color:#bbb;font-size:9px;letter-spacing:0.06em;">VALOR</th>
          <th style="text-align:right;padding:5px 0;font-weight:600;color:#bbb;font-size:9px;letter-spacing:0.06em;">P&amp;G</th>
          <th style="text-align:right;padding:5px 0;font-weight:600;color:#bbb;font-size:9px;letter-spacing:0.06em;">%</th>
          <th style="text-align:right;padding:5px 0;font-weight:600;color:#bbb;font-size:9px;letter-spacing:0.06em;">PES</th>
        </tr>
      </thead>
      <tbody>
        ${allAssets.map(a => {
          const cost = a.val - a.pg
          const pgPct = cost > 0 ? (a.pg / cost) * 100 : 0
          const weight = total > 0 ? (a.val / total) * 100 : 0
          const isSav = a.cat === 'sav'
          return `<tr style="border-bottom:1px solid #f5f5f5;">
            <td style="padding:7px 0;color:#333;font-weight:500;">${a.name}</td>
            <td style="padding:7px 0;text-align:right;color:#333;font-variant-numeric:tabular-nums;">${fmtEur(a.val)}</td>
            <td style="padding:7px 0;text-align:right;color:${isSav ? '#ccc' : a.pg >= 0 ? '#2a8a4e' : '#c0392b'};font-variant-numeric:tabular-nums;">${isSav ? '—' : (a.pg >= 0 ? '+' : '') + fmtEur(a.pg)}</td>
            <td style="padding:7px 0;text-align:right;color:${isSav ? '#ccc' : a.pg >= 0 ? '#2a8a4e' : '#c0392b'};font-variant-numeric:tabular-nums;">${isSav ? '—' : (pgPct >= 0 ? '+' : '') + pgPct.toFixed(1) + '%'}</td>
            <td style="padding:7px 0;text-align:right;color:#bbb;font-variant-numeric:tabular-nums;">${weight.toFixed(1)}%</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="padding-top:14px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:9px;color:#ccc;font-weight:700;letter-spacing:0.10em;">CARTERA v2</div>
    <div style="font-size:9px;color:#ccc;">Generat el ${new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>
</div>`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MonthlyReport({ investments = [], savings = [], cryptos = [], snapshots = [], userEmail = '' }) {
  const [generating, setGenerating] = useState(false)
  const [emailing, setEmailing]     = useState(false)
  const [toast, setToast]           = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.getMonth()
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500) }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2024, i, 1).toLocaleDateString('ca-ES', { month: 'long' }),
  }))

  const totalInv  = investments.reduce((s, i) => s + (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0), 0)
  const totalSav  = savings.reduce((s, sv) => s + sv.amount, 0)
  const totalCry  = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
  const total     = totalInv + totalSav + totalCry
  const totalCost = investments.reduce((s, i) => s + (i.initialValue || 0), 0) + cryptos.reduce((s, c) => s + (c.initialValue || 0), 0)
  const gain      = totalInv + totalCry - totalCost
  const gainPct   = totalCost > 0 ? (gain / totalCost) * 100 : 0

  // Evolució del mes seleccionat vs anterior
  const pad = n => String(n).padStart(2, '0')
  const monthKey = `${selectedYear}-${pad(selectedMonth + 1)}`
  const prevDate = new Date(selectedYear, selectedMonth - 1, 1)
  const prevKey  = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`

  const thisSnaps   = snapshots.filter(s => s.date?.startsWith(monthKey)).sort((a, b) => a.date < b.date ? -1 : 1)
  const prevSnaps   = snapshots.filter(s => s.date?.startsWith(prevKey)).sort((a, b) => a.date < b.date ? -1 : 1)
  const monthChange = thisSnaps.length >= 2 ? thisSnaps[thisSnaps.length - 1].total - thisSnaps[0].total : 0
  const monthChangePct = thisSnaps[0]?.total > 0 ? (monthChange / thisSnaps[0].total) * 100 : 0
  const prevChange  = prevSnaps.length >= 2 ? prevSnaps[prevSnaps.length - 1].total - prevSnaps[0].total : null
  const prevChangePct = prevSnaps[0]?.total > 0 && prevChange !== null ? (prevChange / prevSnaps[0].total) * 100 : null

  const topPositions = useMemo(() => [
    ...investments.map(i => ({ name: i.name, val: i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0, type: i.type })),
    ...savings.map(s => ({ name: s.name, val: s.amount, type: 'estalvi' })),
    ...cryptos.map(c => ({ name: c.name, val: c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0, type: 'crypto' })),
  ].sort((a, b) => b.val - a.val).slice(0, 5), [investments, savings, cryptos])

  const dist = [
    { label: 'Inversions', val: totalInv, color: 'rgba(60,130,255,0.70)'  },
    { label: 'Estalvis',   val: totalSav, color: 'rgba(80,200,110,0.70)'  },
    { label: 'Crypto',     val: totalCry, color: 'rgba(255,160,60,0.70)'  },
  ].filter(d => d.val > 0)

  const getPdfBlob = async () => {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'), import('html2canvas'),
    ])
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;background:white;'
    container.innerHTML = buildPdfHtml({ month: selectedMonth, year: selectedYear, investments, savings, cryptos, snapshots })
    document.body.appendChild(container)
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, width: 700 })
    document.body.removeChild(container)
    const imgData = canvas.toDataURL('image/png')
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
    const pdfW    = pdf.internal.pageSize.getWidth()
    const pdfH    = (canvas.height * pdfW) / canvas.width
    const pageH   = pdf.internal.pageSize.getHeight()
    let yOffset   = 0
    while (yOffset < pdfH) {
      if (yOffset > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH)
      yOffset += pageH
    }
    return pdf
  }

  const monthLabel = () => new Date(selectedYear, selectedMonth, 1)
    .toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }).replace(' ', '-')

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const pdf = await getPdfBlob()
      pdf.save(`cartera-${monthLabel()}.pdf`)
      showToast('ok', 'PDF descarregat correctament ✓')
    } catch (err) {
      console.error(err)
      showToast('err', 'Error generant el PDF. Comprova que tens jspdf i html2canvas instal·lats.')
    }
    setGenerating(false)
  }

  const handleEmail = async () => {
    setEmailing(true)
    try {
      // Descarrega el PDF
      const pdf = await getPdfBlob()
      pdf.save(`cartera-${monthLabel()}.pdf`)
      // Obre el client de correu
      const to      = userEmail || ''
      const subject = encodeURIComponent(`Informe Cartera · ${new Date(selectedYear, selectedMonth, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}`)
      const body    = encodeURIComponent(`Hola,\n\nAdjunt trobaràs l'informe mensual del teu portfoli Cartera.\n\nGenerat automàticament per Cartera v2.`)
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
      showToast('ok', 'PDF descarregat. Adjunta\'l manualment al correu que s\'ha obert.')
    } catch (err) {
      console.error(err)
      showToast('err', 'Error preparant l\'email.')
    }
    setEmailing(false)
  }

  const prevMonthName = prevDate.toLocaleDateString('ca-ES', { month: 'long' })

  return (
    <div className="mr">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="sec-v2-title">Informe mensual</h2>
        <p className="sec-v2-sub">Resum del portfoli en format PDF</p>
      </div>

      {/* Selector */}
      <div className="mr-panel">
        <p className="mr-panel-title">Selecciona el mes</p>
        <div className="mr-sel-row">
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Mes</label>
            <select className="mr-sel" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Any</label>
            <select className="mr-sel" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mr-panel">
        <p className="mr-panel-title">Previsualització</p>
        <div className="mr-prev">
          <div className="mr-prev-hdr">
            <span className="mr-prev-title">Cartera · Informe mensual</span>
            <span className="mr-prev-date">
              {new Date(selectedYear, selectedMonth, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="mr-prev-body">

            {/* KPIs */}
            <div className="mr-kpis">
              <div className="mr-kpi">
                <p className="mr-kpi-l">Patrimoni total</p>
                <p className="mr-kpi-v">{fmtEur(total)}</p>
              </div>
              <div className="mr-kpi">
                <p className="mr-kpi-l">Guany acumulat</p>
                <p className={`mr-kpi-v ${gain >= 0 ? 'pos' : 'neg'}`}>
                  {gain >= 0 ? '+' : ''}{fmtEur(gain)}
                  <span style={{ fontSize: 10, opacity: 0.7 }}> ({fmtPct(gainPct)})</span>
                </p>
              </div>
            </div>

            {/* Evolució mes vs mes anterior */}
            <div>
              <p className="mr-sec-lbl">Evolució mensual</p>
              <div className="mr-evo">
                <div className="mr-evo-card">
                  <p className="mr-evo-lbl">
                    {new Date(selectedYear, selectedMonth, 1).toLocaleDateString('ca-ES', { month: 'long' })}
                  </p>
                  <p className="mr-evo-v" style={{ color: monthChange >= 0 ? 'rgba(80,210,110,0.85)' : 'rgba(255,90,70,0.85)' }}>
                    {monthChange >= 0 ? '+' : ''}{fmtEur(monthChange)}
                  </p>
                  <p className="mr-kpi-sub">{fmtPct(Math.abs(monthChangePct))}</p>
                </div>
                <div className="mr-evo-card">
                  <p className="mr-evo-lbl">{prevMonthName} (ant.)</p>
                  <p className="mr-evo-v" style={{ color: prevChange !== null ? (prevChange >= 0 ? 'rgba(80,210,110,0.85)' : 'rgba(255,90,70,0.85)') : 'rgba(255,255,255,0.25)' }}>
                    {prevChange !== null ? (prevChange >= 0 ? '+' : '') + fmtEur(prevChange) : '—'}
                  </p>
                  <p className="mr-kpi-sub">{prevChangePct !== null ? fmtPct(Math.abs(prevChangePct)) : 'sense dades'}</p>
                </div>
              </div>
            </div>

            {/* Distribució */}
            <div>
              <p className="mr-sec-lbl">Distribució</p>
              {dist.map(d => {
                const pct = total > 0 ? (d.val / total * 100) : 0
                return (
                  <div key={d.label} className="mr-dist-row">
                    <div className="mr-dist-lbl">
                      <span className="mr-dist-name">{d.label}</span>
                      <span className="mr-dist-val">{fmtEur(d.val)} · {pct.toFixed(1)}%</span>
                    </div>
                    <div className="mr-dist-track">
                      <div className="mr-dist-fill" style={{ width: `${pct}%`, background: d.color }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top posicions */}
            <div>
              <p className="mr-sec-lbl">Top posicions</p>
              {topPositions.map((p, i) => {
                const tc = TYPE_COLORS[p.type] || TYPE_COLORS.etf
                return (
                  <div key={i} className="mr-pos">
                    <div className="mr-pos-av" style={{ background: tc.bg, color: tc.color }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
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

      {/* Actions */}
      <div className="mr-actions">
        <button className="mr-btn-dl" onClick={handleDownload} disabled={generating || emailing}>
          {generating
            ? <><div className="mr-spin" />Generant...</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Descarregar PDF</>
          }
        </button>
        <button className="mr-btn-email" onClick={handleEmail} disabled={generating || emailing}>
          {emailing
            ? <><div className="mr-spin-w" />Preparant...</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Enviar per email</>
          }
        </button>
      </div>
      <p className="mr-note">Requereix: <code style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10 }}>npm install jspdf html2canvas</code></p>
    </div>
  )
}