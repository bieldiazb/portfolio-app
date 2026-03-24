import { useState } from 'react'
import { SHARED_STYLES, TYPE_COLORS } from './design-tokens'

const TYPE_OPTIONS = [
  { value: 'etf',     label: 'ETF',    short: 'ETF' },
  { value: 'stock',   label: 'Acció',  short: 'ACC' },
  { value: 'robo',    label: 'Robo',   short: 'ROB' },
  { value: 'efectiu', label: 'Efectiu',short: 'EFE' },
  { value: 'estalvi', label: 'Estalvi',short: 'EST' },
]

const modalStyles = `
  .aim2-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.82); backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center; z-index: 50;
  }
  @media (min-width: 640px) { .aim2-overlay { align-items: center; padding: 1rem; } }

  .aim2-modal {
    font-family: 'Geist', sans-serif;
    background: #0f0f0f;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px 12px 0 0;
    width: 100%; padding: 22px;
    max-height: 92vh; overflow-y: auto;
  }
  @media (min-width: 640px) { .aim2-modal { max-width: 400px; border-radius: 10px; } }

  .aim2-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .aim2-title { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .aim2-close {
    width: 24px; height: 24px; border-radius: 4px;
    background: rgba(255,255,255,0.06); border: none;
    color: rgba(255,255,255,0.38); font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-family: inherit; line-height: 1;
  }
  .aim2-close:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.65); }

  /* Type selector */
  .aim2-tgrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin-bottom: 18px; }
  .aim2-tbtn {
    display: flex; flex-direction: column; align-items: center;
    padding: 8px 3px 7px; border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    cursor: pointer; gap: 4px; transition: all 100ms;
    font-family: 'Geist', sans-serif;
  }
  .aim2-tbtn:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); }
  .aim2-tbtn.sel { border-width: 1px; }
  .aim2-tav {
    width: 26px; height: 26px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 600; letter-spacing: 0.02em;
  }
  .aim2-tlbl { font-size: 9px; font-weight: 400; color: rgba(255,255,255,0.30); text-align: center; line-height: 1.2; transition: color 100ms; }
  .aim2-tbtn.sel .aim2-tlbl { color: rgba(255,255,255,0.55); }

  /* Fields */
  .aim2-space { display: flex; flex-direction: column; gap: 11px; }
  .aim2-lbl { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
  .aim2-inp {
    width: 100%;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px; padding: 9px 11px;
    font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,0.82); outline: none; transition: border-color 100ms;
  }
  .aim2-inp:focus { border-color: rgba(255,255,255,0.22); }
  .aim2-inp::placeholder { color: rgba(255,255,255,0.18); }
  .aim2-inp.mono { font-family: 'Geist Mono', monospace; text-align: right; letter-spacing: -0.1px; }
  .aim2-inp.date { font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.55); cursor: pointer; }
  .aim2-inp.date::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
  .aim2-hint { font-size: 10px; color: rgba(255,255,255,0.20); margin-top: 4px; font-family: 'Geist Mono', monospace; }
  .aim2-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .aim2-error { font-size: 11px; color: rgba(255,90,70,0.80); background: rgba(255,60,40,0.08); border: 1px solid rgba(255,60,40,0.14); border-radius: 5px; padding: 8px 11px; }

  /* Footer */
  .aim2-footer { display: flex; gap: 8px; margin-top: 18px; }
  .aim2-cancel {
    flex: 1; border: 1px solid rgba(255,255,255,0.07); background: transparent;
    color: rgba(255,255,255,0.34); padding: 10px; border-radius: 5px;
    font-family: 'Geist', sans-serif; font-size: 12px; cursor: pointer; transition: all 100ms;
  }
  .aim2-cancel:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.58); }
  .aim2-submit {
    flex: 1; background: rgba(255,255,255,0.92); border: none;
    color: #080808; padding: 10px; border-radius: 5px;
    font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background 100ms;
  }
  .aim2-submit:hover { background: #fff; }
`

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="aim2-lbl">{label}</label>
      {children}
      {hint && <p className="aim2-hint">{hint}</p>}
    </div>
  )
}

