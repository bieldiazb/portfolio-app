import { useState, useRef, useCallback } from 'react'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { fmtEur } from '../utils/format'
import { parseCSV } from '../utils/Csvparsers'

const BROKER_HINTS = {
  'DEGIRO':               { cols: 'Date, Product, ISIN, Quantity, Price, Value', color: COLORS.neonGreen },
  'Interactive Brokers':  { cols: 'Symbol, Date/Time, Quantity, T. Price, Proceeds', color: COLORS.neonCyan },
  'Revolut':              { cols: 'Date, Ticker, Type, Shares, Price per share, Total Amount', color: COLORS.neonPurple },
  'Trade Republic':       { cols: 'Date, Instrument, ISIN, Shares, Price, Total', color: COLORS.neonAmber },
  'Schwab':               { cols: 'Date, Action, Symbol, Quantity, Price, Amount', color: COLORS.neonRed },
  'Fidelity':             { cols: 'Run Date, Action, Symbol, Quantity, Price, Amount', color: '#ff9500' },
  'Genèric':              { cols: 'date, ticker/name, qty, price, total, action (buy/sell)', color: COLORS.textMuted },
}

const styles = `
  .im-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.88); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px; }
  .im-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px; width:100%; max-width:620px; max-height:92vh; overflow-y:auto; font-family:${FONTS.sans}; }

  .im-hdr { display:flex; align-items:center; justify-content:space-between; padding:20px 22px 0; margin-bottom:20px; }
  .im-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .im-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }

  .im-body { padding:0 22px 22px; display:flex; flex-direction:column; gap:16px; }

  /* Steps */
  .im-steps { display:flex; gap:0; }
  .im-step { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:500; }
  .im-step-num { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .im-step.done .im-step-num { background:${COLORS.neonGreen}; color:#000; }
  .im-step.active .im-step-num { background:${COLORS.neonPurple}; color:#fff; }
  .im-step.pending .im-step-num { background:${COLORS.elevated}; color:${COLORS.textMuted}; border:1px solid ${COLORS.border}; }
  .im-step.done .im-step-label { color:${COLORS.neonGreen}; }
  .im-step.active .im-step-label { color:${COLORS.textPrimary}; }
  .im-step.pending .im-step-label { color:${COLORS.textMuted}; }
  .im-step-sep { width:24px; height:1px; background:${COLORS.border}; margin:0 4px; flex-shrink:0; }

  /* Drop zone */
  .im-drop { border:1px dashed ${COLORS.borderHi}; border-radius:6px; padding:32px 20px; text-align:center; cursor:pointer; transition:all 150ms; }
  .im-drop:hover, .im-drop.over { border-color:${COLORS.neonPurple}; background:rgba(123,97,255,0.05); }
  .im-drop-icon { font-size:28px; margin-bottom:10px; }
  .im-drop-main { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; margin-bottom:4px; }
  .im-drop-sub  { font-size:11px; color:${COLORS.textMuted}; }
  .im-drop-btn  { display:inline-block; margin-top:10px; padding:6px 14px; border:1px solid ${COLORS.border}; border-radius:4px; font-size:12px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .im-drop-btn:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }

  /* Broker detected */
  .im-detected { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:5px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; }
  .im-detected-badge { font-size:10px; font-weight:700; font-family:${FONTS.mono}; padding:3px 8px; border-radius:3px; flex-shrink:0; }
  .im-detected-info { flex:1; min-width:0; }
  .im-detected-name { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; margin-bottom:2px; }
  .im-detected-cols { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .im-change-file { font-size:11px; color:${COLORS.textMuted}; cursor:pointer; text-decoration:underline; flex-shrink:0; }
  .im-change-file:hover { color:${COLORS.textSecondary}; }

  /* Preview taula */
  .im-preview { background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; overflow:hidden; }
  .im-preview-hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid ${COLORS.border}; }
  .im-preview-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }
  .im-preview-count { font-size:11px; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; }

  .im-table-wrap { overflow-x:auto; max-height:280px; overflow-y:auto; }
  .im-table { width:100%; border-collapse:collapse; font-size:11px; }
  .im-table th { padding:7px 10px; font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid ${COLORS.border}; text-align:left; white-space:nowrap; background:${COLORS.bg}; position:sticky; top:0; }
  .im-table td { padding:8px 10px; border-bottom:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; vertical-align:middle; white-space:nowrap; }
  .im-table tr:last-child td { border-bottom:none; }
  .im-table tr:hover td { background:${COLORS.elevated}; }
  .im-buy  { color:${COLORS.neonGreen}; font-weight:600; }
  .im-sell { color:${COLORS.neonAmber}; font-weight:600; }
  .im-mono { font-family:${FONTS.mono}; }

  /* Checkbox selecció */
  .im-check { width:14px; height:14px; cursor:pointer; accent-color:${COLORS.neonPurple}; }

  /* Warnings */
  .im-warn { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; background:${COLORS.bgAmber}; border:1px solid ${COLORS.borderAmber}; border-radius:4px; font-size:11px; color:${COLORS.neonAmber}; }
  .im-error { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:4px; font-size:11px; color:${COLORS.neonRed}; }

  /* Accions */
  .im-footer { display:flex; gap:8px; padding-top:4px; }
  .im-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .im-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .im-btn-import { flex:2; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; background:${COLORS.neonPurple}; color:#fff; cursor:pointer; transition:opacity 100ms; }
  .im-btn-import:hover { opacity:0.85; }
  .im-btn-import:disabled { opacity:0.35; cursor:not-allowed; }

  /* Result */
  .im-result { text-align:center; padding:20px 0; }
  .im-result-icon { font-size:36px; margin-bottom:10px; }
  .im-result-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; margin-bottom:6px; }
  .im-result-sub { font-size:12px; color:${COLORS.textMuted}; }

  /* Brokers list */
  .im-brokers { display:flex; gap:6px; flex-wrap:wrap; }
  .im-broker-chip { font-size:10px; font-weight:500; font-family:${FONTS.mono}; padding:3px 9px; border-radius:3px; border:1px solid ${COLORS.border}; color:${COLORS.textMuted}; background:${COLORS.elevated}; }
`

