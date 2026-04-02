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

export function generateDividendDates(refDate, frequency, yearsAhead = 1) {
  // refDate: última data de pagament REAL coneguda (de l'historial)
  if (!refDate || !frequency) return []

  const monthGap  = Math.round(12 / frequency)
  const now       = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const limit     = new Date(now.getFullYear() + yearsAhead, 11, 31)

  // Partim de la data de referència i retrocedim fins a l'any actual
  let current = new Date(refDate)
  while (current > yearStart) {
    current = new Date(current.getFullYear(), current.getMonth() - monthGap, current.getDate())
  }

  const dates = []
  current = new Date(current.getFullYear(), current.getMonth() + monthGap, current.getDate())
  while (current <= limit) {
    if (current >= yearStart) {
      dates.push({
        date:    current.toISOString().split('T')[0],
        isExact: false,
      })
    }
    current = new Date(current.getFullYear(), current.getMonth() + monthGap, current.getDate())
  }
  return dates
}

// ── Fetch Yahoo Finance ───────────────────────────────────────────────────────
// Usa /v8/finance/chart que ja funciona amb el proxy de Netlify.
// El camp meta té: exDividendDate, dividendRate, trailingAnnualDividendRate
// A partir d'ells calculem freqüència i projectem totes les dates de l'any.
export async function fetchDividendInfo(ticker) {
  try {
    // range=2y + events=dividends per obtenir l'historial real de pagaments
    const res = await fetch(
      `/yahoo/v8/finance/chart/${ticker}?interval=1mo&range=5y&events=dividends`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta || {}

    // Dividends històrics de Yahoo (timestamps)
    const rawDivs = result.events?.dividends
      ? Object.values(result.events.dividends)
      : []

    // Ordena per data DESC (el més recent primer)
    // IMPORTANT: d.date és el PAY DATE real, no l'ex-date
    const histDivs = rawDivs
      .map(d => ({
        date:   new Date(d.date * 1000).toISOString().split('T')[0],
        amount: d.amount,
        ts:     d.date,
      }))
      .sort((a, b) => b.ts - a.ts)  // ordena per timestamp numèric

    // Ex-date del meta (el proper confirmat)
    const exDate = meta.exDividendDate
      ? new Date(meta.exDividendDate * 1000).toISOString().split('T')[0]
      : null

    const dividendRate  = meta.dividendRate || null
    const trailingRate  = meta.trailingAnnualDividendRate || null
    const dividendYield = meta.dividendYield || null
    const trailingYield = meta.trailingAnnualDividendYield || null

    // Calcula freqüència real a partir dels pagaments històrics
    let frequency = guessFrequency(dividendRate, trailingRate)
    if (histDivs.length >= 3) {
      // Mira l'interval mitjà entre els últims pagaments (en mesos)
      const gaps = []
      for (let i = 0; i < Math.min(histDivs.length - 1, 6); i++) {
        const a = new Date(histDivs[i].date)
        const b = new Date(histDivs[i + 1].date)
        const months = (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth())
        if (months > 0 && months <= 13) gaps.push(months)
      }
      if (gaps.length > 0) {
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
        if      (avgGap <= 1.5) frequency = 12
        else if (avgGap <= 2.5) frequency = 6
        else if (avgGap <= 4.5) frequency = 4
        else if (avgGap <= 7)   frequency = 2
        else                    frequency = 1
      }
    }

    // Data de referència: el darrer pagament històric és el més fiable
    // Si no, usem l'exDate del meta
    const refDate = histDivs[0]?.date || exDate

    const allDates = generateDividendDates(refDate, null, frequency)

    return {
      exDate,
      payDate:      null,
      dividendRate,
      dividendYield,
      trailingRate,
      trailingYield,
      frequency,
      allDates,
      histDivs,   // historial per debug
      refDate,
      source: 'chart-events',
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