// ─── MonthlyReport.jsx ──────────────────────────────────────────────────────
// Genera un informe PDF mensual amb resum del portfoli.
// Usa jsPDF + html2canvas per renderitzar HTML → PDF.
//
// Instal·lació: npm install jspdf html2canvas

import { useState, useRef, useMemo } from 'react'
import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const styles = `
  .mr { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }
  .mr-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .mr-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); margin-bottom: 14px; }

  /* Month selector */
  .mr-month-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .mr-month-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 8px 11px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.75); outline: none; cursor: pointer; }
  .mr-month-select option { background: #111; }

  /* Preview card */
  .mr-preview { border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; overflow: hidden; }
  .mr-preview-hdr { background: rgba(255,255,255,0.04); padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; }
  .mr-preview-title { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.48); }
  .mr-preview-body { padding: 14px 16px; }

  /* Stats grid */
  .mr-stats { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; margin-bottom: 12px; }
  .mr-stat { padding: 10px 12px; border: 1px solid rgba(255,255,255,0.05); border-radius: 5px; background: rgba(255,255,255,0.02); }
  .mr-stat-l { font-size: 10px; color: rgba(255,255,255,0.26); margin-bottom: 3px; }
  .mr-stat-v { font-size: 14px; font-weight: 300; font-family: 'Geist Mono', monospace; letter-spacing: -0.4px; color: rgba(255,255,255,0.75); }
  .mr-stat-v.pos { color: rgba(80,210,110,0.85); }
  .mr-stat-v.neg { color: rgba(255,90,70,0.85); }

  /* Position list */
  .mr-pos-row { display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .mr-pos-row:last-child { border-bottom: none; }
  .mr-pos-av { width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 600; flex-shrink: 0; margin-right: 8px; }
  .mr-pos-name { flex: 1; font-size: 11px; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mr-pos-val { font-size: 11px; font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.65); flex-shrink: 0; min-width: 70px; text-align: right; }
  .mr-pos-pg { font-size: 10px; font-family: 'Geist Mono', monospace; flex-shrink: 0; min-width: 64px; text-align: right; margin-left: 6px; }

  /* Generate button */
  .mr-gen-btn { display: flex; align-items: center; gap: 8px; padding: 11px 18px; background: rgba(255,255,255,0.92); border: none; border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; color: #080808; cursor: pointer; transition: background 100ms; width: 100%; justify-content: center; }
  .mr-gen-btn:hover { background: #fff; }
  .mr-gen-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .mr-gen-spin { width: 14px; height: 14px; border: 1.5px solid rgba(0,0,0,0.20); border-top-color: rgba(0,0,0,0.70); border-radius: 50%; animation: mrspin .7s linear infinite; flex-shrink: 0; }
  @keyframes mrspin { to { transform: rotate(360deg); } }
  .mr-note { font-size: 11px; color: rgba(255,255,255,0.24); text-align: center; margin-top: 8px; }
`

