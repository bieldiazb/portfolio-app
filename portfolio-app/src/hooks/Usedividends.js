// ─── hooks/useDividends.js ────────────────────────────────────────────────────
// Usa Financial Modeling Prep (FMP) per ex-dates, pay dates i earnings reals.
// Clau gratuïta: https://financialmodelingprep.com/register (250 crides/dia)
// Afegeix FMP_API_KEY a Netlify Environment Variables.
//
// Netlify Function proxy (afegir a netlify/functions/fmp.js):
//   GET /fmp/[endpoint] → https://financialmodelingprep.com/api/[endpoint]
//   Injecta la clau API al servidor (no exposada al client)

import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

// ── Config ────────────────────────────────────────────────────────────────────
const FMP_BASE = '/fmp'   // proxy Netlify (veure netlify/functions/fmp.js)

async function fmpGet(path, params = {}) {
  // Passem el path com a query param ?path= per màxima compatibilitat
  // amb Netlify Functions (evita problemes de routing amb /:splat)
  const qs = new URLSearchParams({ path, ...params })
  const url = `${FMP_BASE}?${qs.toString()}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`FMP ${res.status}: ${txt.slice(0,100)}`)
  }
  return res.json()
}

// ── Dates ─────────────────────────────────────────────────────────────────────
export function generateDividendDates(refDate, frequency, yearsAhead = 1) {
  if (!refDate || !frequency) return []
  const monthGap  = Math.round(12 / frequency)
  const now       = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const limit     = new Date(now.getFullYear() + yearsAhead, 11, 31)

  let current = new Date(refDate)
  while (current > yearStart)
    current = new Date(current.getFullYear(), current.getMonth() - monthGap, current.getDate())

  const dates = []
  current = new Date(current.getFullYear(), current.getMonth() + monthGap, current.getDate())
  while (current <= limit) {
    if (current >= yearStart)
      dates.push({ date: current.toISOString().split('T')[0], isExact: false })
    current = new Date(current.getFullYear(), current.getMonth() + monthGap, current.getDate())
  }
  return dates
}

// ── fetchDividendInfo — usa FMP + fallback Yahoo ──────────────────────────────
export async function fetchDividendInfo(ticker) {
  // Normalitza ticker per FMP (treu extensió .DE .AS etc)
  const fmpTicker = ticker.includes('.') ? ticker.split('.')[0] : ticker

  try {
    // ── 1. FMP: historial de dividends ────────────────────────────────────────
    // Retorna: date (ex-date), paymentDate, dividend (import/acció), adjDividend
    const [divHistory, earningsHistory, profile] = await Promise.allSettled([
      fmpGet(`/v3/historical-price-full/stock_dividend/${fmpTicker}`),
      fmpGet(`/v3/historical/earning_calendar/${fmpTicker}`),
      fmpGet(`/v3/profile/${fmpTicker}`),
    ])

    const divData      = divHistory.status      === 'fulfilled' ? divHistory.value      : null
    const earningsData = earningsHistory.status === 'fulfilled' ? earningsHistory.value : null
    const profileData  = profile.status         === 'fulfilled' ? profile.value?.[0]   : null

    // Historial de dividends (ordenat del més recent al més antic)
    const histDivs = (divData?.historical || [])
      .filter(d => d.date && d.paymentDate)
      .slice(0, 20)  // últims 20 pagaments
      .map(d => ({
        exDate:      d.date,                  // data ex-dividend real
        date:        d.paymentDate,           // pay date real
        amount:      d.dividend || d.adjDividend || 0,
        label:       d.label || '',
      }))

    // ── 2. Ex-date i pay date PROPER (el primer histDiv és el més recent) ─────
    const today     = new Date().toISOString().split('T')[0]
    const nextDiv   = histDivs.find(d => d.date >= today)    // proper pagament futur
    const lastDiv   = histDivs.find(d => d.date < today)     // últim pagament passat

    const nextExDate  = nextDiv?.exDate  || null
    const nextPayDate = nextDiv?.date    || null

    // ── 3. Freqüència calculada de l'historial real ───────────────────────────
    let frequency = 4  // trimestral per defecte
    const paidDivs = histDivs.filter(d => d.date < today)
    if (paidDivs.length >= 3) {
      const gaps = []
      for (let i = 0; i < Math.min(paidDivs.length - 1, 8); i++) {
        const a = new Date(paidDivs[i].date)
        const b = new Date(paidDivs[i + 1].date)
        const months = (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth())
        if (months > 0 && months <= 14) gaps.push(months)
      }
      if (gaps.length > 0) {
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length
        frequency = avg <= 1.5 ? 12 : avg <= 2.5 ? 6 : avg <= 4.5 ? 4 : avg <= 7 ? 2 : 1
      }
    }

    // ── 4. Import per pagament ────────────────────────────────────────────────
    const lastAmount  = lastDiv?.amount  || nextDiv?.amount  || null
    const perPayment  = lastAmount       || null

    // Yield anual
    const currentPrice = profileData?.price || null
    const dividendRate = perPayment ? +(perPayment * frequency).toFixed(4) : null
    const dividendYield = currentPrice && dividendRate ? +(dividendRate / currentPrice) : null

    // ── 5. Earnings ───────────────────────────────────────────────────────────
    // FMP historical/earning_calendar retorna llista ordenada per data
    const allEarnings = Array.isArray(earningsData) ? earningsData : []
    const futureEarnings = allEarnings.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
    const nextEarnings   = futureEarnings[0] || null

    const earningsStart  = nextEarnings?.date    || null
    const epsEstimate    = nextEarnings?.epsEstimated != null ? +nextEarnings.epsEstimated.toFixed(2) : null
    const epsActual      = nextEarnings?.eps       != null    ? +nextEarnings.eps.toFixed(2)           : null
    const revenueEst     = nextEarnings?.revenueEstimated || null
    const earningsTime   = nextEarnings?.time || null  // 'bmo' (before market open) | 'amc' (after market close)

    // ── 6. Genera dates projectades ───────────────────────────────────────────
    const refDate  = nextPayDate || lastDiv?.date || null
    const payDates = generateDividendDates(refDate, frequency)

    // Calcula offset ex→pay des de l'historial real
    const offsets = histDivs
      .filter(d => d.exDate && d.date)
      .slice(0, 6)
      .map(d => Math.round((new Date(d.date) - new Date(d.exDate)) / 86400000))
      .filter(o => o > 0 && o < 60)
    const avgOffset = offsets.length > 0
      ? Math.round(offsets.reduce((a, b) => a + b, 0) / offsets.length)
      : 26  // fallback

    // Per cada pay date projectat, calcula l'ex-date
    const allDates = payDates.map(({ date, isExact }) => {
      const payDt = new Date(date + 'T12:00:00')
      const exDt  = new Date(payDt); exDt.setDate(exDt.getDate() - avgOffset)
      return { date, exDate: exDt.toISOString().split('T')[0], isExact }
    })

    // Insereix les dates REALS de FMP (isExact:true) substituint les projectades
    if (nextExDate && nextPayDate) {
      const idx = allDates.findIndex(d => {
        const diff = Math.abs(new Date(d.date) - new Date(nextPayDate))
        return diff < 40 * 86400000
      })
      const realEntry = { date: nextPayDate, exDate: nextExDate, isExact: true }
      if (idx >= 0) allDates[idx] = realEntry
      else allDates.unshift(realEntry)
      allDates.sort((a, b) => a.date.localeCompare(b.date))
    }

    return {
      // Dates reals del proper dividend (FMP)
      nextExDate,
      nextPayDate,
      // Earnings
      earningsStart,
      earningsEnd:    null,
      epsEstimate,
      epsActual,
      revenueEst,
      earningsTime,   // 'bmo' | 'amc' | null
      // Dividend info
      dividendRate,
      dividendYield,
      trailingRate:  dividendRate,
      trailingYield: dividendYield,
      frequency,
      exPayOffsetDays: avgOffset,
      perPayment,
      currentPrice,
      // Dates
      allDates,
      histDivs,
      // Meta
      source: 'fmp',
      fmpTicker,
    }

  } catch (err) {
    console.warn(`fetchDividendInfo FMP error (${ticker}):`, err.message)
    // ── Fallback: Yahoo Finance ───────────────────────────────────────────────
    return fetchDividendInfoYahoo(ticker)
  }
}

// ── Fallback Yahoo (manté la lògica anterior si FMP falla) ────────────────────
async function fetchDividendInfoYahoo(ticker) {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${ticker}?interval=1mo&range=5y&events=dividends`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data   = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null

    const meta    = result.meta || {}
    const rawDivs = result.events?.dividends ? Object.values(result.events.dividends) : []
    const histDivs = rawDivs
      .map(d => ({
        date:   new Date(d.date * 1000).toISOString().split('T')[0],
        amount: d.amount, ts: d.date,
      }))
      .sort((a, b) => b.ts - a.ts)

    let frequency = 4
    if (histDivs.length >= 3) {
      const gaps = []
      for (let i = 0; i < Math.min(histDivs.length - 1, 6); i++) {
        const a = new Date(histDivs[i].date), b = new Date(histDivs[i+1].date)
        const m = (a.getFullYear()-b.getFullYear())*12+(a.getMonth()-b.getMonth())
        if (m > 0 && m <= 13) gaps.push(m)
      }
      if (gaps.length) {
        const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
        frequency = avg<=1.5?12:avg<=2.5?6:avg<=4.5?4:avg<=7?2:1
      }
    }

    const dividendRate  = meta.dividendRate || null
    const dividendYield = meta.dividendYield || null
    const refDate       = histDivs[0]?.date || null
    const allDatesRaw   = generateDividendDates(refDate, frequency)
    const offset        = ticker.includes('.') ? 15 : 26
    const allDates      = allDatesRaw.map(({ date, isExact }) => {
      const payDt = new Date(date+'T12:00:00')
      const exDt  = new Date(payDt); exDt.setDate(exDt.getDate()-offset)
      return { date, exDate: exDt.toISOString().split('T')[0], isExact }
    })

    return {
      nextExDate: null, nextPayDate: null,
      earningsStart: null, earningsEnd: null,
      epsEstimate: null, earningsTime: null,
      dividendRate, dividendYield,
      trailingRate: dividendRate, trailingYield: dividendYield,
      frequency, exPayOffsetDays: offset,
      perPayment: histDivs[0]?.amount || null,
      allDates, histDivs: histDivs.map(d => ({ ...d, exDate: null })),
      source: 'yahoo-fallback',
    }
  } catch { return null }
}

