import { useState } from 'react'
import { fmtEur, fmtPct, TYPE_META, getEffectiveValue } from '../utils/format'
import AddInvestmentModal from './AddInvestmentModal'
import { SHARED_STYLES, TYPE_COLORS } from './design-tokens'

const TYPE_LABELS = { etf: 'ETF', stock: 'Acció', crypto: 'Crypto', robo: 'Robo', estalvi: 'Estalvi', efectiu: 'Efectiu' }

export default function InvestmentsTable({ investments, onAdd, onRemove, onUpdate, onRefresh, loading, status }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  return (
    <div style={{ fontFamily: "'Geist', sans-serif" }}>
      <style>{SHARED_STYLES}</style>

      <div className="sec-v2-hdr">
        <div>
          <h2 className="sec-v2-title">Posicions obertes</h2>
          <p className="sec-v2-sub">{status}</p>
        </div>
        <div className="sec-v2-btns">
          <button className="btn-v2-ico" onClick={onRefresh} disabled={loading} title="Actualitzar">
            <span className={loading ? 'v2-spin' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </span>
          </button>
          <button className="btn-v2-primary" onClick={() => setShowModal(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Afegir
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="v2-empty">Cap inversió registrada</div>
      ) : (
        <div>
          {investments.map(inv => (
            <InvestmentRow key={inv.id} inv={inv} onRemove={onRemove} onEdit={() => setEditing(inv)} />
          ))}
        </div>
      )}

      {showModal && (
        <AddInvestmentModal
          onAdd={inv => { onAdd(inv); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
      {editing && (
        <EditInvestmentModal
          inv={editing}
          onSave={data => { onUpdate(editing.id, data); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function InvestmentRow({ inv, onRemove, onEdit }) {
  const val     = getEffectiveValue(inv)
  const pg      = val - inv.initialValue
  const pgPct   = inv.initialValue > 0 ? (pg / inv.initialValue) * 100 : 0
  const hasLive = inv.ticker && !['efectiu', 'estalvi', 'robo'].includes(inv.type)
  const isPos   = pg >= 0
  const tc      = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
  const label   = TYPE_LABELS[inv.type] || inv.type

  return (
    <div className="row-v2">
      <div className="av-v2" style={{ background: tc.bg, color: tc.color }}>
        {inv.name.slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="row-v2-name">{inv.name}</p>
        <div className="row-v2-meta">
          <span className="row-v2-badge" style={{ background: tc.bg, color: tc.color }}>{label}</span>
          {inv.ticker && <><span className="row-v2-dot">·</span><span className="row-v2-ticker">{inv.ticker}</span></>}
          {inv.qty    && <><span className="row-v2-dot">·</span><span className="row-v2-ticker">{inv.qty} u.</span></>}
        </div>
      </div>

      {/* Price — hidden on mobile */}
      <div style={{ textAlign: 'right', marginRight: 16, minWidth: 64, flexShrink: 0 }} className="hidden sm:block">
        {hasLive ? (
          inv.currentPrice !== null
            ? <p className="row-v2-price">{fmtEur(inv.currentPrice)}</p>
            : <span className="row-v2-price v2-pulse" style={{ letterSpacing: 2 }}>···</span>
        ) : (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)' }}>—</span>
        )}
        <p className="row-v2-price-lbl">preu/u.</p>
      </div>

      {/* Value + P&G */}
      <div style={{ textAlign: 'right', minWidth: 88, marginRight: 4, flexShrink: 0 }}>
        <p className="row-v2-val">{fmtEur(val)}</p>
        <p className={`row-v2-pg ${isPos ? 'pos' : 'neg'}`}>
          {isPos ? '+' : ''}{fmtEur(pg)} {fmtPct(pgPct)}
        </p>
      </div>

      {/* Actions */}
      <div className="row-v2-acts">
        <button className="row-v2-btn" onClick={onEdit} title="Editar">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="row-v2-btn del" onClick={() => onRemove(inv.id)} title="Eliminar">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="v2-field-label">{label}</label>
      {children}
    </div>
  )
}

function EditInvestmentModal({ inv, onSave, onClose }) {
  const [form, setForm] = useState({
    name: inv.name || '', ticker: inv.ticker || '', type: inv.type || 'etf',
    qty: inv.qty ?? '', initialValue: inv.initialValue ?? '', note: inv.note || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hasQty = !['efectiu', 'estalvi', 'robo'].includes(form.type)

  return (
    <div className="v2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="v2-modal">
        <div className="v2-modal-hdr">
          <h3 className="v2-modal-title">Editar posició</h3>
          <button className="v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="v2-space">
          <Field label="Tipus">
            <select className="v2-input" value={form.type} onChange={e => set('type', e.target.value)}
              style={{ cursor: 'pointer' }}>
              <option value="etf">ETF</option>
              <option value="stock">Acció</option>
              <option value="efectiu">Efectiu</option>
              <option value="estalvi">Estalvi</option>
              <option value="robo">Robo Advisor</option>
            </select>
          </Field>
          <Field label="Nom">
            <input className="v2-input" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          {hasQty && (
            <Field label="Ticker Yahoo Finance">
              <input className="v2-input mono" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} style={{ textAlign: 'left', fontFamily: "'Geist Mono', monospace" }} />
            </Field>
          )}
          <div className={hasQty ? 'v2-grid2' : ''}>
            {hasQty && (
              <Field label="Quantitat">
                <input type="number" step="any" className="v2-input mono" value={form.qty} onChange={e => set('qty', e.target.value)} />
              </Field>
            )}
            <Field label="Cost total (€)">
              <input type="number" step="any" className="v2-input mono" value={form.initialValue} onChange={e => set('initialValue', e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <input className="v2-input" value={form.note} onChange={e => set('note', e.target.value)} placeholder="opcional" />
          </Field>
        </div>
        <div className="v2-modal-footer">
          <button className="v2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="v2-btn-submit" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  )
}