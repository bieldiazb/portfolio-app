import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'        // Sidebar.v3
import MetricsBar from './components/MetricsBar'
import InvestmentsTable from './components/InvestmentsTable'
import SavingsList from './components/SavingsList'
import AllocationChart from './components/AllocationChart'
import ProjectionsPage from './components/ProjectionsPage'
import CryptoPage from './components/CryptoPage'
import MovementsPage from './components/MovementsPage'
import BenchmarkPage from './components/BenchmarkPage'
import RebalancingPage from './components/RebalancingPage'
import NetWorthTimeline from './components/NetWorthTimeline'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './hooks/useAuth'
import { useFirestorePortfolio } from './hooks/useFirestorePortfolio'
import { usePriceFetcher } from './hooks/usePriceFetcher'
import { useNetWorthSnapshots } from './hooks/useNetWorthSnapshots'
import { useRebalancingGoals } from './hooks/useRebalancingGoals'

export const PAGES = {
  investments:  'Inversions',
  savings:      'Estalvis',
  crypto:       'Crypto',
  movements:    'Moviments',
  projections:  'Projeccions',
  chart:        'Distribució',
  benchmark:    'Benchmark',
  rebalancing:  'Rebalanceig',
  timeline:     'Evolució',
}

const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  /* Header mòbil */
  .mob-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: #080808;
    position: sticky; top: 0; z-index: 10;
    font-family: 'Geist', sans-serif; flex-shrink: 0;
  }
  @media (min-width: 1024px) { .mob-hdr { display: none; } }

  .mob-hdr-left { display: flex; align-items: center; gap: 10px; }

  /* Botó hamburguesa */
  .mob-menu-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer;
    border-radius: 5px; transition: background 100ms; flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }
  .mob-menu-btn:hover { background: rgba(255,255,255,0.05); }

  .mob-hdr-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.82); letter-spacing: -0.3px; }
  .mob-hdr-page  { font-size: 13px; color: rgba(255,255,255,0.28); }

  .mob-av {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 500; overflow: hidden; cursor: pointer;
    transition: background 100ms;
  }
  .mob-av:hover { background: rgba(255,255,255,0.10); }
  .mob-av img { width: 100%; height: 100%; object-fit: cover; }

  /* Spinner */
  .app-spinner { min-height: 100vh; background: #080808; display: flex; align-items: center; justify-content: center; }
  .app-spinner-ring { width: 18px; height: 18px; border: 1px solid rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.6); border-radius: 50%; animation: appSpin 0.6s linear infinite; }
  @keyframes appSpin { to { transform: rotate(360deg); } }

  /* Swipe hint — petit indicador que el sidebar es pot arrossegar */
  .swipe-hint {
    position: fixed; left: 0; top: 50%;
    transform: translateY(-50%);
    width: 3px; height: 40px;
    background: rgba(255,255,255,0.08);
    border-radius: 0 2px 2px 0;
    z-index: 5;
    transition: opacity 300ms;
  }
  @media (min-width: 1024px) { .swipe-hint { display: none; } }
