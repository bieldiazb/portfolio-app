// ─── useCommodities.js ────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'

// Fetches preu en USD des de Yahoo Finance via proxy Vite/Netlify
async function fetchCommodityPrice(ticker) {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return price > 0 ? +price.toFixed(4) : null
  } catch { return null }
}

async function fetchUsdToEur() {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/USDEUR=X?interval=1d&range=1d`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return rate > 0 ? +rate.toFixed(6) : null
  } catch { return null }
}

export function useCommodities(uid) {
  const [commodities, setCommodities] = useState([])
  const [loading, setLoading]         = useState(false)
  const [status, setStatus]           = useState('')

  // Subscripció Firestore
  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'commodities'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setCommodities(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        txs: [], // es carreguen per sub-col·lecció
      })))
    })
  }, [uid])

  // Carrega les txs de cada commodity
  useEffect(() => {
    if (!uid || commodities.length === 0) return
    const unsubs = commodities.map(c => {
      const q = query(
        collection(db, 'users', uid, 'commodities', c.id, 'txs'),
        orderBy('date', 'asc')
      )
      return onSnapshot(q, snap => {
        const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setCommodities(prev => prev.map(x =>
          x.id === c.id ? { ...x, txs } : x
        ))
      })
    })
    return () => unsubs.forEach(u => u())
  }, [uid, commodities.length]) // eslint-disable-line

  const addCommodity = useCallback(async ({ name, symbol, ticker, unit, unitLabel }) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'commodities'), {
      name, symbol, ticker, unit, unitLabel,
      currentPrice: null,
      totalQty: 0,
      totalCost: 0,
      avgCost: 0,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeCommodity = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'commodities', id))
  }, [uid])

  const addTransaction = useCallback(async (commodityId, tx) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, 'commodities', commodityId)
    const c   = commodities.find(x => x.id === commodityId)
    if (!c) return

    // Guarda la tx
    await addDoc(
      collection(db, 'users', uid, 'commodities', commodityId, 'txs'),
      { ...tx, createdAt: serverTimestamp() }
    )

    // Recalcula totals
    const sign   = tx.type === 'buy' ? 1 : -1
    const newQty = (c.totalQty || 0) + sign * tx.qty
    let newCost  = (c.totalCost || 0)
    if (tx.type === 'buy')  newCost += tx.totalCostEur || tx.totalCost
    if (tx.type === 'sell') newCost -= (c.avgCost || 0) * tx.qty * ((tx.pricePerUnitEur||tx.pricePerUnit)/(tx.pricePerUnit||1))

    const newAvg = newQty > 0 ? newCost / newQty : 0

    await updateDoc(ref, {
      totalQty:  Math.max(0, +newQty.toFixed(8)),
      totalCost: Math.max(0, +newCost.toFixed(2)),
      avgCost:   Math.max(0, +newAvg.toFixed(4)),
    })
  }, [uid, commodities])

  const removeTransaction = useCallback(async (commodityId, txId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'commodities', commodityId, 'txs', txId))
    // Recalcula des de zero
    const c = commodities.find(x => x.id === commodityId)
    if (!c) return
    const txs = c.txs.filter(t => t.id !== txId)
    let totalQty=0, totalCost=0
    txs.forEach(t => {
      if (t.type==='buy')  { totalQty+=t.qty; totalCost+=(t.totalCostEur||t.totalCost) }
      if (t.type==='sell') { totalQty-=t.qty }
    })
    const avgCost = totalQty > 0 ? totalCost / totalQty : 0
    await updateDoc(doc(db,'users',uid,'commodities',commodityId), {
      totalQty:  Math.max(0,+totalQty.toFixed(8)),
      totalCost: Math.max(0,+totalCost.toFixed(2)),
      avgCost:   Math.max(0,+avgCost.toFixed(4)),
    })
  }, [uid, commodities])

  // Actualitza preus des de Yahoo
  const refreshPrices = useCallback(async () => {
    if (!uid || commodities.length === 0) return
    setLoading(true)
    setStatus('Actualitzant preus...')
    try {
      const fxRate = await fetchUsdToEur()
      await Promise.all(commodities.map(async c => {
        const price = await fetchCommodityPrice(c.ticker)
        if (price == null) return
        const priceEur = fxRate ? +(price * fxRate).toFixed(2) : price
        await updateDoc(doc(db,'users',uid,'commodities',c.id), {
          currentPrice:    price,
          currentPriceEur: priceEur,
          fxRate:          fxRate || 1,
          lastUpdated:     new Date().toISOString(),
        })
      }))
      setStatus(`Actualitzat ${new Date().toLocaleTimeString('ca-ES')}`)
    } catch {
      setStatus('Error actualitzant preus')
    }
    setLoading(false)
  }, [uid, commodities])

  return {
    commodities,
    loading,
    status,
    addCommodity,
    removeCommodity,
    addTransaction,
    removeTransaction,
    refreshPrices,
  }
}