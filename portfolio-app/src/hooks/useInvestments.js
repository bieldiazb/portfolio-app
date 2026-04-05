import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'

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
          invRef.current[id] = { id, ...meta, txs: [], totalQty: 0, totalCost: 0, totalCostEur: 0, avgCost: 0, currentPrice: meta.currentPrice ?? null }
        } else {
          invRef.current[id] = { ...invRef.current[id], ...meta }
        }

        if (!txUnsubs.current[id]) {
          const txQ = query(collection(db, 'users', uid, 'investments', id, 'txs'), orderBy('date', 'asc'))
          txUnsubs.current[id] = onSnapshot(txQ, txSnap => {
            const txs = txSnap.docs.map(t => ({ id: t.id, ...t.data() }))

            let totalQty     = 0
            let totalCost    = 0   // moneda original
            let totalCostEur = 0   // sempre EUR — per P&G globals

            txs.forEach(tx => {
              if (tx.type === 'buy') {
                totalQty     += tx.qty || 0
                totalCost    += tx.totalCost    || 0

                // FIX: suporta txs antigues (sense totalCostEur) i noves
                let eurAmt
                if (tx.totalCostEur != null && tx.totalCostEur > 0) {
                  // Tx nova: totalCostEur guardat correctament amb FX del moment
                  eurAmt = tx.totalCostEur
                } else if (tx.currency && tx.currency !== 'EUR' && tx.fxRate > 0) {
                  // Tx antiga en USD/GBP/etc: reconstrueix amb FX guardat
                  eurAmt = tx.totalCost / tx.fxRate
                } else {
                  // Tx en EUR o sense info: usa totalCost directament
                  eurAmt = tx.totalCost || 0
                }
                totalCostEur += eurAmt
              } else if (tx.type === 'sell') {
                const avgBefore    = totalQty > 0 ? totalCost    / totalQty : 0
                const avgEurBefore = totalQty > 0 ? totalCostEur / totalQty : 0
                totalQty     -= tx.qty || 0
                totalCost    -= (tx.qty || 0) * avgBefore
                totalCostEur -= (tx.qty || 0) * avgEurBefore
              } else if (tx.type === 'capital') {
                totalCost    += tx.totalCost    || 0
                totalCostEur += tx.totalCostEur || tx.totalCost || 0
              }
            })

            const avgCost    = totalQty > 0 ? totalCost    / totalQty : 0
            const avgCostEur = totalQty > 0 ? totalCostEur / totalQty : 0

            if (invRef.current[id]) {
              invRef.current[id] = {
                ...invRef.current[id],
                txs, totalQty, totalCost, totalCostEur, avgCost, avgCostEur,
              }
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

  // ── FIX: addTransaction ara guarda totalCostEur ──────────────────────────────
  // Quan ve d'un import CSV de Revolut (o similar), totalCostEur ja ve calculat
  // amb el FX del moment de compra → es guarda directament sense recalcular.
  // Per transaccions manuals en EUR, totalCostEur = totalCost.
  const addTransaction = useCallback(async (invId, {
    qty, pricePerUnit, pricePerUnitOrig,
    totalCost, totalCostEur, totalCostOrig,
    type, note, date, currency, fxRate,
  }) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'investments', invId, 'txs'), {
      qty:              qty || 0,
      pricePerUnit:     pricePerUnit || 0,
      pricePerUnitOrig: pricePerUnitOrig || pricePerUnit || 0,
      // totalCostEur: import en EUR al moment de la compra (amb FX correcte)
      // Per ETFs en EUR: totalCostEur = totalCost
      // Per LMT en USD: totalCostEur = totalCost / fxRate (calculat al parser)
      totalCost:        totalCost || 0,
      totalCostEur:     totalCostEur ?? totalCost ?? 0,
      totalCostOrig:    totalCostOrig || totalCost || 0,
      currency:         currency || 'EUR',
      fxRate:           fxRate || 1,
      type,
      note:             note || '',
      date:             date || new Date().toISOString().split('T')[0],
      createdAt:        serverTimestamp(),
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