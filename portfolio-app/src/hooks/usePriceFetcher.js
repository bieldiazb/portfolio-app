import { useState, useCallback } from 'react'

async function fetchYahooPrice(ticker) {
  if (!ticker) return null
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(url)
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    const currency = data?.chart?.result?.[0]?.meta?.currency
    if (!price) return null
    return currency === 'USD' ? price * 0.92 : price
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
      i => i.ticker && i.type !== 'efectiu' && i.type !== 'estalvi' && i.type !== 'robo'
    )
    setStatus(`actualitzant ${tickered.length} actius...`)
    let updated = 0
    for (const inv of tickered) {
      const price = await fetchYahooPrice(inv.ticker)
      if (price !== null) {
        updatePrice(inv.id, price)
        updated++
      }
    }
    setStatus(`${updated} preus actualitzats · ${new Date().toLocaleTimeString('ca-ES')}`)
    setLoading(false)
    return updated
  }, [])

  const fetchOne = useCallback(async (ticker) => {
    return await fetchYahooPrice(ticker)
  }, [])

  return { loading, status, setStatus, refreshAll, fetchOne }
}
