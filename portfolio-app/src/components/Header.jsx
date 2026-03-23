import styles from './Header.module.css'

export default function Header({ lastUpdated }) {
  const today = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.title}>Cartera Personal</span>
      </div>
      <div className={styles.right}>
        <span className={styles.date}>{today}</span>
      </div>
    </header>
  )
}
