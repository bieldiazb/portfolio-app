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

const TABS = [
  { id: 'investments', label: 'Inversions'  },
  { id: 'savings',     label: 'Estalvis'    },
  { id: 'chart',       label: 'Gràfics'     },
]

export default function App() {
  const { user, login, logout, error: authError, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('investments')

  const {
    investments, savings, loading: dataLoading,
    addInvestment, removeInvestment, updatePrice,
    addSavings, removeSavings,
  } = useFirestorePortfolio(user?.uid)

  const { loading: priceLoading, status, setStatus, refreshAll, fetchOne } = usePriceFetcher()

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
        setTimeout(async () => {
          const fresh = investments.find(i => i.ticker === inv.ticker && i.name === inv.name)
          if (fresh) await updatePrice(fresh.id, price)
        }, 1500)
      }
      setStatus('llest')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen onLogin={login} error={authError} />

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={logout} />
      <MetricsBar investments={investments} savings={savings} />
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-6 py-8">
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
          <SavingsList savings={savings} onAdd={addSavings} onRemove={removeSavings} />
        )}
        {activeTab === 'chart' && (
          <AllocationChart investments={investments} savings={savings} />
        )}
      </main>
    </div>
  )
}