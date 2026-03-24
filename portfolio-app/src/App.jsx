import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import MetricsBar from './components/MetricsBar'
import InvestmentsTable from './components/InvestmentsTable'
import SavingsList from './components/SavingsList'
import AllocationChart from './components/AllocationChart'
import ProjectionsPage from './components/ProjectionsPage'
import CryptoPage from './components/CryptoPage'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './hooks/useAuth'
import { useFirestorePortfolio } from './hooks/useFirestorePortfolio'
import { usePriceFetcher } from './hooks/usePriceFetcher'

const PAGES = {
  investments: 'Inversions',
  savings:     'Estalvis',
  crypto:      'Criptomonedes',
  projections: 'Projeccions',
  chart:       'Distribució',
}

const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  /* Mobile header */
  .mob-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: #080808;
    position: sticky; top: 0; z-index: 10;
    font-family: 'Geist', sans-serif;
    flex-shrink: 0;
  }
  @media (min-width: 1024px) { .mob-header { display: none; } }

  .mob-logo { display: flex; align-items: center; gap: 8px; }
  .mob-logo-name { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .mob-logo-page { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.28); }

  .mob-av {
    width: 26px; height: 26px; border-radius: 50%;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 500; overflow: hidden;
  }
  .mob-av img { width: 100%; height: 100%; object-fit: cover; }

  /* Spinner */
  .app-spinner {
    min-height: 100vh; background: #080808;
    display: flex; align-items: center; justify-content: center;
  }
  .app-spinner-ring {
    width: 18px; height: 18px;
    border: 1px solid rgba(255,255,255,0.15);
    border-top-color: rgba(255,255,255,0.6);
    border-radius: 50%;
    animation: appSpin 0.6s linear infinite;
  }
  @keyframes appSpin { to { transform: rotate(360deg); } }

  /* Padding bottom per BottomNav en mòbil */
  .main-content { padding-bottom: calc(58px + env(safe-area-inset-bottom, 0px)); }
  @media (min-width: 1024px) { .main-content { padding-bottom: 0; } }
`

export default function App() {
  const { user, login, logout, error: authError, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('investments')

  const {
    investments, savings, cryptos, loading: dataLoading,
    addInvestment, removeInvestment, updatePrice, updateInvestment,
    addSavings, removeSavings,
    addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
  } = useFirestorePortfolio(user?.uid)

  const { loading: priceLoading, status, setStatus, refreshAll, fetchOne } = usePriceFetcher()

  useEffect(() => {
    if (!dataLoading && investments.length > 0) refreshAll(investments, updatePrice)
  }, [dataLoading])

  useEffect(() => {
    if (!dataLoading && cryptos.length > 0) refreshCryptoPrices()
  }, [dataLoading])

  const refreshCryptoPrices = async () => {
    for (const c of cryptos) {
      if (!c.coinId) continue
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${c.coinId}&vs_currencies=eur`)
        const data = await res.json()
        if (data[c.coinId]?.eur) updateCryptoPrice(c.id, data[c.coinId].eur)
      } catch {}
    }
  }

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

  if (authLoading) return (
    <div className="app-spinner">
      <style>{appStyles}</style>
      <div className="app-spinner-ring" />
    </div>
  )

  if (!user) return <LoginScreen onLogin={login} error={authError} />

  const initials = user.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <style>{appStyles}</style>

      <div style={{ height: '100dvh', background: '#080808', display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar active={activeTab} onChange={setActiveTab} user={user} onLogout={logout} />
        </div>

        {/* Contingut — scroll intern */}
        <div
          className="flex-1 lg:ml-[200px] flex flex-col main-content"
          style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {/* Mobile header */}
          <div className="mob-header">
            <div className="mob-logo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 7 22 7 22 13" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="mob-logo-name">Cartera</span>
              <span className="mob-logo-page">/ {PAGES[activeTab]}</span>
            </div>
            <div className="mob-av">
              {user.photoURL
                ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                : initials
              }
            </div>
          </div>

          {/* Metrics */}
          <MetricsBar investments={investments} savings={savings} cryptos={cryptos} />

          {/* Pàgina */}
          <main style={{ flex: 1, padding: '24px 28px' }} className="lg:px-8 lg:py-7">
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
              <SavingsList savings={savings} onAdd={addSavings} onRemove={removeSavings} />
            )}
            {activeTab === 'chart' && (
              <AllocationChart investments={investments} savings={savings} cryptos={cryptos} />
            )}
            {activeTab === 'projections' && (
              <ProjectionsPage investments={investments} savings={savings} cryptos={cryptos} />
            )}
            {activeTab === 'crypto' && (
              <CryptoPage
                cryptos={cryptos}
                onAdd={addCrypto}
                onRemove={removeCrypto}
                onUpdate={updateCrypto}
                onRefresh={refreshCryptoPrices}
              />
            )}
          </main>
        </div>
      </div>

      {/* BottomNav fora del flex */}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </>
  )
}