// ─── Template HTML del PDF (fons blanc, tipografia neta) ───────────────────
const buildPdfHtml = ({ month, year, investments, savings, cryptos, snapshots }) => {
  const allAssets = [
    ...investments.map(i => ({ ...i, category: 'inv' })),
    ...savings.map(s => ({ ...s, amount: s.amount, category: 'sav' })),
    ...cryptos.map(c => ({ ...c, category: 'cry' })),
  ]

  const totalInv   = investments.reduce((s, i) => s + (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0), 0)
  const totalSav   = savings.reduce((s, sv) => s + sv.amount, 0)
  const totalCry   = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
  const total      = totalInv + totalSav + totalCry
  const totalCost  = investments.reduce((s, i) => s + (i.initialValue||0), 0) + cryptos.reduce((s,c)=>s+(c.initialValue||0),0)
  const gain       = totalInv + totalCry - totalCost
  const gainPct    = totalCost > 0 ? (gain / totalCost) * 100 : 0

  // Snapshot del mes
  const monthSnaps = (snapshots || []).filter(s => s.date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
  const monthStart = monthSnaps[0]?.total || total
  const monthEnd   = monthSnaps[monthSnaps.length - 1]?.total || total
  const monthChange = monthEnd - monthStart
  const monthChangePct = monthStart > 0 ? (monthChange / monthStart) * 100 : 0

  const monthName = new Date(year, month, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })

  const rows = allAssets.map(a => {
    const val = a.category === 'sav' ? a.amount : (a.qty && a.currentPrice ? a.qty * a.currentPrice : a.initialValue || 0)
    const pg  = a.category === 'sav' ? 0 : val - (a.initialValue || 0)
    const pgPct = (a.initialValue || 0) > 0 ? (pg / a.initialValue) * 100 : 0
    return { name: a.name || a.symbol || '—', val, pg, pgPct, category: a.category }
  }).sort((a, b) => b.val - a.val)

  return `
    <div style="font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: white; color: #111; padding: 40px; max-width: 680px; margin: 0 auto;">

      <!-- Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #e8e8e8;">
        <div>
          <div style="font-size:11px; font-weight:500; color:#888; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px;">Cartera · Informe mensual</div>
          <div style="font-size:24px; font-weight:300; color:#111; letter-spacing:-0.8px; text-transform:capitalize;">${monthName}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px; color:#aaa; margin-bottom:4px;">Valor total</div>
          <div style="font-size:20px; font-weight:300; color:#111; font-variant-numeric:tabular-nums; letter-spacing:-0.5px;">${fmtEur(total)}</div>
        </div>
      </div>

      <!-- Summary metrics -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px;">
        ${[
          { l: 'Canvi del mes',   v: fmtEur(Math.abs(monthChange)),  sub: (monthChange >= 0 ? '▲ ' : '▼ ') + fmtPct(Math.abs(monthChangePct)), color: monthChange >= 0 ? '#2a8a4e' : '#c0392b' },
          { l: 'Guany total',     v: fmtEur(Math.abs(gain)),         sub: (gain >= 0 ? '▲ ' : '▼ ') + fmtPct(Math.abs(gainPct)), color: gain >= 0 ? '#2a8a4e' : '#c0392b' },
          { l: 'Capital aportat', v: fmtEur(totalCost), sub: 'Cost base', color: '#555' },
          { l: 'Posicions',       v: String(allAssets.length), sub: `${investments.length} inv · ${savings.length} est · ${cryptos.length} cry`, color: '#555' },
        ].map(m => `
          <div style="padding:12px 14px; background:#f8f8f8; border-radius:6px; border:1px solid #eee;">
            <div style="font-size:10px; color:#999; margin-bottom:4px;">${m.l}</div>
            <div style="font-size:16px; font-weight:400; color:${m.color}; font-variant-numeric:tabular-nums;">${m.v}</div>
            <div style="font-size:10px; color:#bbb; margin-top:2px;">${m.sub}</div>
          </div>
        `).join('')}
      </div>

      <!-- Positions table -->
      <div style="margin-bottom:28px;">
        <div style="font-size:11px; font-weight:500; color:#888; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px;">Posicions</div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid #e8e8e8;">
              <th style="text-align:left; padding:6px 0; font-weight:500; color:#999; font-size:10px;">Actiu</th>
              <th style="text-align:right; padding:6px 0; font-weight:500; color:#999; font-size:10px;">Valor</th>
              <th style="text-align:right; padding:6px 0; font-weight:500; color:#999; font-size:10px;">P&G</th>
              <th style="text-align:right; padding:6px 0; font-weight:500; color:#999; font-size:10px;">%</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr style="border-bottom:1px solid #f2f2f2;">
                <td style="padding:7px 0; color:#333;">${r.name}</td>
                <td style="padding:7px 0; text-align:right; font-variant-numeric:tabular-nums; color:#333;">${fmtEur(r.val)}</td>
                <td style="padding:7px 0; text-align:right; font-variant-numeric:tabular-nums; color:${r.pg >= 0 ? '#2a8a4e' : '#c0392b'};">
                  ${r.category === 'sav' ? '—' : (r.pg >= 0 ? '+' : '') + fmtEur(r.pg)}
                </td>
                <td style="padding:7px 0; text-align:right; font-variant-numeric:tabular-nums; color:${r.pg >= 0 ? '#2a8a4e' : '#c0392b'};">
                  ${r.category === 'sav' ? '—' : (r.pgPct >= 0 ? '+' : '') + r.pgPct.toFixed(1) + '%'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Distribution bars -->
      <div>
        <div style="font-size:11px; font-weight:500; color:#888; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:10px;">Distribució</div>
        ${[
          { l: 'Inversions', v: totalInv,  color: '#3b82f6' },
          { l: 'Estalvis',   v: totalSav,  color: '#22c55e' },
          { l: 'Crypto',     v: totalCry,  color: '#f59e0b' },
        ].map(d => {
          const pct = total > 0 ? (d.v / total) * 100 : 0
          return `
            <div style="margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                <span style="font-size:11px; color:#555;">${d.l}</span>
                <span style="font-size:11px; color:#555; font-variant-numeric:tabular-nums;">${fmtEur(d.v)} · ${pct.toFixed(1)}%</span>
              </div>
              <div style="height:4px; background:#eee; border-radius:2px; overflow:hidden;">
                <div style="height:100%; width:${pct}%; background:${d.color}; border-radius:2px;"></div>
              </div>
            </div>
          `
        }).join('')}
      </div>

      <!-- Footer -->
      <div style="margin-top:32px; padding-top:16px; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:10px; color:#ccc;">Generat amb Cartera v2</div>
        <div style="font-size:10px; color:#ccc;">${new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>
  `
}