export default function AddInvestmentModal({ onAdd, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    type: 'etf', name: '', ticker: '', qty: '', initialValue: '', purchaseDate: today,
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hasQty = !['efectiu', 'estalvi', 'robo'].includes(form.type)
  const tc = TYPE_COLORS[form.type] || TYPE_COLORS.etf

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    const val = parseFloat(form.initialValue)
    if (isNaN(val) || val < 0) return setError('El valor ha de ser positiu')
    if (hasQty && !form.qty) return setError('La quantitat és obligatòria')
    setError('')
    onAdd({
      name: form.name.trim(),
      ticker: form.ticker.trim().toUpperCase(),
      type: form.type,
      initialValue: val,
      qty: hasQty ? parseFloat(form.qty) : null,
      currentPrice: null,
      purchaseDate: form.purchaseDate || today,
      // Moviment registrat automàticament
      movements: [{
        date: form.purchaseDate || today,
        amount: val,
        qty: hasQty ? parseFloat(form.qty) : null,
        note: 'Posició inicial',
      }],
    })
  }

  return (
    <>
      <style>{`${SHARED_STYLES}${modalStyles}`}</style>
      <div className="aim2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="aim2-modal">

          <div className="aim2-hdr">
            <h3 className="aim2-title">Nova posició</h3>
            <button className="aim2-close" onClick={onClose}>×</button>
          </div>

          {/* Type selector */}
          <div className="aim2-tgrid">
            {TYPE_OPTIONS.map(t => {
              const isSelected = form.type === t.value
              const color = TYPE_COLORS[t.value] || TYPE_COLORS.etf
              return (
                <button
                  key={t.value}
                  className={`aim2-tbtn${isSelected ? ' sel' : ''}`}
                  style={isSelected ? { background: color.bg, borderColor: color.color.replace('0.85', '0.30') } : {}}
                  onClick={() => set('type', t.value)}
                >
                  <div className="aim2-tav" style={{
                    background: isSelected ? color.bg : 'rgba(255,255,255,0.06)',
                    color: isSelected ? color.color : 'rgba(255,255,255,0.28)',
                  }}>
                    {t.short}
                  </div>
                  <span className="aim2-tlbl">{t.label}</span>
                </button>
              )
            })}
          </div>

          <div className="aim2-space">
            <Field label="Nom">
              <input className="aim2-inp" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="ex: iShares MSCI World..." autoFocus />
            </Field>

            {hasQty && (
              <Field label="Ticker Yahoo Finance" hint="→ finance.yahoo.com">
                <input className="aim2-inp" style={{ fontFamily: "'Geist Mono', monospace", letterSpacing: '0.02em' }}
                  value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())}
                  placeholder="EUNL.DE, AAPL..." />
              </Field>
            )}

            <div className={hasQty ? 'aim2-g2' : ''}>
              {hasQty && (
                <Field label="Quantitat">
                  <input type="number" step="any" className="aim2-inp mono"
                    value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="0.00" />
                </Field>
              )}
              <Field label="Cost total (€)">
                <input type="number" step="any" className="aim2-inp mono"
                  value={form.initialValue} onChange={e => set('initialValue', e.target.value)} placeholder="0.00" />
              </Field>
            </div>

            <Field label="Data de compra">
              <input type="date" className="aim2-inp date"
                value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
            </Field>

            {error && <p className="aim2-error">{error}</p>}
          </div>

          <div className="aim2-footer">
            <button className="aim2-cancel" onClick={onClose}>Cancel·lar</button>
            <button className="aim2-submit" onClick={handleSubmit}>Afegir posició</button>
          </div>
        </div>
      </div>
    </>
  )
}