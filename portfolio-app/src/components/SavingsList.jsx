import { useState } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'

const mobileActsCss = `
  .sv-acts { display: flex; gap: 3px; flex-shrink: 0; margin-left: 6px; }
  .sv-act-btn {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 100ms, color 100ms, transform 80ms;
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.35);
  }
  .sv-act-btn.del { color: rgba(220,70,55,0.55); }
  .sv-act-btn:active { transform: scale(0.88); }

  @media (hover: hover) and (pointer: fine) {
    .sv-acts { opacity: 0; transition: opacity 100ms; }
    .sv-row:hover .sv-acts { opacity: 1; }
    .sv-act-btn { background: transparent; color: rgba(255,255,255,0.22); }
    .sv-act-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.68); }
    .sv-act-btn.del { color: rgba(255,255,255,0.22); }
    .sv-act-btn.del:hover { background: rgba(200,40,30,0.10); color: rgba(220,70,55,0.80); }
  }
`

const svStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  .sv { font-family: 'Geist', sans-serif; }
  .sv-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .sv-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72); letter-spacing: -0.2px; }
  .sv-sub { font-size: 11px; color: rgba(255,255,255,0.24); margin-top: 2px; display: flex; align-items: center; gap: 5px; }
  .sv-interest { color: rgba(80,210,110,0.65); }
  .sv-btn-add { display: flex; align-items: center; gap: 4px; padding: 0 11px; height: 28px; background: rgba(255,255,255,0.92); color: #080808; border: none; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 100ms; white-space: nowrap; flex-shrink: 0; }
  .sv-btn-add:hover { background: #fff; }
  .sv-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
  .sv-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: default; }
  .sv-row:last-child { border-bottom: none; }
  .sv-ic { width: 32px; height: 32px; border-radius: 6px; background: rgba(80,200,110,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px; }
  .sv-info { flex: 1; min-width: 0; }
  .sv-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.78); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sv-meta { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; }
  .sv-vc { text-align: right; flex-shrink: 0; }
  .sv-amt { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.78); font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .sv-ann { font-size: 10px; color: rgba(80,210,110,0.72); font-family: 'Geist Mono', monospace; margin-top: 2px; }
`

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

export default function SavingsList({ savings, onAdd, onRemove }) {
  const [showModal, setShowModal] = useState(false)
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const total    = savings.reduce((s, sv) => s + sv.amount, 0)
  const interest = savings.reduce((s, sv) => s + (sv.rate ? sv.amount * sv.rate / 100 : 0), 0)

  return (
    <div className="sv">
      <style>{svStyles + mobileActsCss}</style>

      {/* ConfirmDialog com a component normal — funciona sempre */}
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="sv-hdr">
        <div>
          <h2 className="sv-title">Estalvis</h2>
          <div className="sv-sub">
            <span style={{ fontFamily: "'Geist Mono', monospace", letterSpacing: '-0.3px' }}>{fmtEur(total)}</span>
            {interest > 0 && <span className="sv-interest">· +{fmtEur(interest)}/any</span>}
          </div>
        </div>
        <button className="sv-btn-add" onClick={() => setShowModal(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Afegir
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="sv-empty">Cap compte registrat</div>
      ) : savings.map(s => (
        <div key={s.id} className="sv-row">
          <div className="sv-ic">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(80,210,110,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div className="sv-info">
            <p className="sv-name">{s.name}</p>
            <p className="sv-meta">{s.rate ? `${s.rate}% TAE` : 'Sense interès'}{s.notes ? ` · ${s.notes}` : ''}</p>
          </div>
          <div className="sv-vc">
            <p className="sv-amt">{fmtEur(s.amount)}</p>
            {s.rate > 0 && <p className="sv-ann">+{fmtEur(s.amount * s.rate / 100)}/any</p>}
          </div>
          <div className="sv-acts">
            <button className="sv-act-btn del" title="Eliminar"
              onClick={() => askConfirm({ name: s.name, onConfirm: () => onRemove(s.id) })}>
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}

      {showModal && (
        <AddSavingsModal
          onAdd={s => { onAdd(s); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
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

  const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '9px 11px', fontFamily: "'Geist', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.82)', outline: 'none' }
  const lbl = { display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px 12px 0 0', width: '100%', maxWidth: 420, padding: 22, fontFamily: "'Geist', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.3px' }}>Nou compte d'estalvi</h3>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.40)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div><label style={lbl}>Nom</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Compte N26..." autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Saldo (€)</label><input type="number" step="any" style={{ ...inp, textAlign: 'right', fontFamily: "'Geist Mono', monospace" }} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" /></div>
            <div><label style={lbl}>TAE (%)</label><input type="number" step="any" style={{ ...inp, textAlign: 'right', fontFamily: "'Geist Mono', monospace" }} value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0.00" /></div>
          </div>
          <div><label style={lbl}>Notes</label><input style={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="opcional" /></div>
          {error && <p style={{ fontSize: 12, color: 'rgba(255,80,60,0.80)', background: 'rgba(255,50,30,0.08)', border: '1px solid rgba(255,50,30,0.14)', borderRadius: 5, padding: '8px 11px' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', borderRadius: 6, fontFamily: "'Geist', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.36)', cursor: 'pointer' }}>Cancel·lar</button>
          <button onClick={handleSubmit} style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 6, fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 500, color: '#080808', cursor: 'pointer' }}>Afegir compte</button>
        </div>
      </div>
    </div>
  )
}