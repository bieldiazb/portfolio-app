import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import DashboardPage from './components/Dashboardpage'
import CommoditiesPage from './components/Commoditiespage'
import DividendsPage from './components/Dividendspage'
import NewsPage from './components/Newspage'
import GoalsPage from './components/Goalspage'
import { useGoals } from './hooks/Usegoals'
import AIAnalyst from './components/Aianalyst'
import { useDividends } from './hooks/Usedividends'
import { useCommodities } from './hooks/useCommodities'
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
import { useCryptos } from './hooks/useCryptos'
import { usePriceFetcher } from './hooks/usePriceFetcher'
import { useNetWorthSnapshots } from './hooks/useNetWorthSnapshots'
import { useRebalancingGoals } from './hooks/useRebalancingGoals'
import { useAlerts } from './components/AlertsSystem'
import { useTheme } from './hooks/useTheme'
import ThemeToggleIcon from './components/ThemeToggle'

export const PAGES = {
  dashboard:   'Inici',
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
  commodities: 'Mat. primeres',
  dividends:   'Dividends',
  news:        'Notícies',
  goals:       'Objectius',
}

// ── Tot el CSS de l'app ara usa variables CSS → light/dark automàtic ─────────
const appStyles = `
  .mob-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px;
    border-bottom: 1px solid var(--c-border);
    background: var(--c-bg);
    position: sticky; top: 0; z-index: 10;
    font-family: 'Geist', sans-serif; flex-shrink: 0;
    /* Transició suau quan canvia el tema */
    transition: background-color 220ms ease, border-color 220ms ease;
  }
  @media (min-width: 1024px) { .mob-hdr { display: none; } }

  .mob-hdr-left { display: flex; align-items: center; gap: 10px; }

  .mob-hdr-logo {
    width: 24px; height: 24px; border-radius: 6px;
    background: var(--c-text-primary);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  /* En mode clar el logo inverteix per llegibilitat */
  [data-theme="light"] .mob-hdr-logo { background: #00ff88; }

  .mob-hdr-title {
    font-size: 14px; font-weight: 500;
    color: var(--c-text-primary); letter-spacing: -0.3px;
  }

  .mob-av {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--c-elevated);
    border: 1px solid var(--c-border);
    color: var(--c-text-secondary);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 500; overflow: hidden;
    cursor: pointer; transition: background 100ms;
  }
  .mob-av:hover { background: var(--c-border-hi); }
  .mob-av img   { width: 100%; height: 100%; object-fit: cover; }

  .app-spinner {
    min-height: 100vh;
    background: var(--c-bg);
    display: flex; align-items: center; justify-content: center;
  }
  .app-spinner-ring {
    width: 18px; height: 18px;
    border: 1px solid var(--c-border-hi);
    border-top-color: var(--c-text-primary);
    border-radius: 50%;
    animation: appSpin 0.6s linear infinite;
  }
  @keyframes appSpin { to { transform: rotate(360deg); } }

  .swipe-hint {
    position: fixed; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 40px;
    background: var(--c-border);
    border-radius: 0 2px 2px 0; z-index: 5;
  }
  @media (min-width: 1024px) { .swipe-hint { display: none; } }

  /* Pàgina de nom al header mòbil */
  .mob-page-name {
    font-size: 12px;
    font-family: 'Geist Mono', monospace;
    color: var(--c-text-muted);
  }
`

function calcInvVal(inv, fxRates = {}) {
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'
  const qty = inv.totalQty || 0
  if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
    return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
  if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
  return inv.totalCostEur || inv.totalCost || 0
}

const cryVal = c => {
  const qty = c.totalQty ?? c.qty ?? 0
  if (qty > 0 && c.currentPrice != null) return +(qty * c.currentPrice).toFixed(2)
  return c.totalCost || c.initialValue || 0
}
const comVal = c => {
  const qty = c.totalQty ?? c.qty ?? 0
  if (qty > 0 && c.currentPriceEur != null) return +(qty * c.currentPriceEur).toFixed(2)
  if (qty > 0 && c.currentPrice != null && c.fxRate) return +(qty * c.currentPrice * c.fxRate).toFixed(2)
  return c.totalCost || 0
}

