import { useState } from 'react'
import { fmtEur } from '../utils/format'

export default function SavingsList({ savings, onAdd, onRemove }) {
  const [showModal, setShowModal] = useState(false)
  const totalSavings = savings.reduce((s, sv) => s + sv.amount, 0)
  const totalInterest = savings.reduce((s, sv) => s + (sv.rate ? sv.amount * sv.rate / 100 : 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Comptes d'estalvi</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Total: <span className="font-medium text-emerald-600">{fmtEur(totalSavings)}</span>
            {totalInterest > 0 && <> · +{fmtEur(totalInterest)}/any estimat</>}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-200"
        >
          + Afegir
        </button>
      </div>

      {savings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-300 text-sm">Cap compte d'estalvi registrat</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savings.map(s => <SavingsCard key={s.id} s={s} onRemove={onRemove} />)}
        </div>
      )}

      {showModal && (
        <AddSavingsModal onAdd={s => { onAdd(s); setShowModal(false) }} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function SavingsCard({ s, onRemove }) {
  const annual = s.rate ? s.amount * s.rate / 100 : 0
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <button
          onClick={() => onRemove(s.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xl leading-none"
        >×</button>
      </div>
      <h3 className="font-medium text-gray-900 mb-1">{s.name}</h3>
      <p className="text-xs text-gray-400 mb-4">
        {s.rate ? `${s.rate}% TAE` : 'Sense interès'}{s.notes ? ` · ${s.notes}` : ''}
      </p>
      <p className="text-2xl font-semibold text-gray-900 font-mono">{fmtEur(s.amount)}</p>
      {annual > 0 && (
        <p className="text-xs text-emerald-600 mt-1">+{fmtEur(annual)}/any estimat</p>
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
    if (isNaN(amount) || amount < 0) return setError('El saldo ha de ser un número positiu')
    setError('')
    onAdd({ name: form.name.trim(), amount, rate: parseFloat(form.rate) || 0, notes: form.notes.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Nou compte d'estalvi</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Nom del compte</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Compte N26, Dipòsit ING..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Saldo (€)</label>
              <input type="number" step="any" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">TAE (%)</label>
              <input type="number" step="any" min="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes (opcional)</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="ex: venciment juny 2025..." />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-all">Cancel·lar</button>
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-200">Afegir compte</button>
        </div>
      </div>
    </div>
  )
}