export const fetchNextDividend = fetchDividendInfo

// ── Hook Firestore ────────────────────────────────────────────────────────────
export function useDividends(uid) {
  const [dividends, setDividends] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'dividends'),
      orderBy('payDate', 'desc')
    )
    return onSnapshot(q, snap => {
      setDividends(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [uid])

  const addDividend = useCallback(async ({
    assetId, assetName, ticker, amount, payDate, shares, currency = 'EUR', note = ''
  }) => {
    if (!uid) return
    const amt = parseFloat(amount) || 0
    const shr = parseFloat(shares) || 0
    await addDoc(collection(db, 'users', uid, 'dividends'), {
      assetId, assetName, ticker,
      amount: amt, shares: shr,
      perShare: shr > 0 ? amt / shr : 0,
      currency, payDate, note,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeDividend = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'dividends', id))
  }, [uid])

  const byMonth = dividends.reduce((acc, d) => {
    const key = d.payDate?.slice(0, 7) || 'desconegut'
    acc[key] = (acc[key] || 0) + (d.amount || 0)
    return acc
  }, {})

  const thisYear      = new Date().getFullYear().toString()
  const totalThisYear = dividends.filter(d => d.payDate?.startsWith(thisYear)).reduce((s, d) => s + d.amount, 0)
  const totalAll      = dividends.reduce((s, d) => s + d.amount, 0)

  return { dividends, addDividend, removeDividend, byMonth, totalThisYear, totalAll }
}