export default function App() {
  const { user, login, logout, error: authError, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const [fxRates, setFxRates] = useState({})

  const {
    investments, addInvestment, removeInvestment,
    addTransaction: addInvTx, removeTransaction: removeInvTx, updateCurrentPrice,
  } = useInvestments(user?.uid)

  const {
    accounts, addAccount, removeAccount,
    addTransaction: addSavTx, removeTransaction: removeSavTx,
  } = useSavings(user?.uid)

  const {
    cryptos, addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
    addTransaction: addCryptoTx, removeTransaction: removeCryptoTx,
  } = useCryptos(user?.uid)

  const { commodities, addCommodity, removeCommodity, addTransaction: addComTx,
          removeTransaction: removeComTx, refreshPrices: refreshCom } = useCommodities(user?.uid)

  const { dividends, addDividend, removeDividend, byMonth, totalThisYear, totalAll: totalDivAll } = useDividends(user?.uid)
  const { goals: financialGoals, addGoal, removeGoal } = useGoals(user?.uid)

  const { loading: priceLoading, status, setStatus, fetchOne, fetchWithCurrency } = usePriceFetcher()
  const { snapshots, saveSnapshot }      = useNetWorthSnapshots(user?.uid)
  const { goals: rebalGoals, saveGoals } = useRebalancingGoals(user?.uid)
  const { alerts, addAlert, removeAlert, checkAlerts } = useAlerts(user?.uid)

  const investmentsCompat = investments.map(inv => ({
    ...inv, qty: inv.totalQty || 0, initialValue: inv.totalCostEur || inv.totalCost || 0,
  }))
  const savingsCompat = accounts.map(a => ({
    id: a.id, name: a.name, amount: a.balance, rate: a.rate || 0,
  }))

  useEffect(() => {
    if (!investments.length) return
    const pairs = [...new Set(
      investments.map(i => i.originalCurrency || i.currency).filter(c => c && c !== 'EUR')
    )]
    pairs.forEach(curr => {
      fetch(`/yahoo/v8/finance/chart/${curr}EUR=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
        .then(r => r.json()).then(d => {
          const r = d?.chart?.result?.[0]?.meta?.regularMarketPrice
          if (r > 0) setFxRates(p => ({ ...p, [curr]: r }))
        }).catch(() => {})
    })
  }, [investments.length]) // eslint-disable-line

  const totalInv     = investments.reduce((s,i) => s + calcInvVal(i, fxRates), 0)
  const totalInvCost = investments.reduce((s,i) => s + (i.totalCostEur || i.totalCost || 0), 0)
  const totalSav     = accounts.reduce((s,a) => s + a.balance, 0)
  const totalCry     = cryptos.reduce((s,c) => s + cryVal(c), 0)
  const totalCom     = commodities.reduce((s,c) => s + comVal(c), 0)
  const totalAll     = totalInv + totalSav + totalCry + totalCom
  const cryCost      = cryptos.reduce((s,c) => s + (c.totalCost || c.initialValue || 0), 0)
  const comCost      = commodities.reduce((s,c) => s + (c.totalCost || 0), 0)
  const pg           = (totalInv + totalCry) - (totalInvCost + cryCost)
  const pgPct        = (totalInvCost + cryCost) > 0 ? (pg / (totalInvCost + cryCost)) * 100 : 0
  const totalCost    = totalInvCost + cryCost + comCost + totalSav

  const currentPcts = (() => {
    const vals = { etf: 0, estalvi: 0, crypto: 0, robo: 0 }
    investments.forEach(inv => {
      const v = calcInvVal(inv, fxRates)
      if (['etf','stock'].includes(inv.type))            vals.etf     += v
      else if (inv.type === 'robo')                      vals.robo    += v
      else if (['estalvi','efectiu'].includes(inv.type)) vals.estalvi += v
    })
    vals.estalvi += totalSav
    cryptos.forEach(c => { vals.crypto += cryVal(c) })
    const total = Object.values(vals).reduce((a,b) => a+b, 0)
    const pcts  = {}
    Object.entries(vals).forEach(([k,v]) => { pcts[k] = total > 0 ? (v/total)*100 : 0 })
    return pcts
  })()

  useEffect(() => {
    if (!investments.length) return
    investments.forEach(async inv => {
      if (!inv.ticker || ['efectiu','estalvi','robo'].includes(inv.type)) return
      try {
        const orig = fetchWithCurrency ? await fetchWithCurrency(inv.ticker) : null
        if (orig?.price != null)
          updateCurrentPrice(inv.id, orig.price, { originalPrice: orig.price, originalCurrency: orig.currency || 'EUR' })
        else {
          const price = await fetchOne(inv.ticker)
          if (price != null) updateCurrentPrice(inv.id, price)
        }
      } catch {}
    })
  }, [investments.length]) // eslint-disable-line

  useEffect(() => {
    if (!cryptos.length) return
    refreshCryptoPrices()
    const interval = setInterval(refreshCryptoPrices, 60_000)
    return () => clearInterval(interval)
  }, [cryptos.length]) // eslint-disable-line

  useEffect(() => {
    if (totalAll > 0 && user) {
      saveSnapshot(totalAll, totalInv + totalCom, totalSav, totalCry)
      checkAlerts(investmentsCompat, cryptos, totalAll, rebalGoals, currentPcts)
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

  const refreshCryptoPrices = useCallback(async () => {
    const coinIds = cryptos.filter(c => c.coinId).map(c => c.coinId)
    if (!coinIds.length) return
    try {
      const res  = await fetch(`/coingecko/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=eur`, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) return
      const data = await res.json()
      cryptos.forEach(c => { if (c.coinId && data[c.coinId]?.eur) updateCryptoPrice(c.id, data[c.coinId].eur) })
    } catch {}
  }, [cryptos, updateCryptoPrice])

  const handleAddInvestment = useCallback(async ({ name, ticker, type }) => {
    await addInvestment({ name, ticker, type })
    if (ticker && !['efectiu','estalvi','robo'].includes(type)) {
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

  const handleImportCSV = useCallback(async (transactions, broker) => {
    const byAsset = {}
    transactions.forEach(t => {
      const key = t.ticker || t.name
      if (!byAsset[key]) byAsset[key] = { ...t, txs: [] }
      byAsset[key].txs.push(t)
    })
    for (const [key, asset] of Object.entries(byAsset)) {
      let existingInv = investments.find(i =>
        (i.ticker && i.ticker.toUpperCase() === asset.ticker?.toUpperCase()) ||
        (i.name && i.name.toLowerCase() === asset.name?.toLowerCase())
      )
      let invId
      if (existingInv) {
        invId = existingInv.id
      } else {
        const docRef = await addInvestment({
          name: asset.name || asset.ticker || key,
          ticker: asset.ticker || '',
          type: asset.type || 'stock',
          currency: asset.currency || 'EUR',
          originalCurrency: asset.currency || 'EUR',
        })
        if (docRef?.id) {
          invId = docRef.id
        } else {
          await new Promise(r => setTimeout(r, 1200))
          const fresh = investments.find(i =>
            (i.ticker && i.ticker.toUpperCase() === asset.ticker?.toUpperCase()) ||
            (i.name && i.name.toLowerCase() === asset.name?.toLowerCase())
          )
          invId = fresh?.id
        }
      }
      if (!invId) continue
      for (const tx of asset.txs) {
        await addInvTx(invId, {
          qty:              tx.qty,
          pricePerUnit:     tx.pricePerUnitEur || tx.pricePerUnit || 0,
          pricePerUnitOrig: tx.pricePerUnit || 0,
          totalCost:        tx.totalCost    || 0,
          totalCostEur:     tx.totalCostEur || tx.totalCost || 0,
          totalCostOrig:    tx.totalCost    || 0,
          currency:         tx.currency     || 'EUR',
          fxRate:           tx.fxRate       || 1,
          type:             tx.action       || 'buy',
          date:             tx.date         || new Date().toISOString().split('T')[0],
          note:             `Importat des de ${broker}`,
        })
      }
    }
  }, [investments, addInvestment, addInvTx])

  const handleRefreshPrices = useCallback(async () => {
    for (const inv of investments) {
      if (!inv.ticker || ['efectiu','estalvi','robo'].includes(inv.type)) continue
      try {
        const orig = fetchWithCurrency ? await fetchWithCurrency(inv.ticker) : null
        if (orig?.price != null)
          updateCurrentPrice(inv.id, orig.price, { originalPrice: orig.price, originalCurrency: orig.currency || 'EUR' })
        else {
          const price = await fetchOne(inv.ticker)
          if (price != null) updateCurrentPrice(inv.id, price)
        }
      } catch {}
    }
  }, [investments, fetchOne, updateCurrentPrice])

  const activeAlertsCount = alerts.filter(a => !a.triggered).length
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : '?'

  if (authLoading) return (
    <div className="app-spinner">
      <style>{appStyles}</style>
      <div className="app-spinner-ring"/>
    </div>
  )

  if (!user) return <LoginScreen onLogin={login} error={authError}/>

  return (
    <>
      <style>{appStyles}</style>
      <Sidebar
        active={activeTab}
        onChange={id => { setActiveTab(id); setSidebarOpen(false) }}
        user={user} onLogout={logout}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        activeAlertsCount={activeAlertsCount}
        theme={theme} onToggleTheme={toggleTheme}
      />

      {/* ── Contenidor principal — fons via CSS var ── */}
      <div
        style={{
          height: '100dvh',
          background: 'var(--c-bg)',         
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'background-color 220ms ease',  // transició suau
        }}
        className="lg:ml-[220px]"
      >
        <div className="swipe-hint"/>

        {/* ── Header mòbil ── */}
        <div className="mob-hdr">
          <div className="mob-hdr-left">
            <div className="mob-hdr-logo">
              <img src="/logo_black.png" alt="Cartera" style={{width:20,height:20}}/>
            </div>
            <span className="mob-hdr-title">Cartera</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span className="mob-page-name">{PAGES[activeTab]}</span>
            <ThemeToggleIcon/>
            <div className="mob-av" onClick={() => setSidebarOpen(true)}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer"/>
                : initials}
            </div>
          </div>
        </div>

        {/* ── Contingut pàgina ── */}
        <div style={{flex:1,overflowY:'auto',overflowX:'hidden',display:'flex',flexDirection:'column'}}>
          <main
            style={{flex:1,padding:'22px 18px',paddingBottom:'calc(22px + 60px + env(safe-area-inset-bottom))'}}
            className="lg:px-8 lg:py-7 lg:pb-7"
          >
            {activeTab === 'dashboard' && (
              <DashboardPage
                totalAll={totalAll} totalInvCost={totalInvCost}
                pg={pg} pgPct={pgPct}
                totalSav={totalSav} totalCry={totalCry}
                totalInv={totalInv} totalCom={totalCom}
                investments={investments}
                savings={savingsCompat}
                cryptos={cryptos}
                commodities={commodities}
                snapshots={snapshots}
                dividends={dividends}
                fxRates={fxRates}
                onNavigate={id => setActiveTab(id)}
              />
            )}
            {activeTab === 'investments' && (
              <InvestmentsTable
                investments={investments} onAddInvestment={handleAddInvestment}
                onRemoveInvestment={removeInvestment} onAddTransaction={addInvTx}
                onRemoveTransaction={removeInvTx} loading={priceLoading} status={status}
                onRefresh={handleRefreshPrices} onImportCSV={handleImportCSV}
              />
            )}
            {activeTab === 'savings' && (
              <SavingsList accounts={accounts} onAddAccount={addAccount}
                onRemoveAccount={removeAccount} onAddTransaction={addSavTx}
                onRemoveTransaction={removeSavTx}/>
            )}
            {activeTab === 'crypto' && (
              <CryptoPage cryptos={cryptos} onAdd={addCrypto} onRemove={removeCrypto}
                onUpdate={updateCrypto} onRefresh={refreshCryptoPrices}
                onAddTransaction={addCryptoTx} onRemoveTransaction={removeCryptoTx}/>
            )}
            {activeTab === 'movements'   && <MovementsPage investments={investmentsCompat} savings={savingsCompat} cryptos={cryptos}/>}
            {activeTab === 'timeline'    && <NetWorthTimeline snapshots={snapshots} currentTotal={totalAll} totalCost={totalCost}/>}
            {activeTab === 'projections' && <ProjectionsPage investments={investmentsCompat} savings={savingsCompat} cryptos={cryptos}/>}
            {activeTab === 'chart'       && <AllocationChart investments={investmentsCompat} savings={savingsCompat} cryptos={cryptos} commodities={commodities}/>}
            {activeTab === 'benchmark'   && <BenchmarkPage snapshots={snapshots} investments={investments}/>}
            {activeTab === 'rebalancing' && <RebalancingPage investments={investmentsCompat} savings={savingsCompat} cryptos={cryptos} goals={rebalGoals} onSaveGoals={saveGoals}/>}
            {activeTab === 'alerts'      && <AlertsPage investments={investmentsCompat} cryptos={cryptos} alerts={alerts} onAdd={addAlert} onRemove={removeAlert}/>}
            {activeTab === 'report'      && <MonthlyReport investments={investments} savings={savingsCompat} cryptos={cryptos} commodities={commodities} snapshots={snapshots} userEmail={user?.email||''}/>}
            {activeTab === 'goals'       && <GoalsPage goals={financialGoals} addGoal={addGoal} removeGoal={removeGoal} currentTotal={totalAll} totalDividendsYear={totalDivAll} investments={investmentsCompat}/>}
            {activeTab === 'news'        && <NewsPage investments={investmentsCompat} cryptos={cryptos} commodities={commodities}/>}
            {activeTab === 'dividends'   && <DividendsPage dividends={dividends} addDividend={addDividend} removeDividend={removeDividend} byMonth={byMonth} totalThisYear={totalThisYear} totalAll={totalDivAll} investments={investmentsCompat}/>}
            {activeTab === 'commodities' && <CommoditiesPage commodities={commodities} onAdd={addCommodity} onRemove={removeCommodity} onAddTransaction={addComTx} onRemoveTransaction={removeComTx} onRefresh={refreshCom}/>}
          </main>
        </div>
      </div>

      <BottomNav activePage={activeTab} onNavigate={id => setActiveTab(id)} alertsCount={activeAlertsCount}/>

      <AIAnalyst investments={investmentsCompat} savings={savingsCompat} cryptos={cryptos}
        commodities={commodities} totalAll={totalAll} totalCost={totalCost} pg={pg} pgPct={pgPct}/>
    </>
  )
}