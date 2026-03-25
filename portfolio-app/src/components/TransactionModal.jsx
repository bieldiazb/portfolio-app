// ─── TransactionModal ─────────────────────────────────────────────────────────
function TransactionModal({ accountName, defaultType, onAdd, onClose }) {
  const [type, setType]     = useState(defaultType || 'deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [error, setError]   = useState('')
  const isDeposit = type === 'deposit'

  const submit = () => {
    const v = parseFloat(amount)
    if (!v || v <= 0) return setError('Introdueix un import vàlid')
    setError('')
    onAdd({ amount: v, type, note })
  }

  return (
    <div className="sv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">{accountName}</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-type-row">
          <button className={`sv-type-tab${type === 'deposit' ? ' grn' : ''}`} onClick={() => setType('deposit')}>↑ Ingrés</button>
          <button className={`sv-type-tab${type === 'withdraw' ? ' org' : ''}`} onClick={() => setType('withdraw')}>↓ Retirada</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Import (€)</label>
            <input type="number" step="any" className="sv-inp mono sv-big-inp" autoFocus
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="sv-lbl">Descripció</label>
            <input className="sv-inp" value={note} onChange={e => setNote(e.target.value)}
              placeholder={isDeposit ? 'ex: Nòmina, transferència...' : 'ex: Vacances, compra...'} />
          </div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`sv-btn-ok ${isDeposit ? 'grn' : 'org'}`} onClick={submit}>
            {isDeposit ? '+ Afegir ingrés' : '− Registrar retirada'}
          </button>
        </div>
      </div>
    </div>
  )
}