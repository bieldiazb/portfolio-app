import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { fmtEur, getEffectiveValue } from '../utils/format'

const COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16']

export default function AllocationChart({ investments, savings }) {
  const data = [
    ...investments.map(inv => ({ name: inv.name, value: getEffectiveValue(inv), type: inv.type })),
    ...savings.map(s => ({ name: s.name, value: s.amount, type: 'estalvi' })),
  ].filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
      <p className="text-gray-300 text-sm">Afegeix inversions per veure els gràfics</p>
    </div>
  )

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-sm font-medium text-gray-900 mb-1">{d.name}</p>
        <p className="text-base font-semibold text-blue-600">{fmtEur(d.value)}</p>
        <p className="text-xs text-gray-400">{pct}% del total</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Donut chart + llegenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">Distribució</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={115} paddingAngle={3} dataKey="value">
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Total al centre */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs text-gray-400 font-medium">Total</p>
              <p className="text-xl font-semibold text-gray-900">{fmtEur(total)}</p>
            </div>
          </div>
        </div>

        {/* Llegenda amb barres */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">Detall</h3>
          <div className="space-y-4">
            {data.sort((a,b) => b.value - a.value).map((d, i) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 truncate max-w-[180px]">{d.name}</span>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-sm font-medium text-gray-900 font-mono">{fmtEur(d.value)}</span>
                      <span className="text-xs text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Resum per tipus */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">Resum per categoria</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(
            data.reduce((acc, d) => {
              acc[d.type] = (acc[d.type] || 0) + d.value
              return acc
            }, {})
          ).map(([type, val]) => {
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0
            const labels = { efectiu: 'Efectiu', estalvi: 'Estalvi', etf: 'ETF', stock: 'Accions', robo: 'Robo' }
            const colors = { efectiu: 'bg-slate-50 text-slate-600', estalvi: 'bg-emerald-50 text-emerald-700', etf: 'bg-blue-50 text-blue-700', stock: 'bg-violet-50 text-violet-700', robo: 'bg-amber-50 text-amber-700' }
            return (
              <div key={type} className={`rounded-xl p-4 ${colors[type] || 'bg-gray-50 text-gray-600'}`}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2 opacity-70">{labels[type] || type}</p>
                <p className="text-lg font-semibold font-mono">{fmtEur(val)}</p>
                <p className="text-xs opacity-60 mt-0.5">{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
