import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'

// ─── useInvestments ───────────────────────────────────────────────────────────
// Dos listeners independents (igual que useSavings):
//   1. Listener d'inversions → metadades (nom, ticker, type)
//   2. Per cada inversió, listener de txs → qty total, cost mitjà, historial
//
// Cada tx:
//   { qty, pricePerUnit, totalCost, type: 'buy'|'sell'|'capital', note, date, createdAt }
//
// Camps calculats per inversió:
//   totalQty     = suma de qty (buy +, sell -)
//   totalCost    = suma de totalCost (buy +, sell -)
//   avgCost      = totalCost / totalQty
//   currentValue = totalQty * currentPrice (o totalCost si no hi ha preu)
//   gain         = currentValue - totalCost

export function useInvestments(uid) {
  const invRef   = useRef({})
  const txUnsubs = useRef({})
  const [investments, setInvestments] = useState([])

  const publish = useCallback(() => {
    setInvestments(
      Object.values(invRef.current).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    )
  }, [])

  useEffect(() => {
    if (!uid) return

    const q = query(collection(db, 'users', uid, 'investments'), orderBy('createdAt', 'desc'))

    const unsubInv = onSnapshot(q, snap => {
      const ids = new Set(snap.docs.map(d => d.id))

      // Neteja eliminades
      Object.keys(invRef.current).forEach(id => {
        if (!ids.has(id)) {
          delete invRef.current[id]
          txUnsubs.current[id]?.()
          delete txUnsubs.current[id]
        }
      })

      snap.docs.forEach(d => {
        const id   = d.id
        const meta = d.data()

        if (!invRef.current[id]) {
          invRef.current[id] = { id, ...meta, txs: [], totalQty: 0, totalCost: 0, avgCost: 0, currentPrice: meta.currentPrice ?? null }
        } else {
          // Actualitza metadades mantenint txs i currentPrice
          invRef.current[id] = { ...invRef.current[id], ...meta }
        }

        // Listener txs
        if (!txUnsubs.current[id]) {
          const txQ = query(collection(db, 'users', uid, 'investments', id, 'txs'), orderBy('date', 'asc'))
          txUnsubs.current[id] = onSnapshot(txQ, txSnap => {
            const txs = txSnap.docs.map(t => ({ id: t.id, ...t.data() }))

            // Calcula totals
            let totalQty  = 0
            let totalCost = 0
            txs.forEach(tx => {
              if (tx.type === 'buy') {
                totalQty  += tx.qty || 0
                totalCost += tx.totalCost || 0
              } else if (tx.type === 'sell') {
                totalQty  -= tx.qty || 0
                // Al vendre, reduïm el cost proporcionalment
                totalCost -= (tx.qty || 0) * (totalQty > 0 ? totalCost / (totalQty + (tx.qty || 0)) : 0)
              } else if (tx.type === 'capital') {
                // Aportació de capital sense canvi de qty (ex: dividends reinvertits, ajust)
                totalCost += tx.totalCost || 0
              }
            })
            const avgCost = totalQty > 0 ? totalCost / totalQty : 0

            if (invRef.current[id]) {
              invRef.current[id] = { ...invRef.current[id], txs, totalQty, totalCost, avgCost }
              publish()
            }
          })
        }
      })

      publish()
    })

    return () => {
      unsubInv()
      Object.values(txUnsubs.current).forEach(fn => fn?.())
      txUnsubs.current = {}
      invRef.current   = {}
    }
  }, [uid, publish])

  // ── Accions ─────────────────────────────────────────────────────────────────

  const addInvestment = useCallback(async ({ name, ticker, type, notes, currency }) => {
    if (!uid) return null
    const docRef = await addDoc(collection(db, 'users', uid, 'investments'), {
      name,
      ticker:           ticker || '',
      type:             type || 'etf',
      notes:            notes || '',
      currency:         currency || 'EUR',
      originalCurrency: currency || 'EUR',
      currentPrice:     null,
      originalPrice:    null,
      createdAt:        serverTimestamp(),
    })
    return docRef
  }, [uid])

  const removeInvestment = useCallback(async (invId) => {
    if (!uid) return
    const inv = invRef.current[invId]
    if (inv?.txs?.length) {
      await Promise.all(inv.txs.map(tx =>
        deleteDoc(doc(db, 'users', uid, 'investments', invId, 'txs', tx.id))
      ))
    }
    await deleteDoc(doc(db, 'users', uid, 'investments', invId))
  }, [uid])

  const addTransaction = useCallback(async (invId, { qty, pricePerUnit, totalCost, type, note, date }) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'investments', invId, 'txs'), {
      qty: qty || 0,
      pricePerUnit: pricePerUnit || 0,
      totalCost: totalCost || 0,
      type, // 'buy' | 'sell' | 'capital'
      note: note || '',
      date: date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeTransaction = useCallback(async (invId, txId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'investments', invId, 'txs', txId))
  }, [uid])

  const updateCurrentPrice = useCallback(async (invId, priceEur, meta = {}) => {
    if (!uid || !invId) return
    const update = {
      currentPrice:     priceEur,
      originalPrice:    meta.originalPrice    ?? priceEur,
      originalCurrency: meta.originalCurrency ?? 'EUR',
      lastUpdated:      new Date().toISOString(),
    }
    await updateDoc(doc(db, 'users', uid, 'investments', invId), update)
    if (invRef.current[invId]) {
      Object.assign(invRef.current[invId], update)
      publish()
    }
  }, [uid, publish])

  return {
    investments,
    addInvestment,
    removeInvestment,
    addTransaction,
    removeTransaction,
    updateCurrentPrice,
  }
}