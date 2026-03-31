import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
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
import AlertsPage from './components/AlertsSystem'
import MonthlyReport from './components/MonthlyReport'
import LoginScreen from './components/LoginScreen'
import { useAuth } from './hooks/useAuth'
import { useInvestments } from './hooks/useInvestments'
import { useSavings } from './hooks/useSavings'
import { useFirestorePortfolio } from './hooks/useFirestorePortfolio'
import { useCryptos } from './hooks/useCryptos'
import { usePriceFetcher } from './hooks/usePriceFetcher'
import { useNetWorthSnapshots } from './hooks/useNetWorthSnapshots'
import { useRebalancingGoals } from './hooks/useRebalancingGoals'
import { useAlerts } from './components/AlertsSystem'

export const PAGES = {
  investments: 'Inversions',
  savings:     'Estalvis',
  crypto:      'Crypto',
  movements:   'Moviments',
  timeline:    'Evolució',
  projections: 'Projeccions',
  chart:       'Distribució',
  benchmark:   'Benchmark',
  rebalancing: 'Rebalanceig',
  alerts:      'Alertes',
  report:      'Informe PDF',
}

const NO_METRICS = new Set(['movements', 'timeline', 'benchmark', 'rebalancing', 'alerts', 'report'])

const appStyles = `
  .mob-hdr { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); background: #0d0d0d; position: sticky; top: 0; z-index: 10; font-family: 'Inter',system-ui,sans-serif; flex-shrink: 0; }
  @media (min-width: 1024px) { .mob-hdr { display: none; } }
  .mob-hdr-left { display: flex; align-items: center; gap: 10px; }
  .mob-menu-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; cursor: pointer; border-radius: 5px; transition: background 100ms; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .mob-menu-btn:hover { background: rgba(255,255,255,0.05); }
  .mob-hdr-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.82); letter-spacing: -0.3px; }
  .mob-hdr-page  { font-size: 13px; color: rgba(255,255,255,0.28); }
  .mob-av { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; overflow: hidden; cursor: pointer; transition: background 100ms; }
  .mob-av:hover { background: rgba(255,255,255,0.10); }
  .mob-av img { width: 100%; height: 100%; object-fit: cover; }
  .app-spinner { min-height: 100vh; background: #0a0a0a; display: flex; align-items: center; justify-content: center; }
  .app-spinner-ring { width: 18px; height: 18px; border: 1px solid rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.6); border-radius: 50%; animation: appSpin 0.6s linear infinite; }
  @keyframes appSpin { to { transform: rotate(360deg); } }
  .swipe-hint { position: fixed; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 40px; background: rgba(255,255,255,0.08); border-radius: 0 2px 2px 0; z-index: 5; }
  @media (min-width: 1024px) { .swipe-hint { display: none; } }
`

const invVal = (inv, fxRates = {}) => {
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'
  const qty      = inv.totalQty || 0
  // Si tenim preu original + taxa live → conversió correcta
  if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr]) {
    return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
  }
  // Fallback: preu en EUR guardat (pot ser inexacte si la taxa era incorrecta)
  if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
  return inv.totalCost || 0
}
const cryVal  = c => {
  const qty = c.totalQty ?? c.qty ?? 0
  if (qty > 0 && c.currentPrice != null) return +(qty * c.currentPrice).toFixed(2)
  return c.totalCost || c.initialValue || 0
}

