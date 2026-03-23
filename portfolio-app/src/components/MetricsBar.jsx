import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'
import styles from './MetricsBar.module.css'

export default function MetricsBar({ investments, savings }) {
  const invValue = investments.reduce((s, i) => s + getEffectiveValue(i), 0)
  const invCost  = investments.reduce((s, i) => s + i.initialValue, 0)
  const savValue = savings.reduce((s, sv) => s + sv.amount, 0)
  const total    = invValue + savValue
  const pg       = invValue - invCost
  const pgPct    = invCost > 0 ? (pg / invCost) * 100 : 0

  return (
    <div className={styles.bar}>
      <Metric label="Valor total" value={fmtEur(total)} sub="inversions + estalvis" />
      <Metric label="Cost total" value={fmtEur(invCost)} sub={`${investments.length} posicions`} />
      <Metric label="Estalvis" value={fmtEur(savValue)} sub={`${savings.length} comptes`} />
      <Metric
        label="P&G no realitzat"
        value={fmtEur(pg)}
        sub={invCost > 0 ? fmtPct(pgPct) + ' sobre cost' : ''}
        accent={pg > 0.01 ? 'pos' : pg < -0.01 ? 'neg' : null}
      />
    </div>
  )
}

function Metric({ label, value, sub, accent }) {
  return (
    <div className={styles.cell}>
      <div className={styles.label}>{label}</div>
      <div className={`${styles.value} ${accent ? styles[accent] : ''}`}>{value}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  )
}