const STEPS = ['Fitxer', 'Previsualització', 'Importar']

export default function ImportCSVModal({ onClose, onImport }) {
  const [step, setStep]             = useState(0)
  const [parsed, setParsed]         = useState(null)
  const [selected, setSelected]     = useState(new Set())
  const [dragging, setDragging]     = useState(false)
  const [importing, setImporting]   = useState(false)
  const [done, setDone]             = useState(null)
  const [error, setError]           = useState('')
  const fileRef = useRef(null)

  const processFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Cal un fitxer .csv vàlid')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text   = e.target.result
      const result = parseCSV(text)
      if (!result.transactions.length) {
        setError('No s\'han trobat transaccions. Comprova que el CSV sigui correcte.')
        return
      }
      setParsed(result)
      setSelected(new Set(result.transactions.map((_, i) => i)))
      setStep(1)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop = e => {
    e.preventDefault(); setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleFile = e => processFile(e.target.files[0])

  const toggleRow = i => setSelected(s => {
    const n = new Set(s)
    n.has(i) ? n.delete(i) : n.add(i)
    return n
  })

  const toggleAll = () => {
    if (selected.size === parsed.transactions.length) setSelected(new Set())
    else setSelected(new Set(parsed.transactions.map((_, i) => i)))
  }

  const handleImport = async () => {
    if (!parsed || !selected.size) return
    setImporting(true)
    const toImport = parsed.transactions.filter((_, i) => selected.has(i))
    try {
      await onImport(toImport, parsed.broker)
      setDone({ count: toImport.length, broker: parsed.broker })
      setStep(2)
    } catch (err) {
      setError('Error important: ' + (err.message || 'error desconegut'))
    }
    setImporting(false)
  }

  const brokerHint = parsed ? BROKER_HINTS[parsed.broker] || BROKER_HINTS['Genèric'] : null

  return (
    <div className="im-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <div className="im-modal">
        <div className="im-hdr">
          <h3 className="im-title">Importar des de broker (CSV)</h3>
          <button className="im-x" onClick={onClose}>×</button>
        </div>

        <div className="im-body">
          {/* Steps */}
          <div className="im-steps">
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`im-step ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                  <div className="im-step-num">{i < step ? '✓' : i + 1}</div>
                  <span className="im-step-label" style={{ fontSize: 11 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="im-step-sep"/>}
              </div>
            ))}
          </div>

          {/* STEP 0: Upload */}
          {step === 0 && (
            <>
              <div className="im-drop" onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={dragging ? { borderColor: COLORS.neonPurple, background: 'rgba(123,97,255,0.05)' } : {}}>
                <div className="im-drop-icon">📂</div>
                <p className="im-drop-main">Arrossega el CSV del teu broker aquí</p>
                <p className="im-drop-sub">o fes clic per seleccionar el fitxer</p>
                <span className="im-drop-btn">Seleccionar fitxer</span>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile}/>
              </div>

              <div>
                <p style={{ fontSize: 10, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Brokers suportats</p>
                <div className="im-brokers">
                  {Object.keys(BROKER_HINTS).map(b => (
                    <span key={b} className="im-broker-chip">{b}</span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 5 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Format genèric</p>
                <p style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono, lineHeight: 1.6 }}>
                  Si el teu broker no és de la llista, exporta un CSV amb columnes:<br/>
                  <span style={{ color: COLORS.textSecondary }}>date, ticker, name, qty, price, total, action (buy/sell), type (etf/stock)</span>
                </p>
              </div>

              {error && <div className="im-error">⚠ {error}</div>}
            </>
          )}

          {/* STEP 1: Preview */}
          {step === 1 && parsed && (
            <>
              <div className="im-detected">
                <span className="im-detected-badge" style={{ background: `${brokerHint?.color}18`, color: brokerHint?.color }}>
                  {parsed.broker}
                </span>
                <div className="im-detected-info">
                  <p className="im-detected-name">Broker detectat automàticament</p>
                  <p className="im-detected-cols">{brokerHint?.cols}</p>
                </div>
                <span className="im-change-file" onClick={() => { setStep(0); setParsed(null) }}>
                  Canviar fitxer
                </span>
              </div>

              {parsed.transactions.some(t => !t.ticker && !t.name) && (
                <div className="im-warn">
                  ⚠ Algunes files no tenen ticker identificable. Revisa-les abans d'importar.
                </div>
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
                        <th><input type="checkbox" className="im-check" checked={selected.size === parsed.transactions.length} onChange={toggleAll}/></th>
                        <th>Data</th>
                        <th>Nom / Ticker</th>
                        <th>Acció</th>
                        <th>Quantitat</th>
                        <th>Preu/u</th>
                        <th>Total</th>
                        <th>Moneda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.transactions.map((t, i) => (
                        <tr key={i} onClick={() => toggleRow(i)} style={{ cursor: 'pointer', opacity: selected.has(i) ? 1 : 0.35 }}>
                          <td><input type="checkbox" className="im-check" checked={selected.has(i)} onChange={() => toggleRow(i)} onClick={e => e.stopPropagation()}/></td>
                          <td className="im-mono">{t.date}</td>
                          <td>
                            <p style={{ fontSize: 11, fontWeight: 500, color: COLORS.textPrimary, marginBottom: 1 }}>{t.name || t.ticker || '—'}</p>
                            {t.ticker && t.ticker !== t.name && <p style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: FONTS.mono }}>{t.ticker}</p>}
                          </td>
                          <td className={t.action === 'buy' ? 'im-buy' : 'im-sell'}>{t.action === 'buy' ? '↑ Compra' : '↓ Venda'}</td>
                          <td className="im-mono">{t.qty.toFixed(4)}</td>
                          <td className="im-mono">{t.pricePerUnit > 0 ? t.pricePerUnit.toFixed(4) : '—'}</td>
                          <td className="im-mono">{t.totalCost > 0 ? fmtEur(t.totalCost) : '—'}</td>
                          <td className="im-mono" style={{ color: COLORS.textMuted }}>{t.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && <div className="im-error">⚠ {error}</div>}

              <div className="im-footer">
                <button className="im-btn-cancel" onClick={() => { setStep(0); setParsed(null); setError('') }}>Enrere</button>
                <button className="im-btn-import" onClick={handleImport} disabled={!selected.size || importing}>
                  {importing ? 'Important...' : `Importar ${selected.size} transaccions`}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Done */}
          {step === 2 && done && (
            <>
              <div className="im-result">
                <div className="im-result-icon">✅</div>
                <p className="im-result-title">{done.count} transaccions importades</p>
                <p className="im-result-sub">des de {done.broker} · Les inversions s'han actualitzat</p>
              </div>
              <div className="im-footer">
                <button className="im-btn-import" onClick={onClose}>Tancar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}