// ─── hooks/useDividends.js ────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

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
    await addDoc(collection(db, 'users', uid, 'dividends'), {
      assetId, assetName, ticker,
      amount: parseFloat(amount) || 0,
      shares: parseFloat(shares) || 0,
      perShare: shares > 0 ? parseFloat(amount) / parseFloat(shares) : 0,
      currency,
      payDate,
      note,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeDividend = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'dividends', id))
  }, [uid])

  // Agrega per mes YYYY-MM
  const byMonth = dividends.reduce((acc, d) => {
    const key = d.payDate?.slice(0, 7) || 'desconegut'
    acc[key] = (acc[key] || 0) + (d.amount || 0)
    return acc
  }, {})

  // Total anual (any en curs)
  const thisYear = new Date().getFullYear().toString()
  const totalThisYear = dividends
    .filter(d => d.payDate?.startsWith(thisYear))
    .reduce((s, d) => s + d.amount, 0)

  // Total acumulat
  const totalAll = dividends.reduce((s, d) => s + d.amount, 0)

  return { dividends, addDividend, removeDividend, byMonth, totalThisYear, totalAll }
}

// Fetch proper dividend des de Yahoo Finance (ex-date + amount)
export async function fetchNextDividend(ticker) {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    return {
      exDate:        meta?.exDividendDate ? new Date(meta.exDividendDate * 1000).toISOString().split('T')[0] : null,
      dividendRate:  meta?.dividendRate  || null,
      dividendYield: meta?.dividendYield || null,
      trailingAnnualDividendRate:  meta?.trailingAnnualDividendRate  || null,
      trailingAnnualDividendYield: meta?.trailingAnnualDividendYield || null,
    }
  } catch { return null }
}