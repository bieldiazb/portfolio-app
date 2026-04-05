import { useState, useRef, useCallback } from 'react'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { fmtEur } from '../utils/format'
import { parseCSV } from '../utils/Csvparsers'

const BROKER_HINTS = {
  'DEGIRO':              { cols:'Date, Product, ISIN, Quantity, Price, Value',                    color:COLORS.neonGreen  },
  'Interactive Brokers': { cols:'Symbol, Date/Time, Quantity, T. Price, Proceeds',                color:COLORS.neonCyan   },
  'Revolut':             { cols:'Date, Ticker, Type, Shares, Price per share, Total Amount',      color:COLORS.neonPurple },
  'Trade Republic':      { cols:'Date, Instrument, ISIN, Shares, Price, Total',                   color:COLORS.neonAmber  },
  'Schwab':              { cols:'Date, Action, Symbol, Quantity, Price, Amount',                   color:COLORS.neonRed    },
  'Fidelity':            { cols:'Run Date, Action, Symbol, Quantity, Price, Amount',               color:'#ff9500'         },
  'Genèric':             { cols:'date, ticker/name, qty, price, total, action (buy/sell)',         color:COLORS.textMuted  },
}

const STEPS = ['Fitxer', 'Revisió', 'Fet']

const styles = `
  /* ── Overlay ── */
  .im-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.85);
    display:flex; align-items:flex-end; justify-content:center;
    z-index:60;
    backdrop-filter:blur(6px);
    animation:imFade 150ms ease;
  }
  @keyframes imFade { from{opacity:0} to{opacity:1} }
  @media (min-width:680px) {
    .im-overlay { align-items:center; padding:16px; }
  }

  /* ── Modal ── */
  .im-modal {
    background:#131313;
    border:1px solid rgba(255,255,255,0.09);
    border-radius:16px 16px 0 0;
    width:100%; max-width:640px;
    max-height:92dvh; overflow-y:auto;
    font-family:${FONTS.sans};
    box-shadow:0 -20px 60px rgba(0,0,0,0.70);
    animation:imSlide 220ms cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes imSlide { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @media (min-width:680px) {
    .im-modal { border-radius:14px; }
  }

  .im-drag { width:36px; height:4px; border-radius:2px; background:rgba(255,255,255,0.10); margin:14px auto 0; display:block; }
  @media (min-width:680px) { .im-drag { display:none; } }

  /* ── Header ── */
  .im-hdr {
    display:flex; align-items:center; justify-content:space-between;
    padding:18px 20px 0;
    margin-bottom:18px;
  }
  .im-title { font-size:16px; font-weight:600; color:#fff; letter-spacing:-0.3px; }
  .im-x {
    width:28px; height:28px; border-radius:8px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
    color:rgba(255,255,255,0.45); font-size:16px;
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    transition:all 100ms;
  }
  .im-x:hover { color:rgba(255,255,255,0.80); border-color:rgba(255,255,255,0.18); }

  /* ── Body ── */
  .im-body { padding:0 20px 28px; display:flex; flex-direction:column; gap:14px; }

  /* ── Steps ── */
  .im-steps { display:flex; align-items:center; }
  .im-step { display:flex; align-items:center; gap:6px; }
  .im-step-num {
    width:22px; height:22px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono};
  }
  .im-step.done   .im-step-num { background:${COLORS.neonGreen}; color:#000; }
  .im-step.active .im-step-num { background:${COLORS.neonGreen}; color:#000; }
  .im-step.pend   .im-step-num { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.25); border:1px solid rgba(255,255,255,0.08); }
  .im-step-lbl { font-size:11px; font-weight:500; }
  .im-step.done   .im-step-lbl { color:${COLORS.neonGreen}; }
  .im-step.active .im-step-lbl { color:#fff; }
  .im-step.pend   .im-step-lbl { color:rgba(255,255,255,0.25); }
  .im-step-line { flex:1; height:1px; background:rgba(255,255,255,0.06); margin:0 8px; }
  .im-step-line.done { background:${COLORS.neonGreen}; opacity:0.4; }

  /* ── Drop zone ── */
  .im-drop {
    border:1px dashed rgba(255,255,255,0.12); border-radius:12px;
    padding:36px 20px; text-align:center; cursor:pointer;
    transition:all 150ms; background:rgba(255,255,255,0.02);
  }
  .im-drop:hover { border-color:rgba(0,255,136,0.35); background:rgba(0,255,136,0.03); }
  .im-drop.over  { border-color:rgba(0,255,136,0.50); background:rgba(0,255,136,0.05); }
  .im-drop-icon { font-size:32px; margin-bottom:12px; }
  .im-drop-main { font-size:14px; font-weight:500; color:rgba(255,255,255,0.75); margin-bottom:5px; }
  .im-drop-sub  { font-size:12px; color:rgba(255,255,255,0.28); margin-bottom:14px; }
  .im-drop-btn  {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 16px; border-radius:8px;
    border:1px solid rgba(255,255,255,0.12);
    background:transparent; font-family:${FONTS.sans};
    font-size:12px; font-weight:600; color:rgba(255,255,255,0.55);
    cursor:pointer; transition:all 100ms;
  }
  .im-drop-btn:hover { border-color:rgba(255,255,255,0.25); color:#fff; }

  /* ── Brokers suportats ── */
  .im-brokers-wrap { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px; }
  .im-brokers-lbl { font-size:9px; font-weight:600; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:10px; }
  .im-brokers { display:flex; gap:5px; flex-wrap:wrap; }
  .im-broker-chip {
    font-size:10px; font-weight:600; font-family:${FONTS.mono};
    padding:3px 10px; border-radius:20px;
    border:1px solid rgba(255,255,255,0.08);
    color:rgba(255,255,255,0.35); background:rgba(255,255,255,0.04);
  }

  /* Hint genèric */
  .im-hint {
    background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.15);
    border-radius:8px; padding:11px 13px;
    font-size:11px; color:rgba(255,255,255,0.35); line-height:1.65;
  }
  .im-hint strong { color:rgba(255,255,255,0.60); }

  /* ── Broker detectat ── */
  .im-detected {
    display:flex; align-items:center; gap:10px;
    padding:12px 14px; border-radius:10px;
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
  }
  .im-detected-badge {
    font-size:10px; font-weight:700; font-family:${FONTS.mono};
    padding:3px 10px; border-radius:10px; flex-shrink:0;
  }
  .im-detected-info { flex:1; min-width:0; }
  .im-detected-name { font-size:13px; font-weight:500; color:#fff; margin-bottom:2px; }
  .im-detected-cols { font-size:10px; color:rgba(255,255,255,0.25); font-family:${FONTS.mono}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .im-change-btn {
    font-size:11px; font-weight:500; color:rgba(255,255,255,0.30);
    background:transparent; border:1px solid rgba(255,255,255,0.08);
    border-radius:6px; padding:4px 10px; cursor:pointer; flex-shrink:0;
    transition:all 100ms;
  }
  .im-change-btn:hover { color:rgba(255,255,255,0.65); border-color:rgba(255,255,255,0.18); }

  /* ── Taula preview ── */
  .im-preview {
    background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06);
    border-radius:10px; overflow:hidden;
  }
  .im-preview-hdr {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.05);
    background:rgba(255,255,255,0.02);
  }
  .im-preview-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; }
  .im-preview-count { font-size:11px; font-family:${FONTS.mono}; color:rgba(0,255,136,0.70); font-weight:600; }

  .im-table-wrap { overflow-x:auto; max-height:300px; overflow-y:auto; }
  .im-table { width:100%; border-collapse:collapse; font-size:11px; }
  .im-table th {
    padding:7px 10px; font-size:9px; font-weight:600;
    color:rgba(255,255,255,0.22); text-transform:uppercase; letter-spacing:0.10em;
    border-bottom:1px solid rgba(255,255,255,0.05); text-align:left;
    white-space:nowrap; background:#131313; position:sticky; top:0;
  }
  .im-table td {
    padding:9px 10px; border-bottom:1px solid rgba(255,255,255,0.03);
    color:rgba(255,255,255,0.55); vertical-align:middle; white-space:nowrap;
  }
  .im-table tr:last-child td { border-bottom:none; }
  .im-table tr:hover td { background:rgba(255,255,255,0.02); }
  .im-table tr.unsel td { opacity:0.30; }
  .im-buy  { color:${COLORS.neonGreen}; font-weight:600; }
  .im-sell { color:${COLORS.neonAmber}; font-weight:600; }
  .im-mono { font-family:${FONTS.mono}; }
  .im-check { width:14px; height:14px; cursor:pointer; accent-color:${COLORS.neonGreen}; }

  /* ── Missatges ── */
  .im-warn  { display:flex; align-items:flex-start; gap:8px; padding:11px 13px; background:rgba(255,149,0,0.07); border:1px solid rgba(255,149,0,0.20); border-radius:8px; font-size:11px; color:${COLORS.neonAmber}; line-height:1.6; }
  .im-error { display:flex; align-items:flex-start; gap:8px; padding:11px 13px; background:rgba(255,59,59,0.07); border:1px solid rgba(255,59,59,0.20); border-radius:8px; font-size:12px; color:${COLORS.neonRed}; line-height:1.6; }

  /* ── Footer botons ── */
  .im-footer { display:flex; gap:8px; }
  .im-btn-cancel {
    flex:1; padding:13px; border:1px solid rgba(255,255,255,0.09);
    background:transparent; border-radius:10px;
    font-family:${FONTS.sans}; font-size:14px; color:rgba(255,255,255,0.40);
    cursor:pointer; transition:all 100ms;
  }
  .im-btn-cancel:hover { border-color:rgba(255,255,255,0.18); color:rgba(255,255,255,0.75); }
  .im-btn-import {
    flex:2; padding:13px; border:none; border-radius:10px;
    font-family:${FONTS.sans}; font-size:14px; font-weight:700;
    background:${COLORS.neonGreen}; color:#000;
    cursor:pointer; transition:opacity 100ms;
  }
  .im-btn-import:hover { opacity:0.85; }
  .im-btn-import:disabled { opacity:0.30; cursor:not-allowed; }

  /* ── Resultat ── */
  .im-result { text-align:center; padding:32px 0 16px; }
  .im-result-icon { font-size:48px; margin-bottom:14px; }
  .im-result-title { font-size:18px; font-weight:600; color:#fff; letter-spacing:-0.3px; margin-bottom:6px; }
  .im-result-sub { font-size:13px; color:rgba(255,255,255,0.35); line-height:1.6; }
`

