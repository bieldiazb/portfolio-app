// ─── hooks/useDividends.js ────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

// ── Freqüència i dates ────────────────────────────────────────────────────────

function guessFrequency(dividendRate, trailingRate) {
  if (!dividendRate || !trailingRate || trailingRate <= 0) return 4
  const ratio = trailingRate / dividendRate
  if (ratio <= 1.2) return 1
  if (ratio <= 2.5) return 2
  if (ratio <= 4.5) return 4
  if (ratio <= 7)   return 6
  return 12
}

export function generateDividendDates(lastExDate, lastPayDate, frequency, yearsAhead = 1) {
  // Usem payDate si disponible, sinó exDate com a referència
  const refDateStr = lastPayDate || lastExDate
  if (!refDateStr) return []

  const monthGap  = Math.round(12 / frequency)
  const now       = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const limit     = new Date(now.getFullYear() + yearsAhead, 11, 31)

  let current = new Date(refDateStr)
  // Retrocedim fins a estar dins o just abans de l'any actual
  while (current > yearStart) {
    current = new Date(current.getFullYear(), current.getMonth() - monthGap, current.getDate())
  }
  // Avancem i recollim totes les dates dins el rang
  const dates = []
  current = new Date(current.getFullYear(), current.getMonth() + monthGap, current.getDate())
  while (current <= limit) {
    if (current >= yearStart) {
      dates.push({
        date:    current.toISOString().split('T')[0],
        isExact: false, // projectada, no confirmada
      })
    }
    current = new Date(current.getFullYear(), current.getMonth() + monthGap, current.getDate())
  }
  return dates
}

// ── Fetch Yahoo Finance quoteSummary ──────────────────────────────────────────
// Usa quoteSummary per obtenir calendarEvents (dividends confirmats)
// i summaryDetail per dividend rate i freqüència
export async function fetchDividendInfo(ticker) {
  try {
    // Prova primer calendarEvents + summaryDetail
    const res = await fetch(
      `/yahoo/v11/finance/quoteSummary/${ticker}?modules=calendarEvents,summaryDetail,defaultKeyStatistics`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json()
      const result = data?.quoteSummary?.result?.[0]

      const cal     = result?.calendarEvents
      const summary = result?.summaryDetail
      const stats   = result?.defaultKeyStatistics

      // Dividend confirmat de calendarEvents
      const exDateTs  = cal?.exDividendDate?.raw
      const exDate    = exDateTs ? new Date(exDateTs * 1000).toISOString().split('T')[0] : null

      // Pay date (quan realment es cobra)
      const payDateTs = cal?.dividendDate?.raw
      const payDate   = payDateTs ? new Date(payDateTs * 1000).toISOString().split('T')[0] : null

      const dividendRate  = summary?.dividendRate?.raw  || null
      const dividendYield = summary?.dividendYield?.raw || null
      const trailingRate  = summary?.trailingAnnualDividendRate?.raw || stats?.trailingAnnualDividendRate?.raw || null
      const trailingYield = summary?.trailingAnnualDividendYield?.raw || null

      const frequency = guessFrequency(dividendRate, trailingRate)
      const allDates  = generateDividendDates(exDate, payDate, frequency)

      return {
        exDate, payDate,
        dividendRate, dividendYield,
        trailingRate, trailingYield,
        frequency,
        allDates,     // { date, isExact }[]
        source: 'quoteSummary',
      }
    }
  } catch {}

  // Fallback: /chart
  try {
    const res2 = await fetch(
      `/yahoo/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res2.ok) return null
    const d2   = await res2.json()
    const meta = d2?.chart?.result?.[0]?.meta

    const exDate = meta?.exDividendDate
      ? new Date(meta.exDividendDate * 1000).toISOString().split('T')[0]
      : null

    const dividendRate = meta?.dividendRate || null
    const trailingRate = meta?.trailingAnnualDividendRate || null
    const frequency    = guessFrequency(dividendRate, trailingRate)
    const allDates     = generateDividendDates(exDate, null, frequency)

    return {
      exDate, payDate: null,
      dividendRate, dividendYield: meta?.dividendYield || null,
      trailingRate, trailingYield: meta?.trailingAnnualDividendYield || null,
      frequency, allDates,
      source: 'chart',
    }
  } catch { return null }
}

// Alias per compatibilitat
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