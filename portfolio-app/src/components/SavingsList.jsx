// ─── SavingsList.v2.jsx ─────────────────────────────────────────────────────

import { useState } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

export function SavingsList({ savings, onAdd, onRemove }) {
  const [showModal, setShowModal] = useState(false)
  const total    = savings.reduce((s, sv) => s + sv.amount, 0)
  const interest = savings.reduce((s, sv) => s + (sv.rate ? sv.amount * sv.rate / 100 : 0), 0)

  return (
    <div style={{ fontFamily: "'Geist', sans-serif" }}>
      <style>{SHARED_STYLES}</style>

      <div className="sec-v2-hdr">
        <div>
          <h2 className="sec-v2-title">Estalvis</h2>
          <p className="sec-v2-sub">
            <span style={{ fontFamily: "'Geist Mono', monospace" }}>{fmtEur(total)}</span>
            {interest > 0 && (
              <span style={{ color: 'rgba(80,210,110,0.65)', marginLeft: 6 }}>
                · +{fmtEur(interest)}/any
              </span>
            )}
          </p>
        </div>
        <button className="btn-v2-primary" onClick={() => setShowModal(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Afegir
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="v2-empty">Cap compte registrat</div>
      ) : (
        <div>
          {savings.map(s => <SavingsRow key={s.id} s={s} onRemove={onRemove} />)}
        </div>
      )}

      {showModal && (
        <AddSavingsModal
          onAdd={s => { onAdd(s); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function SavingsRow({ s, onRemove }) {
  const annual = s.rate ? s.amount * s.rate / 100 : 0
  return (
    <div className="row-v2">
      <div style={{
        width: 30, height: 30, borderRadius: 5, flexShrink: 0, marginRight: 10,
        background: 'rgba(80,200,110,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(80,210,110,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="row-v2-name">{s.name}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 2 }}>
          {s.rate ? `${s.rate}% TAE` : 'Sense interès'}{s.notes ? ` · ${s.notes}` : ''}
        </p>
      </div>
      <div style={{ textAlign: 'right', marginRight: 4 }}>
        <p className="row-v2-val">{fmtEur(s.amount)}</p>
        {annual > 0 && (
          <p style={{ fontSize: 10, color: 'rgba(80,210,110,0.72)', fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
            +{fmtEur(annual)}/any
          </p>
        )}
      </div>
      <div className="row-v2-acts" style={{ opacity: undefined }}>
        <button className="row-v2-btn del" onClick={() => onRemove(s.id)} title="Eliminar"
          style={{ opacity: 1, color: 'rgba(255,255,255,0.18)' }}>
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

function AddSavingsModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', amount: '', rate: '', notes: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount < 0) return setError('El saldo ha de ser positiu')
    setError('')
    onAdd({ name: form.name.trim(), amount, rate: parseFloat(form.rate) || 0, notes: form.notes.trim() })
  }

  return (
    <div className="v2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="v2-modal">
        <div className="v2-modal-hdr">
          <h3 className="v2-modal-title">Nou compte d'estalvi</h3>
          <button className="v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="v2-space">
          <Field label="Nom">
            <input className="v2-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Compte N26..." autoFocus />
          </Field>
          <div className="v2-grid2">
            <Field label="Saldo (€)">
              <input type="number" step="any" className="v2-input mono" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="TAE (%)">
              <input type="number" step="any" className="v2-input mono" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0.00" />
            </Field>
          </div>
          <Field label="Notes">
            <input className="v2-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="opcional" />
          </Field>
          {error && <p className="v2-error">{error}</p>}
        </div>
        <div className="v2-modal-footer">
          <button className="v2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="v2-btn-submit" onClick={handleSubmit}>Afegir compte</button>
        </div>
      </div>
    </div>
  )
}

export default SavingsList