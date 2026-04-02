import { useState, useCallback } from 'react'

// Retorna { price, currency } sense convertir — la conversió es fa a InvestmentsTable
async function getExchangeRate(from, to) {
  try {
    const res  = await fetch(`/yahoo/v8/finance/chart/${from}${to}=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const data = await res.json()
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || null
  } catch { return null }
}

// Tickers europeus sense extensió → prova afegint .DE o .AS
const EU_SUFFIXES = ['.DE', '.AS', '.PA', '.MI', '.L']
async function tryFetchTicker(ticker) {
  // Prova primer query1, fallback query2
  for (const base of ['/yahoo', '/yahoo2']) {
    const res = await fetch(`${base}/v8/finance/chart/${ticker}?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) return res
  }
  return null
}

async function getPriceWithCurrency(ticker) {
  if (!ticker) return null
  try {
    let res = await tryFetchTicker(ticker)
    // Si falla i no té extensió, prova extensions europees
    if (!res && !ticker.includes('.')) {
      for (const suffix of EU_SUFFIXES) {
        res = await tryFetchTicker(ticker + suffix)
        if (res) { ticker = ticker + suffix; break }
      }
    }
    if (!res) return null
    const data     = await res.json()
    const result   = data?.chart?.result?.[0]
    const price    = result?.meta?.regularMarketPrice
    const currency = result?.meta?.currency
    if (!price) return null
    // Normalitza GBp (pence) a GBP
    if (currency === 'GBp') return { price: +(price * 0.01).toFixed(4), currency: 'GBP' }
    return { price: +price.toFixed(4), currency: currency || 'EUR' }
  } catch { return null }
}

// Converteix a EUR per als totals del portfoli
async function getPriceInEur(ticker, rates) {
  const result = await getPriceWithCurrency(ticker)
  if (!result) return null
  const { price, currency } = result
  if (currency === 'USD') return { price: +(price * (rates.USDEUR || 0.92)).toFixed(2), currency: 'EUR', originalPrice: price, originalCurrency: 'USD' }
  if (currency === 'GBP') return { price: +(price * (rates.GBPEUR || 1.17)).toFixed(2), currency: 'EUR', originalPrice: price, originalCurrency: 'GBP' }
  return { price: +price.toFixed(2), currency: 'EUR', originalPrice: price, originalCurrency: currency }
}

export function usePriceFetcher() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState('llest')

  const refreshAll = useCallback(async (investments, updatePrice) => {
    setLoading(true)
    const tickered = investments.filter(i => i.ticker && !['efectiu', 'estalvi', 'robo'].includes(i.type))
    if (!tickered.length) { setStatus('llest'); setLoading(false); return }

    setStatus('obtenint taxes de canvi...')
    const [GBPEUR, USDEUR] = await Promise.all([
      getExchangeRate('GBP', 'EUR'),
      getExchangeRate('USD', 'EUR'),
    ])
    const rates = { GBPEUR: GBPEUR || 1.17, USDEUR: USDEUR || 0.92 }

    setStatus(`actualitzant ${tickered.length} actius...`)
    let updated = 0
    for (const inv of tickered) {
      const result = await getPriceInEur(inv.ticker, rates)
      if (result) {
        // Guarda preu EUR per als càlculs de valor total
        // i preu original per mostrar a la UI
        updatePrice(inv.id, result.price, {
          originalPrice:    result.originalPrice,
          originalCurrency: result.originalCurrency,
          eurRate:          rates,
        })
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
    const rates  = { GBPEUR: GBPEUR || 1.17, USDEUR: USDEUR || 0.92 }
    const result = await getPriceInEur(ticker, rates)
    return result?.price ?? null
  }, [])

  // Retorna preu + moneda original (per mostrar a la UI sense convertir)
  const fetchWithCurrency = useCallback(async (ticker) => {
    return getPriceWithCurrency(ticker)
  }, [])

  return { loading, status, setStatus, refreshAll, fetchOne, fetchWithCurrency }
}