export default function App() {
  const { user, login, logout, error: authError, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab]     = useState('investments')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Inversions (nou sistema) ─────────────────────────────────────────────────
  const {
    investments,
    addInvestment, removeInvestment,
    addTransaction:    addInvTx,
    removeTransaction: removeInvTx,
    updateCurrentPrice,
  } = useInvestments(user?.uid)

  // ── Estalvis (comptes + moviments) ───────────────────────────────────────────
  const {
    accounts,
    addAccount, removeAccount,
    addTransaction:    addSavTx,
    removeTransaction: removeSavTx,
  } = useSavings(user?.uid)

  // ── Crypto ────────────────────────────────────────────────────────────────────
  const {
    cryptos,
    addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
    addTransaction: addCryptoTx, removeTransaction: removeCryptoTx,
  } = useCryptos(user?.uid)
  const cryptoLoading = false

  // ── FX rates (per conversió USD/GBP→EUR en temps real) ──────────────────────
  const [fxRates, setFxRates] = useState({})
  useEffect(() => {
    const pairs = [...new Set(investments
      .map(i => i.originalCurrency || i.currency)
      .filter(c => c && c !== 'EUR')
    )]
    pairs.forEach(curr => {
      fetch(`/yahoo/v8/finance/chart/${curr}EUR=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
        .then(r => r.json())
        .then(d => {
          const rate = d?.chart?.result?.[0]?.meta?.regularMarketPrice
          if (rate && rate > 0) setFxRates(prev => ({ ...prev, [curr]: rate }))
        })
        .catch(() => {})
    })
  }, [investments.length]) // eslint-disable-line

  // ── Price fetcher ────────────────────────────────────────────────────────────
  const { loading: priceLoading, status, setStatus, fetchOne, fetchWithCurrency } = usePriceFetcher()

  // ── Altres ───────────────────────────────────────────────────────────────────
  const { snapshots, saveSnapshot } = useNetWorthSnapshots(user?.uid)
  const { goals, saveGoals }        = useRebalancingGoals(user?.uid)
  const { alerts, addAlert, removeAlert, checkAlerts } = useAlerts(user?.uid)

  // ── Compat arrays per components que esperen format antic ────────────────────
  const investmentsCompat = investments.map(inv => ({
    ...inv,
    qty:          inv.totalQty  || 0,
    initialValue: inv.totalCost || 0,
  }))

  const savingsCompat = accounts.map(a => ({
    id: a.id, name: a.name, amount: a.balance, rate: a.rate || 0,
  }))

  // ── Totals ───────────────────────────────────────────────────────────────────
  const totalInv  = investments.reduce((s, inv) => s + invVal(inv, fxRates), 0)
  const totalSav  = accounts.reduce((s, a) => s + a.balance, 0)
  const totalCry  = cryptos.reduce((s, c) => s + cryVal(c), 0)
  // totalInvCost = cost de les inversions (per MetricsBar i pg)
  const totalInvCost = investments.reduce((s, inv) => s + (inv.totalCost || 0), 0)
                     + cryptos.reduce((s, c) => s + (c.totalCost || c.initialValue || 0), 0)

  const totalAll  = totalInv + totalSav + totalCry
  const pg        = (totalInv + totalCry) - totalInvCost
  const pgPct     = totalInvCost > 0 ? (pg / totalInvCost) * 100 : 0

  // totalCost = tot el capital aportat (inversions + estalvis + crypto) per NetWorthTimeline
  const totalCost = totalInvCost + totalSav

  // ── currentPcts per rebalanceig ──────────────────────────────────────────────
  const currentPcts = (() => {
    const vals = { etf: 0, estalvi: 0, crypto: 0, robo: 0 }
    investments.forEach(inv => {
      const v = invVal(inv, fxRates)
      if (['etf', 'stock'].includes(inv.type))           vals.etf     += v
      else if (inv.type === 'robo')                       vals.robo    += v
      else if (['estalvi', 'efectiu'].includes(inv.type)) vals.estalvi += v
    })
    vals.estalvi += totalSav
    cryptos.forEach(c => { vals.crypto += cryVal(c) })
    const total = Object.values(vals).reduce((a, b) => a + b, 0)
    const pcts  = {}
    Object.entries(vals).forEach(([k, v]) => { pcts[k] = total > 0 ? (v / total) * 100 : 0 })
    return pcts
  })()

  // ── Effects ───────────────────────────────────────────────────────────────────

  // Preus inversions en carregar
  useEffect(() => {
    if (!investments.length) return
    investments.forEach(async inv => {
      if (!inv.ticker || ['efectiu', 'estalvi', 'robo'].includes(inv.type)) return
      try {
        const orig = fetchWithCurrency ? await fetchWithCurrency(inv.ticker) : null
        // Guarda sempre el preu original (en la seva moneda) + deixa invVal fer la conversió amb fxRates live
        if (orig?.price != null) updateCurrentPrice(inv.id, orig.price, { originalPrice: orig.price, originalCurrency: orig.currency || 'EUR' })
        else { const price = await fetchOne(inv.ticker); if (price != null) updateCurrentPrice(inv.id, price) }
      } catch {}
    })
  }, [investments.length]) // eslint-disable-line

  // Preus crypto en carregar
  useEffect(() => {
    if (!cryptoLoading && cryptos.length) refreshCryptoPrices()
  }, [cryptoLoading]) // eslint-disable-line

  // Snapshot + alertes quan canvia el total
  useEffect(() => {
    if (totalAll > 0 && user) {
      saveSnapshot(totalAll, totalInv, totalSav, totalCry)
      checkAlerts(investmentsCompat, cryptos, totalAll, goals, currentPcts)
    }
  }, [totalAll]) // eslint-disable-line

  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // ── Handlers ──────────────────────────────────────────────────────────────────

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

  const handleAddInvestment = useCallback(async ({ name, ticker, type }) => {
    await addInvestment({ name, ticker, type })
    if (ticker && !['efectiu', 'estalvi', 'robo'].includes(type)) {
      setStatus('obtenint preu per ' + ticker + '...')
      try {
        const price = await fetchOne(ticker)
        if (price != null) {
          setTimeout(() => {
            const fresh = investments.find(i => i.ticker === ticker && i.name === name)
            if (fresh) updateCurrentPrice(fresh.id, price)
          }, 1500)
        }
      } catch {}
      setStatus('llest')
    }
  }, [addInvestment, fetchOne, setStatus, updateCurrentPrice, investments])

  const handleRefreshPrices = useCallback(async () => {
    for (const inv of investments) {
      if (!inv.ticker || ['efectiu', 'estalvi', 'robo'].includes(inv.type)) continue
      try {
        const orig = fetchWithCurrency ? await fetchWithCurrency(inv.ticker) : null
        if (orig?.price != null) updateCurrentPrice(inv.id, orig.price, { originalPrice: orig.price, originalCurrency: orig.currency || 'EUR' })
        else { const price = await fetchOne(inv.ticker); if (price != null) updateCurrentPrice(inv.id, price) }
      } catch {}
    }
  }, [investments, fetchOne, updateCurrentPrice])

  const activeAlertsCount = alerts.filter(a => !a.triggered).length
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // ── Render ────────────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="app-spinner">
      <style>{appStyles}</style>
      <div className="app-spinner-ring" />
    </div>
  )

  if (!user) return <LoginScreen onLogin={login} error={authError} />

  return (
    <>
      <style>{appStyles}</style>

      <Sidebar
        active={activeTab}
        onChange={id => { setActiveTab(id); setSidebarOpen(false) }}
        user={user}
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeAlertsCount={activeAlertsCount}
      />

      <div
        style={{ height: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        className="lg:ml-[220px]"
      >
        <div className="swipe-hint" />

        <div className="mob-hdr">
          <div className="mob-hdr-left">
            <button className="mob-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Obrir menú">
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

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {!NO_METRICS.has(activeTab) && (
            <MetricsBar
              total={totalAll}
              totalInvCost={totalInvCost}
              totalSav={totalSav}
              numPositions={investments.length + cryptos.length}
              numAccounts={accounts.length}
              pg={pg}
              pgPct={pgPct}
            />
          )}

          <main style={{ flex: 1, padding: '22px 18px' }} className="lg:px-8 lg:py-7">

            {activeTab === 'investments' && (
              <InvestmentsTable
                investments={investments}
                onAddInvestment={handleAddInvestment}
                onRemoveInvestment={removeInvestment}
                onAddTransaction={addInvTx}
                onRemoveTransaction={removeInvTx}
                loading={priceLoading}
                status={status}
                onRefresh={handleRefreshPrices}
              />
            )}

            {activeTab === 'savings' && (
              <SavingsList
                accounts={accounts}
                onAddAccount={addAccount}
                onRemoveAccount={removeAccount}
                onAddTransaction={addSavTx}
                onRemoveTransaction={removeSavTx}
              />
            )}

            {activeTab === 'crypto' && (
              <CryptoPage
                cryptos={cryptos}
                onAdd={addCrypto}
                onRemove={removeCrypto}
                onUpdate={updateCrypto}
                onRefresh={refreshCryptoPrices}
                onAddTransaction={addCryptoTx}
                onRemoveTransaction={removeCryptoTx}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsPage
                investments={investmentsCompat}
                savings={savingsCompat}
                cryptos={cryptos}
              />
            )}

            {activeTab === 'timeline' && (
              <NetWorthTimeline
                snapshots={snapshots}
                currentTotal={totalAll}
                totalCost={totalCost}
              />
            )}

            {activeTab === 'projections' && (
              <ProjectionsPage
                investments={investmentsCompat}
                savings={savingsCompat}
                cryptos={cryptos}
              />
            )}

            {activeTab === 'chart' && (
              <AllocationChart
                investments={investmentsCompat}
                savings={savingsCompat}
                cryptos={cryptos}
              />
            )}

            {activeTab === 'benchmark' && (
              <BenchmarkPage snapshots={snapshots} />
            )}

            {activeTab === 'rebalancing' && (
              <RebalancingPage
                investments={investmentsCompat}
                savings={savingsCompat}
                cryptos={cryptos}
                goals={goals}
                onSaveGoals={saveGoals}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsPage
                investments={investmentsCompat}
                cryptos={cryptos}
                alerts={alerts}
                onAdd={addAlert}
                onRemove={removeAlert}
              />
            )}

            {activeTab === 'report' && (
              <MonthlyReport
                investments={investmentsCompat}
                savings={savingsCompat}
                cryptos={cryptos}
                snapshots={snapshots}
              />
            )}

          </main>
        </div>
      </div>
    </>
  )
}