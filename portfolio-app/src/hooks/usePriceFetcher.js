import { useState, useCallback } from 'react'

// Agafa la taxa de canvi en temps real de Yahoo Finance
async function getExchangeRate(from, to) {
  try {
    const pair = `${from}${to}=X`
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?interval=1d&range=1d`
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`)
    const data = await res.json()
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return rate || null
  } catch {
    return null
  }
}

async function getPrice(ticker, rates) {
  if (!ticker) return null
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`)
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    const price = result?.meta?.regularMarketPrice
    const currency = result?.meta?.currency
    if (!price) return null

    if (currency === 'USD') return +(price * (rates.USDEUR || 0.92)).toFixed(2)
    if (currency === 'GBp') return +(price * 0.01 * (rates.GBPEUR || 1.17)).toFixed(2)
    if (currency === 'GBP') return +(price * (rates.GBPEUR || 1.17)).toFixed(2)
    return +price.toFixed(2)
  } catch {
    return null
  }
}

export function usePriceFetcher() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('llest')

  const refreshAll = useCallback(async (investments, updatePrice) => {
    setLoading(true)

    const tickered = investments.filter(
      i => i.ticker && !['efectiu', 'estalvi', 'robo'].includes(i.type)
    )
    if (tickered.length === 0) {
      setStatus('llest')
      setLoading(false)
      return
    }

    // Agafa taxes de canvi en temps real
    setStatus('obtenint taxes de canvi...')
    const [GBPEUR, USDEUR] = await Promise.all([
      getExchangeRate('GBP', 'EUR'),
      getExchangeRate('USD', 'EUR'),
    ])
    const rates = {
      GBPEUR: GBPEUR || 1.17,
      USDEUR: USDEUR || 0.92,
    }

    setStatus(`actualitzant ${tickered.length} actius...`)
    let updated = 0
    for (const inv of tickered) {
      const price = await getPrice(inv.ticker, rates)
      if (price !== null) {
        updatePrice(inv.id, price)
        updated++
      }
    }
    setStatus(updated > 0
      ? `${updated} preus actualitzats · ${new Date().toLocaleTimeString('ca-ES')}`
      : 'mercat tancat o preus no disponibles'
    )
    setLoading(false)
  }, [])

  const fetchOne = useCallback(async (ticker) => {
    const [GBPEUR, USDEUR] = await Promise.all([
      getExchangeRate('GBP', 'EUR'),
      getExchangeRate('USD', 'EUR'),
    ])
    return await getPrice(ticker, { GBPEUR: GBPEUR || 1.17, USDEUR: USDEUR || 0.92 })
  }, [])

  return { loading, status, setStatus, refreshAll, fetchOne }
}