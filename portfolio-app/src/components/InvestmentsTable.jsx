import { useState } from 'react'
import { fmtEur, fmtPct, TYPE_META, getEffectiveValue } from '../utils/format'
import AddInvestmentModal from './AddInvestmentModal'
import styles from './InvestmentsTable.module.css'

export default function InvestmentsTable({ investments, onAdd, onRemove, onRefresh, loading, status }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.sectionTitle}>Posicions obertes</span>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={onRefresh} disabled={loading}>
            {loading ? '···' : '↻ Actualitzar preus'}
          </button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => setShowModal(true)}>
            + Afegir
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className={styles.empty}>— cap inversió registrada —</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Actiu</th>
              <th>Valor inicial</th>
              <th>Preu actual</th>
              <th>Valor actual</th>
              <th>P&amp;G</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {investments.map(inv => (
              <InvestmentRow key={inv.id} inv={inv} onRemove={onRemove} />
            ))}
          </tbody>
        </table>
      )}

      <div className={styles.status}>{status}</div>

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
  const val = getEffectiveValue(inv)
  const pg = val - inv.initialValue
  const pgPct = inv.initialValue > 0 ? (pg / inv.initialValue) * 100 : 0
  const hasLive = inv.ticker && inv.type !== 'efectiu' && inv.type !== 'estalvi' && inv.type !== 'robo'

  return (
    <tr className={styles.row}>
      <td>
        <div className={styles.assetName}>{inv.name}</div>
        <div className={styles.assetMeta}>
          <span
            className={styles.badge}
            style={{ color: `var(${meta.colorVar})`, background: `var(${meta.bgVar})` }}
          >
            {meta.label}
          </span>
          {inv.note && <span className={styles.note}>{inv.note}</span>}
        </div>
      </td>
      <td>{fmtEur(inv.initialValue)}</td>
      <td>
        {hasLive
          ? inv.currentPrice !== null
            ? <><div>{fmtEur(inv.currentPrice)}</div><div className={styles.ticker}>{inv.ticker}</div></>
            : <span className={styles.loading}>···</span>
          : <span className={styles.dash}>—</span>
        }
      </td>
      <td>{fmtEur(val)}</td>
      <td>
        <span className={pg > 0.01 ? styles.pos : pg < -0.01 ? styles.neg : styles.neu}>
          {fmtEur(pg)}
        </span>
        <div className={`${styles.pct} ${pg > 0.01 ? styles.pos : pg < -0.01 ? styles.neg : styles.neu}`}>
          {fmtPct(pgPct)}
        </div>
      </td>
      <td>
        <button className={styles.removeBtn} onClick={() => onRemove(inv.id)}>×</button>
      </td>
    </tr>
  )
}