`

export default function App() {
  const { user, login, logout, error: authError, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('investments')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    investments, savings, cryptos, loading: dataLoading,
    addInvestment, removeInvestment, updatePrice, updateInvestment,
    addSavings, removeSavings,
    addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
  } = useFirestorePortfolio(user?.uid)

  const { loading: priceLoading, status, setStatus, refreshAll, fetchOne } = usePriceFetcher()
  const { snapshots, saveSnapshot } = useNetWorthSnapshots(user?.uid)
  const { goals, saveGoals } = useRebalancingGoals(user?.uid)

  useEffect(() => {
    if (!dataLoading && investments.length > 0) refreshAll(investments, updatePrice)
  }, [dataLoading])

  useEffect(() => {
    if (!dataLoading && cryptos.length > 0) refreshCryptoPrices()
  }, [dataLoading])

  // Desa snapshot quan les dades estan carregades
  useEffect(() => {
    if (!dataLoading && user) {
      const invVal  = investments.reduce((s, i) => s + (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0), 0)
      const savVal  = savings.reduce((s, sv) => s + sv.amount, 0)
      const cryVal  = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
      const total   = invVal + savVal + cryVal
      if (total > 0) saveSnapshot(total, invVal, savVal, cryVal)
    }
  }, [dataLoading, user])

  // Tanca el sidebar quan canvia la mida de la finestra a desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Prevé scroll del body quan el drawer és obert en mòbil
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const refreshCryptoPrices = async () => {
    for (const c of cryptos) {
      if (!c.coinId) continue
      try {
        const res  = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${c.coinId}&vs_currencies=eur`)
        const data = await res.json()
        if (data[c.coinId]?.eur) updateCryptoPrice(c.id, data[c.coinId].eur)
      } catch {}
    }
  }

  const handleAddInvestment = async (inv) => {
    const withDate = { ...inv, purchaseDate: inv.purchaseDate || new Date().toISOString().split('T')[0] }
    await addInvestment(withDate)
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

  const handleAddSavings = async (s) => {
    await addSavings({ ...s, createdAt: new Date().toISOString() })
  }

  const handleAddCrypto = async (c) => {
    await addCrypto({ ...c, purchaseDate: new Date().toISOString().split('T')[0] })
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // Calcula totals per MetricsBar i NetWorthTimeline
  const invValue  = investments.reduce((s, i) => s + (i.qty && i.currentPrice ? i.qty * i.currentPrice : i.initialValue || 0), 0)
  const savValue  = savings.reduce((s, sv) => s + sv.amount, 0)
  const cryValue  = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
  const totalValue = invValue + savValue + cryValue
  const totalCost  = investments.reduce((s, i) => s + (i.initialValue || 0), 0) + cryptos.reduce((s, c) => s + (c.initialValue || 0), 0)

  if (authLoading) return (
    <div className="app-spinner">
      <style>{appStyles}</style>
      <div className="app-spinner-ring" />
    </div>
  )

  if (!user) return <LoginScreen onLogin={login} error={authError} />

  const showMetrics = !['movements', 'timeline', 'benchmark', 'rebalancing'].includes(activeTab)

  return (
    <>
      <style>{appStyles}</style>

      {/* Sidebar — universal (desktop fixed + mòbil drawer) */}
      <Sidebar
        active={activeTab}
        onChange={(id) => { setActiveTab(id); setSidebarOpen(false) }}
        user={user}
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Layout principal */}
      <div style={{
        height: '100dvh', background: '#080808',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        // Marge esquerra en desktop per deixar espai al sidebar
      }} className="lg:ml-[220px]">

        {/* Indicador swipe esquerra (mòbil) */}
        <div className="swipe-hint" />

        {/* Header mòbil */}
        <div className="mob-hdr">
          <div className="mob-hdr-left">
            <button
              className="mob-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Obrir menú"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.60)" strokeWidth="1.8" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="mob-hdr-title">Cartera</span>
            <span className="mob-hdr-page">/ {PAGES[activeTab]}</span>
          </div>
          <div className="mob-av" onClick={() => setSidebarOpen(true)}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              : initials
            }
          </div>
        </div>

        {/* Scroll container */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Metrics */}
          {showMetrics && (
            <MetricsBar investments={investments} savings={savings} cryptos={cryptos} />
          )}

          {/* Pàgina activa */}
          <main style={{ flex: 1, padding: '22px 18px' }} className="lg:px-8 lg:py-7">
            {activeTab === 'investments' && (
              <InvestmentsTable
                investments={investments}
                onAdd={handleAddInvestment}
                onRemove={removeInvestment}
                onUpdate={updateInvestment}
                onRefresh={() => refreshAll(investments, updatePrice)}
                loading={priceLoading}
                status={dataLoading ? 'carregant...' : status}
              />
            )}
            {activeTab === 'savings' && (
              <SavingsList savings={savings} onAdd={handleAddSavings} onRemove={removeSavings} />
            )}
            {activeTab === 'chart' && (
              <AllocationChart investments={investments} savings={savings} cryptos={cryptos} />
            )}
            {activeTab === 'projections' && (
              <ProjectionsPage investments={investments} savings={savings} cryptos={cryptos} />
            )}
            {activeTab === 'crypto' && (
              <CryptoPage cryptos={cryptos} onAdd={handleAddCrypto}
                onRemove={removeCrypto} onUpdate={updateCrypto} onRefresh={refreshCryptoPrices} />
            )}
            {activeTab === 'movements' && (
              <MovementsPage investments={investments} savings={savings} cryptos={cryptos} />
            )}
            {activeTab === 'timeline' && (
              <NetWorthTimeline snapshots={snapshots} currentTotal={totalValue} totalCost={totalCost} />
            )}
            {activeTab === 'benchmark' && (
              <BenchmarkPage investments={investments} savings={savings} cryptos={cryptos} snapshots={snapshots} />
            )}
            {activeTab === 'rebalancing' && (
              <RebalancingPage investments={investments} savings={savings} cryptos={cryptos}
                goals={goals} onSaveGoals={saveGoals} />
            )}
          </main>
        </div>
      </div>
    </>
  )
}