export default function MonthlyReport({ investments = [], savings = [], cryptos = [], snapshots = [] }) {
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.getMonth()
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const previewRef = useRef(null)

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2024, i, 1).toLocaleDateString('ca-ES', { month: 'long' }),
  }))

  const totalInv  = investments.reduce((s, i) => s + (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue||0), 0)
  const totalSav  = savings.reduce((s, sv) => s + sv.amount, 0)
  const totalCry  = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue||0), 0)
  const total     = totalInv + totalSav + totalCry
  const totalCost = investments.reduce((s,i)=>s+(i.initialValue||0),0) + cryptos.reduce((s,c)=>s+(c.initialValue||0),0)
  const gain      = totalInv + totalCry - totalCost
  const gainPct   = totalCost > 0 ? (gain / totalCost) * 100 : 0

  const topPositions = useMemo(() => {
    return [
      ...investments.map(i => ({ name: i.name, val: i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue||0, type: i.type })),
      ...savings.map(s => ({ name: s.name, val: s.amount, type: 'estalvi' })),
      ...cryptos.map(c => ({ name: c.name, val: c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue||0, type: 'crypto' })),
    ].sort((a, b) => b.val - a.val).slice(0, 5)
  }, [investments, savings, cryptos])

  const TYPE_COLORS = {
    etf: { bg: 'rgba(60,130,255,0.12)', color: 'rgba(100,160,255,0.85)' },
    stock: { bg: 'rgba(80,200,120,0.12)', color: 'rgba(80,210,120,0.85)' },
    crypto: { bg: 'rgba(255,160,60,0.12)', color: 'rgba(255,170,70,0.85)' },
    robo: { bg: 'rgba(180,120,255,0.12)', color: 'rgba(180,130,255,0.85)' },
    estalvi: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.42)' },
    efectiu: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.42)' },
  }

  const generatePDF = async () => {
    setGenerating(true)
    try {
      // Importació dinàmica per no bloquejar el bundle
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      // Crea un div temporal invisible fora del viewport
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed; left:-9999px; top:0; width:680px; background:white;'
      container.innerHTML = buildPdfHtml({
        month: selectedMonth, year: selectedYear,
        investments, savings, cryptos, snapshots,
      })
      document.body.appendChild(container)

      const canvas = await html2canvas(container, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        logging: false, width: 680,
      })
      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pdfW    = pdf.internal.pageSize.getWidth()
      const pdfH    = (canvas.height * pdfW) / canvas.width

      // Si el contingut és més llarg que una pàgina, afegeix pàgines
      const pageH = pdf.internal.pageSize.getHeight()
      let yOffset = 0
      while (yOffset < pdfH) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH)
        yOffset += pageH
      }

      const monthLabel = new Date(selectedYear, selectedMonth, 1)
        .toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })
        .replace(' ', '-')
      pdf.save(`cartera-informe-${monthLabel}.pdf`)
    } catch (err) {
      console.error('Error generant PDF:', err)
      alert('Error generant el PDF. Assegura\'t d\'haver instal·lat jspdf i html2canvas:\nnpm install jspdf html2canvas')
    }
    setGenerating(false)
  }

  return (
    <div className="mr">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="sec-v2-title">Informe mensual</h2>
        <p className="sec-v2-sub">Genera un PDF amb el resum del teu portfoli</p>
      </div>

      {/* Selector de mes */}
      <div className="mr-panel">
        <p className="mr-panel-title">Configuració</p>
        <div className="mr-month-row">
          <div>
            <label className="v2-field-label" style={{ display: 'block', marginBottom: 5 }}>Mes</label>
            <select className="mr-month-select" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {months.map(m => (
                <option key={m.value} value={m.value} style={{ textTransform: 'capitalize' }}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="v2-field-label" style={{ display: 'block', marginBottom: 5 }}>Any</label>
            <select className="mr-month-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mr-panel">
        <p className="mr-panel-title">Previsualització</p>
        <div className="mr-preview">
          <div className="mr-preview-hdr">
            <span className="mr-preview-title">Resum del portfoli</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.24)', fontFamily: "'Geist Mono', monospace" }}>
              {new Date(selectedYear, selectedMonth, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="mr-preview-body">
            <div className="mr-stats">
              <div className="mr-stat">
                <p className="mr-stat-l">Valor total</p>
                <p className="mr-stat-v">{fmtEur(total)}</p>
              </div>
              <div className="mr-stat">
                <p className="mr-stat-l">Guany total</p>
                <p className={`mr-stat-v ${gain >= 0 ? 'pos' : 'neg'}`}>{gain >= 0 ? '+' : ''}{fmtEur(gain)} ({fmtPct(gainPct)})</p>
              </div>
            </div>

            <div style={{ marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Top posicions
            </div>
            {topPositions.map((p, i) => {
              const tc = TYPE_COLORS[p.type] || TYPE_COLORS.etf
              return (
                <div key={i} className="mr-pos-row">
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

      {/* Genera */}
      <button className="mr-gen-btn" onClick={generatePDF} disabled={generating}>
        {generating ? (
          <><div className="mr-gen-spin" />Generant PDF...</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>Descarregar PDF</>
        )}
      </button>
      <p className="mr-note">Requereix: <code style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10 }}>npm install jspdf html2canvas</code></p>
    </div>
  )
}