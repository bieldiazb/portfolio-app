import { useState } from 'react'
import { fmtEur, fmtPct, TYPE_META, getEffectiveValue } from '../utils/format'
import AddInvestmentModal from './AddInvestmentModal'

export default function InvestmentsTable({ investments, onAdd, onRemove, onRefresh, loading, status }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Posicions obertes</h2>
          <p className="text-sm text-gray-400 mt-0.5">{status}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-40"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
            Actualitzar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all duration-150 shadow-sm shadow-blue-200"
          >
            + Afegir
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-gray-300 text-sm">Cap inversió registrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Actiu', 'Valor inicial', 'Preu actual', 'Valor actual', 'P&G', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-4 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {investments.map(inv => (
                <InvestmentRow key={inv.id} inv={inv} onRemove={onRemove} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddInvestmentModal
          onAdd={(inv) => { onAdd(inv); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function InvestmentRow({ inv, onRemove }) {
  const meta = TYPE_META[inv.type] || TYPE_META.etf
  const val  = getEffectiveValue(inv)
  const pg   = val - inv.initialValue
  const pgPct = inv.initialValue > 0 ? (pg / inv.initialValue) * 100 : 0
  const hasLive = inv.ticker && !['efectiu', 'estalvi', 'robo'].includes(inv.type)

  const pgColor = pg > 0.01 ? 'text-emerald-600' : pg < -0.01 ? 'text-red-500' : 'text-gray-400'
  const pgBg    = pg > 0.01 ? 'bg-emerald-50' : pg < -0.01 ? 'bg-red-50' : 'bg-gray-50'

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${meta.bgTw} ${meta.colorTw}`}>
            {inv.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{inv.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${meta.bgTw} ${meta.colorTw}`}>
                {meta.label}
              </span>
              {inv.note && <span className="text-xs text-gray-400">{inv.note}</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-gray-600 font-mono">{fmtEur(inv.initialValue)}</td>
      <td className="px-5 py-4">
        {hasLive ? (
          inv.currentPrice !== null ? (
            <div>
              <p className="text-sm font-mono text-gray-900">{fmtEur(inv.currentPrice)}</p>
              <p className="text-xs text-gray-400">{inv.ticker}</p>
            </div>
          ) : (
            <span className="text-sm text-gray-300 animate-pulse">···</span>
          )
        ) : (
          <span className="text-sm text-gray-300">—</span>
        )}
      </td>
      <td className="px-5 py-4 text-sm font-mono font-medium text-gray-900">{fmtEur(val)}</td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-lg font-mono ${pgBg} ${pgColor}`}>
          {pg >= 0 ? '▲' : '▼'} {fmtEur(Math.abs(pg))}
          <span className="text-xs opacity-70">({fmtPct(pgPct)})</span>
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <button
          onClick={() => onRemove(inv.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none"
        >
          ×
        </button>
      </td>
    </tr>
  )
}
