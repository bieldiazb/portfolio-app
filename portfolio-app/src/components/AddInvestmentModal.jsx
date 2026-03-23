import { useState } from 'react'
import styles from './Modal.module.css'

const TYPE_HINTS = {
  etf:    'ex: IWDA.AS, VUSA.L, CSPX.L',
  stock:  'ex: AAPL, LMT, IBE.MC',
  efectiu: 'deixa buit — no té preu de mercat',
  estalvi: 'deixa buit — no té preu de mercat',
  robo:    'deixa buit — actualitza manualment',
}

export default function AddInvestmentModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    type: 'etf',
    name: '',
    ticker: '',
    initialValue: '',
  })
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    const val = parseFloat(form.initialValue)
    if (isNaN(val) || val < 0) return setError('El valor inicial ha de ser un número positiu')
    setError('')
    onAdd({
      name: form.name.trim(),
      ticker: form.ticker.trim().toUpperCase(),
      type: form.type,
      initialValue: val,
      currentPrice: null,
    })
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.title}>Nova inversió</div>

        <label className={styles.label}>Tipus</label>
        <select className={styles.input} value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="etf">ETF</option>
          <option value="stock">Acció</option>
          <option value="efectiu">Efectiu / Liquiditat</option>
          <option value="estalvi">Estalvi</option>
          <option value="robo">Robo Advisor</option>
        </select>

        <label className={styles.label}>Nom</label>
        <input
          className={styles.input}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="ex: iShares MSCI World..."
        />

        <label className={styles.label}>
          Ticker Yahoo Finance
          <span className={styles.hint}>{TYPE_HINTS[form.type]}</span>
        </label>
        <input
          className={styles.input}
          value={form.ticker}
          onChange={e => set('ticker', e.target.value.toUpperCase())}
          placeholder={form.type === 'etf' ? 'IWDA.AS' : form.type === 'stock' ? 'LMT' : ''}
          disabled={['efectiu', 'estalvi', 'robo'].includes(form.type)}
        />

        <label className={styles.label}>Valor inicial / cost (€)</label>
        <input
          className={styles.input}
          type="number"
          step="any"
          min="0"
          value={form.initialValue}
          onChange={e => set('initialValue', e.target.value)}
          placeholder="0.00"
        />

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel·lar</button>
          <button className={styles.btnPrimary} onClick={handleSubmit}>Afegir posició</button>
        </div>
      </div>
    </div>
  )
}
