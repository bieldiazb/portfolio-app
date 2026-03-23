import { useState } from 'react'

const TYPE_HINTS = {
  etf:    'ex: IWDA.AS, VUSA.L, CSPX.L',
  stock:  'ex: AAPL, LMT, IBE.MC',
  efectiu: 'no té preu de mercat',
  estalvi: 'no té preu de mercat',
  robo:    'actualitza manualment',
}

export default function AddInvestmentModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ type: 'etf', name: '', ticker: '', initialValue: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    const val = parseFloat(form.initialValue)
    if (isNaN(val) || val < 0) return setError('El valor ha de ser un número positiu')
    setError('')
    onAdd({ name: form.name.trim(), ticker: form.ticker.trim().toUpperCase(), type: form.type, initialValue: val, currentPrice: null })
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Nova inversió</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Tipus</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.type} onChange={e => set('type', e.target.value)}
            >
              <option value="etf">ETF</option>
              <option value="stock">Acció</option>
              <option value="efectiu">Efectiu / Liquiditat</option>
              <option value="estalvi">Estalvi</option>
              <option value="robo">Robo Advisor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Nom</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="ex: iShares MSCI World..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Ticker &nbsp;<span className="normal-case font-normal text-gray-400">{TYPE_HINTS[form.type]}</span>
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-300"
              value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())}
              placeholder={form.type === 'etf' ? 'IWDA.AS' : form.type === 'stock' ? 'LMT' : '—'}
              disabled={['efectiu', 'estalvi', 'robo'].includes(form.type)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Valor inicial (€)</label>
            <input
              type="number" step="any" min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.initialValue} onChange={e => set('initialValue', e.target.value)}
              placeholder="0.00"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-all">
            Cancel·lar
          </button>
          <button onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-200">
            Afegir posició
          </button>
        </div>
      </div>
    </div>
  )
}
