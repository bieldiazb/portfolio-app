import { useState, useEffect } from 'react'
import Header from './components/Header'
import MetricsBar from './components/MetricsBar'
import Tabs from './components/Tabs'
import InvestmentsTable from './components/InvestmentsTable'
import SavingsList from './components/SavingsList'
import AllocationChart from './components/AllocationChart'
import { usePortfolioStore } from './hooks/usePortfolioStore'
import { usePriceFetcher } from './hooks/usePriceFetcher'
import styles from './App.module.css'

const TABS = [
  { id: 'investments', label: 'Inversions' },
  { id: 'savings',     label: 'Estalvis'   },
  { id: 'chart',       label: 'Distribució' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('investments')
  const { state, addInvestment, removeInvestment, updatePrice, addSavings, removeSavings } = usePortfolioStore()
  const { loading, status, setStatus, refreshAll, fetchOne } = usePriceFetcher()

  // Auto-refresh on mount
  useEffect(() => {
    refreshAll(state.investments, updatePrice)
  }, []) // eslint-disable-line

  const handleAddInvestment = async (inv) => {
    addInvestment(inv)
    if (inv.ticker && !['efectiu', 'estalvi', 'robo'].includes(inv.type)) {
      setStatus('obtenint preu per ' + inv.ticker + '...')
      const price = await fetchOne(inv.ticker)
      if (price !== null) {
        // Find newly added investment by matching ticker+name (id assigned in hook)
        // We update after store settles — use a small delay
        setTimeout(() => {
          updatePrice(
            state.investments.find(i => i.ticker === inv.ticker && i.name === inv.name)?.id ?? -1,
            price
          )
        }, 50)
      }
      setStatus('llest')
    }
  }

  return (
    <div className={styles.app}>
      <Header lastUpdated={state.lastUpdated} />
      <MetricsBar investments={state.investments} savings={state.savings} />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <main className={styles.main}>
        {activeTab === 'investments' && (
          <InvestmentsTable
            investments={state.investments}
            onAdd={handleAddInvestment}
            onRemove={removeInvestment}
            onRefresh={() => refreshAll(state.investments, updatePrice)}
            loading={loading}
            status={status}
          />
        )}
        {activeTab === 'savings' && (
          <SavingsList
            savings={state.savings}
            onAdd={addSavings}
            onRemove={removeSavings}
          />
        )}
        {activeTab === 'chart' && (
          <AllocationChart
            investments={state.investments}
            savings={state.savings}
          />
        )}
      </main>
    </div>
  )
}
