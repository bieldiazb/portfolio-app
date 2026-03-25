// ─── NewAccountModal ──────────────────────────────────────────────────────────
function NewAccountModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', rate: '', notes: '', initialBalance: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    setError('')
    onAdd({ name: form.name.trim(), rate: parseFloat(form.rate) || 0, notes: form.notes.trim(), initialBalance: parseFloat(form.initialBalance) || 0 })
  }

  return (
    <div className="sv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">Nou compte d'estalvi</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Nom del compte</label>
            <input className="sv-inp" autoFocus value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: N26, BBVA Estalvi..." />
          </div>
          <div className="sv-grid2">
            <div>
              <label className="sv-lbl">Saldo inicial (€)</label>
              <input type="number" step="any" className="sv-inp mono" value={form.initialBalance} onChange={e => set('initialBalance', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="sv-lbl">TAE (%)</label>
              <input type="number" step="any" className="sv-inp mono" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="sv-lbl">Notes</label>
            <input className="sv-inp" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="opcional" />
          </div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="sv-btn-ok def" onClick={submit}>Crear compte</button>
        </div>
      </div>
    </div>
  )
}
