import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getEffectiveValue } from '../utils/format'
import styles from './AllocationChart.module.css'

const COLORS = ['#c9a96e', '#4caf82', '#4a7fa5', '#7a5a9a', '#c0614a', '#5a9a8a', '#9a7a4a']

export default function AllocationChart({ investments, savings }) {
  const data = []

  investments.forEach(inv => {
    const val = getEffectiveValue(inv)
    if (val > 0) data.push({ name: inv.name, value: val })
  })

  savings.forEach(s => {
    if (s.amount > 0) data.push({ name: s.name, value: s.amount })
  })

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) return null

  const dataWithPct = data.map(d => ({
    ...d,
    pct: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipName}>{d.name}</div>
        <div className={styles.tooltipValue}>
          {new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(d.value)}
        </div>
        <div className={styles.tooltipPct}>{d.pct}% del portfoli</div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>Distribució del portfoli</span>
      </div>
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={dataWithPct}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
            >
              {dataWithPct.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.legend}>
          {dataWithPct.map((d, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.dot} style={{ background: COLORS[i % COLORS.length] }} />
              <span className={styles.legendName}>{d.name}</span>
              <span className={styles.legendPct}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
