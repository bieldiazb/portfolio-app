import styles from './Header.module.css'

export default function Header({ user, onLogout }) {
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
        {user && (
          <div className={styles.userArea}>
            {user.photoURL && (
              <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            )}
            <span className={styles.userName}>{user.displayName?.split(' ')[0]}</span>
            <button className={styles.logoutBtn} onClick={onLogout}>Sortir</button>
          </div>
        )}
      </div>
    </header>
  )
}
