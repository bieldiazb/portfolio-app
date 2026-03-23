import { useState, useEffect } from 'react'
import Header from './components/Header'
import MetricsBar from './components/MetricsBar'
import Tabs from './components/Tabs'
import InvestmentsTable from './components/InvestmentsTable'
import SavingsList from './components/SavingsList'
import AllocationChart from './components/AllocationChart'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './hooks/useAuth'
import { useFirestorePortfolio } from './hooks/useFirestorePortfolio'
import { usePriceFetcher } from './hooks/usePriceFetcher'
import styles from './App.module.css'

const TABS = [
  { id: 'investments', label: 'Inversions'  },
  { id: 'savings',     label: 'Estalvis'    },
  { id: 'chart',       label: 'Distribució' },
]

export default function App() {
  const { user, login, logout, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('investments')

  const {
    investments, savings, loading: dataLoading,
    addInvestment, removeInvestment, updatePrice,
    addSavings, removeSavings,
  } = useFirestorePortfolio(user?.uid)

  const { loading: priceLoading, status, setStatus, refreshAll, fetchOne } = usePriceFetcher()

  // Auto-refresh prices when investments load
  useEffect(() => {
    if (!dataLoading && investments.length > 0) {
      refreshAll(investments, updatePrice)
    }
  }, [dataLoading]) // eslint-disable-line

  const handleAddInvestment = async (inv) => {
    await addInvestment(inv)
    if (inv.ticker && !['efectiu', 'estalvi', 'robo'].includes(inv.type)) {
      setStatus('obtenint preu per ' + inv.ticker + '...')
      const price = await fetchOne(inv.ticker)
      if (price !== null) {
        // find the newly added doc — wait briefly for Firestore to sync
        setTimeout(async () => {
          const fresh = investments.find(i => i.ticker === inv.ticker && i.name === inv.name)
          if (fresh) await updatePrice(fresh.id, price)
        }, 1500)
      }
      setStatus('llest')
    }
  }

  // Loading screen
  if (authLoading) {
    return (
      <div className={styles.splash}>
        <span className={styles.splashDot}>◈</span>
      </div>
    )
  }

  // Login screen
  if (!user) {
    return <LoginScreen onLogin={login} />
  }

  return (
    <div className={styles.app}>
      <Header user={user} onLogout={logout} />
      <MetricsBar investments={investments} savings={savings} />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <main className={styles.main}>
        {activeTab === 'investments' && (
          <InvestmentsTable
            investments={investments}
            onAdd={handleAddInvestment}
            onRemove={removeInvestment}
            onRefresh={() => refreshAll(investments, updatePrice)}
            loading={priceLoading}
            status={dataLoading ? 'carregant dades...' : status}
          />
        )}
        {activeTab === 'savings' && (
          <SavingsList
            savings={savings}
            onAdd={addSavings}
            onRemove={removeSavings}
          />
        )}
        {activeTab === 'chart' && (
          <AllocationChart
            investments={investments}
            savings={savings}
          />
        )}
      </main>
    </div>
  )
}
