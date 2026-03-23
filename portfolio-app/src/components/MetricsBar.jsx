import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'

export default function MetricsBar({ investments, savings }) {
  const invValue = investments.reduce((s, i) => s + getEffectiveValue(i), 0)
  const invCost  = investments.reduce((s, i) => s + i.initialValue, 0)
  const savValue = savings.reduce((s, sv) => s + sv.amount, 0)
  const total    = invValue + savValue
  const pg       = invValue - invCost
  const pgPct    = invCost > 0 ? (pg / invCost) * 100 : 0

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard
          label="Valor total"
          value={fmtEur(total)}
          sub="inversions + estalvis"
          highlight
        />
        <MetricCard
          label="Invertit"
          value={fmtEur(invCost)}
          sub={`${investments.length} posicions`}
        />
        <MetricCard
          label="Estalvis"
          value={fmtEur(savValue)}
          sub={`${savings.length} comptes`}
        />
        <MetricCard
          label="Guany / Pèrdua"
          value={pg >= 0 ? '+' + fmtEur(pg) : fmtEur(pg)}
          sub={invCost > 0 ? fmtPct(pgPct) + ' sobre cost' : '—'}
          color={pg > 0.01 ? 'green' : pg < -0.01 ? 'red' : 'gray'}
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, highlight, color }) {
  const valueColor =
    color === 'green' ? 'text-emerald-600' :
    color === 'red'   ? 'text-red-500' :
    highlight         ? 'text-blue-600' :
    'text-gray-900'

  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
