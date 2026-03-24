import { useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'etf',     label: 'ETF',          bg: 'hsl(214 55% 16%)', color: 'hsl(214 80% 66%)' },
  { value: 'stock',   label: 'Acció',        bg: 'hsl(142 40% 12%)', color: 'hsl(142 60% 50%)' },
  { value: 'robo',    label: 'Robo Advisor', bg: 'hsl(270 35% 16%)', color: 'hsl(270 60% 66%)' },
  { value: 'efectiu', label: 'Efectiu',      bg: 'hsl(0 0% 11%)',    color: 'hsl(0 0% 50%)'    },
  { value: 'estalvi', label: 'Estalvi',      bg: 'hsl(142 40% 12%)', color: 'hsl(142 55% 46%)' },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

  .aim-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(5px);
    display: flex; align-items: flex-end; justify-content: center;
    z-index: 50;
  }
  @media (min-width: 640px) {
    .aim-overlay { align-items: center; padding: 1rem; }
  }

  .aim-modal {
    font-family: 'DM Sans', sans-serif;
    background: hsl(0 0% 8%);
    border: 1px solid hsl(0 0% 14%);
    border-radius: 20px 20px 0 0;
    width: 100%; padding: 24px;
    max-height: 92vh; overflow-y: auto;
  }
  @media (min-width: 640px) {
    .aim-modal { max-width: 420px; border-radius: 20px; }
  }

  .aim-hdr {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 22px;
  }
  .aim-title {
    font-size: 16px; font-weight: 600;
    color: hsl(0 0% 88%); letter-spacing: -0.3px;
  }
  .aim-close {
    width: 28px; height: 28px; border-radius: 50%;
    background: hsl(0 0% 13%); border: 1px solid hsl(0 0% 18%);
    color: hsl(0 0% 50%); font-size: 16px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 120ms; font-family: inherit;
    line-height: 1;
  }
  .aim-close:hover { color: hsl(0 0% 80%); background: hsl(0 0% 16%); }

  /* Type selector */
  .aim-type-grid {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 6px; margin-bottom: 20px;
  }
  .aim-type-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 9px 4px 7px;
    border-radius: 10px; border: 1px solid hsl(0 0% 14%);
    background: hsl(0 0% 10%); cursor: pointer;
    transition: all 120ms; font-family: 'DM Sans', sans-serif;
    gap: 4px;
  }
  .aim-type-btn:hover { border-color: hsl(0 0% 22%); background: hsl(0 0% 13%); }
  .aim-type-btn.selected { border-width: 1.5px; }

  .aim-type-av {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; letter-spacing: 0.02em;
  }
  .aim-type-label {
    font-size: 9.5px; font-weight: 600;
    color: hsl(0 0% 40%); letter-spacing: 0.01em;
    text-align: center; line-height: 1.2;
  }
  .aim-type-btn.selected .aim-type-label { color: hsl(0 0% 60%); }

  /* Fields */
  .aim-space { display: flex; flex-direction: column; gap: 13px; }
  .aim-field-label {
    display: block; font-size: 10.5px; font-weight: 600;
    color: hsl(0 0% 34%); text-transform: uppercase;
    letter-spacing: 0.07em; margin-bottom: 6px;
  }
  .aim-input {
    width: 100%;
    background: hsl(0 0% 11%); border: 1px solid hsl(0 0% 16%);
    border-radius: 10px; padding: 10px 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
    color: hsl(0 0% 84%); outline: none;
    transition: border-color 120ms;
    -webkit-appearance: none;
  }
  .aim-input:focus { border-color: hsl(142 60% 38%); }
  .aim-input::placeholder { color: hsl(0 0% 26%); }

  /* Ticker hint */
  .aim-hint {
    font-size: 11px; color: hsl(0 0% 28%); margin-top: 5px;
    font-family: 'DM Mono', monospace;
  }

  .aim-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* Error */
  .aim-error {
    font-size: 12.5px; font-weight: 500;
    color: hsl(4 72% 60%); background: hsl(4 72% 56% / 0.10);
    border: 1px solid hsl(4 72% 56% / 0.20);
    border-radius: 9px; padding: 9px 12px;
  }

  /* Footer */
  .aim-footer { display: flex; gap: 10px; margin-top: 22px; }
  .aim-btn-cancel {
    flex: 1; border: 1px solid hsl(0 0% 16%); background: transparent;
    color: hsl(0 0% 42%); padding: 12px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 120ms;
  }
  .aim-btn-cancel:hover { background: hsl(0 0% 11%); color: hsl(0 0% 66%); }
  .aim-btn-submit {
    flex: 1; background: hsl(142 60% 46%); border: none;
    color: hsl(0 0% 5%); padding: 12px; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: background 120ms;
  }
  .aim-btn-submit:hover { background: hsl(142 60% 40%); }
`

function Field({ label, children }) {
  return (
    <div>
      <label className="aim-field-label">{label}</label>
      {children}
    </div>
  )
}

export default function AddInvestmentModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ type: 'etf', name: '', ticker: '', qty: '', initialValue: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hasQty = !['efectiu', 'estalvi', 'robo'].includes(form.type)

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
    })
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type)

  return (
    <>
      <style>{styles}</style>
      <div className="aim-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="aim-modal">

          <div className="aim-hdr">
            <h3 className="aim-title">Nova posició</h3>
            <button className="aim-close" onClick={onClose}>×</button>
          </div>

          {/* Type selector */}
          <div className="aim-type-grid">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                className={`aim-type-btn${form.type === t.value ? ' selected' : ''}`}
                style={form.type === t.value
                  ? { background: t.bg, borderColor: t.color + '55' }
                  : {}
                }
                onClick={() => set('type', t.value)}
              >
                <div className="aim-type-av" style={{
                  background: form.type === t.value ? t.color + '22' : 'hsl(0 0% 14%)',
                  color: form.type === t.value ? t.color : 'hsl(0 0% 40%)',
                }}>
                  {t.label.slice(0, 3).toUpperCase()}
                </div>
                <span className="aim-type-label">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="aim-space">
            <Field label="Nom">
              <input
                className="aim-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="ex: iShares MSCI World..."
                autoFocus
              />
            </Field>

            {hasQty && (
              <Field label="Ticker Yahoo Finance">
                <input
                  className="aim-input"
                  style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.02em' }}
                  value={form.ticker}
                  onChange={e => set('ticker', e.target.value.toUpperCase())}
                  placeholder="EUNL.DE, LMT, AAPL..."
                />
                <p className="aim-hint">Busca el ticker a finance.yahoo.com</p>
              </Field>
            )}

            <div className={hasQty ? 'aim-grid2' : ''}>
              {hasQty && (
                <Field label="Quantitat">
                  <input
                    type="number" step="any"
                    className="aim-input"
                    style={{ fontFamily: "'DM Mono', monospace", textAlign: 'right' }}
                    value={form.qty}
                    onChange={e => set('qty', e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
              )}
              <Field label="Cost total (€)">
                <input
                  type="number" step="any"
                  className="aim-input"
                  style={{ fontFamily: "'DM Mono', monospace", textAlign: 'right' }}
                  value={form.initialValue}
                  onChange={e => set('initialValue', e.target.value)}
                  placeholder="0.00"
                />
              </Field>
            </div>

            {error && <p className="aim-error">{error}</p>}
          </div>

          <div className="aim-footer">
            <button className="aim-btn-cancel" onClick={onClose}>Cancel·lar</button>
            <button className="aim-btn-submit" onClick={handleSubmit}>Afegir posició</button>
          </div>

        </div>
      </div>
    </>
  )
}