export default function ImportCSVModal({ onClose, onImport }) {
  const [step, setStep]           = useState(0)
  const [parsed, setParsed]       = useState(null)
  const [selected, setSelected]   = useState(new Set())
  const [dragging, setDragging]   = useState(false)
  const [importing, setImporting] = useState(false)
  const [done, setDone]           = useState(null)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  const processFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) { setError('Cal un fitxer .csv vàlid'); return }
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const result = parseCSV(e.target.result)
      if (!result.transactions.length) { setError('No s\'han trobat transaccions. Comprova el format del CSV.'); return }
      setParsed(result)
      setSelected(new Set(result.transactions.map((_,i)=>i)))
      setStep(1)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop  = e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }
  const handleFile  = e => processFile(e.target.files[0])
  const toggleRow   = i => setSelected(s=>{ const n=new Set(s); n.has(i)?n.delete(i):n.add(i); return n })
  const toggleAll   = () => selected.size===parsed.transactions.length ? setSelected(new Set()) : setSelected(new Set(parsed.transactions.map((_,i)=>i)))

  const handleImport = async () => {
    if (!parsed||!selected.size) return
    setImporting(true)
    const toImport = parsed.transactions.filter((_,i)=>selected.has(i))
    try {
      await onImport(toImport, parsed.broker)
      setDone({count:toImport.length, broker:parsed.broker})
      setStep(2)
    } catch(err) { setError('Error important: '+(err.message||'error desconegut')) }
    setImporting(false)
  }

  const brokerHint = parsed ? BROKER_HINTS[parsed.broker]||BROKER_HINTS['Genèric'] : null

  const stepState = (i) => i < step ? 'done' : i === step ? 'active' : 'pend'

  return (
    <div className="im-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <div className="im-modal">
        <div className="im-drag"/>
        <div className="im-hdr">
          <h3 className="im-title">Importar CSV del broker</h3>
          <button className="im-x" onClick={onClose}>×</button>
        </div>

        <div className="im-body">
          {/* Steps */}
          <div className="im-steps">
            {STEPS.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',flex:i<STEPS.length-1?1:'auto'}}>
                <div className={`im-step ${stepState(i)}`}>
                  <div className="im-step-num">{i<step?'✓':i+1}</div>
                  <span className="im-step-lbl">{s}</span>
                </div>
                {i<STEPS.length-1 && <div className={`im-step-line${i<step?' done':''}`}/>}
              </div>
            ))}
          </div>

          {/* ── STEP 0: Upload ── */}
          {step===0 && (<>
            <div
              className={`im-drop${dragging?' over':''}`}
              onClick={()=>fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDragging(true)}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="im-drop-icon">📂</div>
              <p className="im-drop-main">Arrossega el CSV aquí</p>
              <p className="im-drop-sub">o selecciona'l manualment</p>
              <button className="im-drop-btn" onClick={e=>{e.stopPropagation();fileRef.current?.click()}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Seleccionar fitxer .csv
              </button>
              <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleFile}/>
            </div>

            <div className="im-brokers-wrap">
              <p className="im-brokers-lbl">Brokers suportats</p>
              <div className="im-brokers">
                {Object.keys(BROKER_HINTS).map(b=>(
                  <span key={b} className="im-broker-chip">{b}</span>
                ))}
              </div>
            </div>

            <div className="im-hint">
              <strong>Format genèric:</strong> Si el teu broker no és de la llista, exporta un CSV amb columnes:<br/>
              <span style={{fontFamily:FONTS.mono,fontSize:10,color:'rgba(0,212,255,0.70)'}}>date, ticker, name, qty, price, total, action (buy/sell), type (etf/stock)</span>
            </div>

            {error&&<div className="im-error">⚠ {error}</div>}
          </>)}

          {/* ── STEP 1: Preview ── */}
          {step===1&&parsed&&(<>
            <div className="im-detected">
              <span className="im-detected-badge" style={{background:`${brokerHint?.color}18`,color:brokerHint?.color,border:`1px solid ${brokerHint?.color}30`}}>
                {parsed.broker}
              </span>
              <div className="im-detected-info">
                <p className="im-detected-name">Broker detectat automàticament</p>
                <p className="im-detected-cols">{brokerHint?.cols}</p>
              </div>
              <button className="im-change-btn" onClick={()=>{setStep(0);setParsed(null)}}>Canviar</button>
            </div>

            {parsed.transactions.some(t=>!t.ticker&&!t.name) && (
              <div className="im-warn">⚠ Algunes files no tenen ticker identificable. Revisa-les abans d'importar.</div>
            )}

            <div className="im-preview">
              <div className="im-preview-hdr">
                <span className="im-preview-title">Transaccions trobades</span>
                <span className="im-preview-count">{selected.size} / {parsed.transactions.length} seleccionades</span>
              </div>
              <div className="im-table-wrap">
                <table className="im-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" className="im-check" checked={selected.size===parsed.transactions.length} onChange={toggleAll}/></th>
                      <th>Data</th><th>Nom / Ticker</th><th>Acció</th><th>Quantitat</th><th>Preu/u</th><th>Total</th><th>Moneda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.transactions.map((t,i)=>(
                      <tr key={i} className={selected.has(i)?'':'unsel'} onClick={()=>toggleRow(i)} style={{cursor:'pointer'}}>
                        <td><input type="checkbox" className="im-check" checked={selected.has(i)} onChange={()=>toggleRow(i)} onClick={e=>e.stopPropagation()}/></td>
                        <td className="im-mono">{t.date}</td>
                        <td>
                          <p style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.80)',marginBottom:1}}>{t.name||t.ticker||'—'}</p>
                          {t.ticker&&t.ticker!==t.name&&<p style={{fontSize:9,color:'rgba(255,255,255,0.25)',fontFamily:FONTS.mono}}>{t.ticker}</p>}
                        </td>
                        <td className={t.action==='buy'?'im-buy':'im-sell'}>{t.action==='buy'?'↑ Compra':'↓ Venda'}</td>
                        <td className="im-mono">{t.qty.toFixed(4)}</td>
                        <td className="im-mono">{t.pricePerUnit>0?t.pricePerUnit.toFixed(4):'—'}</td>
                        <td className="im-mono">{t.totalCost>0?fmtEur(t.totalCost):'—'}</td>
                        <td className="im-mono" style={{color:'rgba(255,255,255,0.25)'}}>{t.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error&&<div className="im-error">⚠ {error}</div>}

            <div className="im-footer">
              <button className="im-btn-cancel" onClick={()=>{setStep(0);setParsed(null);setError('')}}>Enrere</button>
              <button className="im-btn-import" onClick={handleImport} disabled={!selected.size||importing}>
                {importing ? 'Important...' : `Importar ${selected.size} transaccions`}
              </button>
            </div>
          </>)}

          {/* ── STEP 2: Done ── */}
          {step===2&&done&&(<>
            <div className="im-result">
              <div className="im-result-icon">✅</div>
              <p className="im-result-title">{done.count} transaccions importades</p>
              <p className="im-result-sub">des de <strong style={{color:'rgba(255,255,255,0.60)'}}>{done.broker}</strong><br/>Les inversions s'han actualitzat correctament.</p>
            </div>
            <div className="im-footer">
              <button className="im-btn-import" onClick={onClose}>Tancar</button>
            </div>
          </>)}
        </div>
      </div>
    </div>
  )
}