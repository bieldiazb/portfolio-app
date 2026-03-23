import { useState } from 'react'
import { fmtEur } from '../utils/format'
import styles from './SavingsList.module.css'
import modalStyles from './Modal.module.css'

export default function SavingsList({ savings, onAdd, onRemove }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.sectionTitle}>Comptes d'estalvi</span>
        <button className={`${styles.btn} ${styles.primary}`} onClick={() => setShowModal(true)}>
          + Afegir
        </button>
      </div>

      {savings.length === 0 ? (
        <div className={styles.empty}>— cap compte d'estalvi registrat —</div>
      ) : (
        <div className={styles.list}>
          {savings.map(s => (
            <SavingsCard key={s.id} s={s} onRemove={onRemove} />
          ))}
        </div>
      )}

      {showModal && (
        <AddSavingsModal
          onAdd={(s) => { onAdd(s); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function SavingsCard({ s, onRemove }) {
  const annual = s.rate ? s.amount * s.rate / 100 : 0
  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <div className={styles.cardName}>{s.name}</div>
        <div className={styles.cardMeta}>
          {s.rate ? `${s.rate}% TAE` : 'sense interès'}
          {s.notes ? ` · ${s.notes}` : ''}
        </div>
        {annual > 0 && (
          <div className={styles.cardInterest}>+{fmtEur(annual)}/any estimat</div>
        )}
      </div>
      <div className={styles.cardRight}>
        <div className={styles.cardAmount}>{fmtEur(s.amount)}</div>
        <button className={styles.removeBtn} onClick={() => onRemove(s.id)}>×</button>
      </div>
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
    if (isNaN(amount) || amount < 0) return setError('El saldo ha de ser un número positiu')
    setError('')
    onAdd({
      name: form.name.trim(),
      amount,
      rate: parseFloat(form.rate) || 0,
      notes: form.notes.trim(),
    })
  }

  return (
    <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.modal}>
        <div className={modalStyles.title}>Nou compte d'estalvi</div>

        <label className={modalStyles.label}>Nom del compte</label>
        <input className={modalStyles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Compte N26, Dipòsit ING..." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className={modalStyles.label}>Saldo (€)</label>
            <input className={modalStyles.input} type="number" step="any" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={modalStyles.label}>TAE (%)</label>
            <input className={modalStyles.input} type="number" step="any" min="0" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <label className={modalStyles.label}>Notes (opcional)</label>
        <input className={modalStyles.input} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="ex: venciment juny 2025..." />

        {error && <div className={modalStyles.error}>{error}</div>}

        <div className={modalStyles.actions}>
          <button className={modalStyles.btnSecondary} onClick={onClose}>Cancel·lar</button>
          <button className={modalStyles.btnPrimary} onClick={handleSubmit}>Afegir compte</button>
        </div>
      </div>
    </div>
  )
}
