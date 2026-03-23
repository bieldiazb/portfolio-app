import styles from './Tabs.module.css'

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
