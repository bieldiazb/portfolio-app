import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'

// ─── useCryptos ───────────────────────────────────────────────────────────────
// Dos listeners independents per cada crypto:
//   1. Listener de cryptos → metadades (nom, symbol, coinId)
//   2. Per cada crypto, listener de txs → qty total, cost mitjà
//
// Cada tx: { qty, pricePerUnit, totalCost, type:'buy'|'sell', note, date }

export function useCryptos(uid) {
  const cryptoRef = useRef({})
  const txUnsubs  = useRef({})
  const [cryptos, setCryptos] = useState([])

  const publish = useCallback(() => {
    setCryptos(
      Object.values(cryptoRef.current)
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    )
  }, [])

  useEffect(() => {
    if (!uid) return

    const q = query(collection(db, 'users', uid, 'cryptos'), orderBy('createdAt', 'desc'))

    const unsubCryptos = onSnapshot(q, snap => {
      const ids = new Set(snap.docs.map(d => d.id))

      // Neteja eliminades
      Object.keys(cryptoRef.current).forEach(id => {
        if (!ids.has(id)) {
          delete cryptoRef.current[id]
          txUnsubs.current[id]?.()
          delete txUnsubs.current[id]
        }
      })

      snap.docs.forEach(d => {
        const id   = d.id
        const meta = d.data()

        if (!cryptoRef.current[id]) {
          cryptoRef.current[id] = {
            id, ...meta,
            txs: [], totalQty: 0, totalCost: 0, avgCost: 0,
          }
        } else {
          cryptoRef.current[id] = { ...cryptoRef.current[id], ...meta }
        }

        // Listener txs
        if (!txUnsubs.current[id]) {
          const txQ = query(
            collection(db, 'users', uid, 'cryptos', id, 'txs'),
            orderBy('date', 'asc')
          )
          txUnsubs.current[id] = onSnapshot(txQ, txSnap => {
            const txs = txSnap.docs.map(t => ({ id: t.id, ...t.data() }))
            let totalQty = 0, totalCost = 0
            txs.forEach(tx => {
              if (tx.type === 'buy') {
                totalQty  += tx.qty || 0
                totalCost += tx.totalCost || 0
              } else if (tx.type === 'sell') {
                const avgBeforeSell = totalQty > 0 ? totalCost / totalQty : 0
                totalQty  -= tx.qty || 0
                totalCost -= (tx.qty || 0) * avgBeforeSell
              }
            })
            const avgCost = totalQty > 0 ? totalCost / totalQty : 0

            if (cryptoRef.current[id]) {
              cryptoRef.current[id] = { ...cryptoRef.current[id], txs, totalQty, totalCost, avgCost }
              publish()
            }
          })
        }
      })

      publish()
    })

    return () => {
      unsubCryptos()
      Object.values(txUnsubs.current).forEach(fn => fn?.())
      txUnsubs.current = {}
      cryptoRef.current = {}
    }
  }, [uid, publish])

  // ── Accions ──────────────────────────────────────────────────────────────────

  const addCrypto = useCallback(async ({ name, symbol, coinId }) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'cryptos'), {
      name, symbol: symbol?.toUpperCase() || '',
      coinId: coinId?.toLowerCase() || '',
      currentPrice: null,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeCrypto = useCallback(async (cryptoId) => {
    if (!uid) return
    const c = cryptoRef.current[cryptoId]
    if (c?.txs?.length) {
      await Promise.all(c.txs.map(tx =>
        deleteDoc(doc(db, 'users', uid, 'cryptos', cryptoId, 'txs', tx.id))
      ))
    }
    await deleteDoc(doc(db, 'users', uid, 'cryptos', cryptoId))
  }, [uid])

  const updateCrypto = useCallback(async (cryptoId, data) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'cryptos', cryptoId), data)
  }, [uid])

  const updateCryptoPrice = useCallback(async (cryptoId, price) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'cryptos', cryptoId), {
      currentPrice: price, lastUpdated: new Date().toISOString(),
    })
    if (cryptoRef.current[cryptoId]) {
      cryptoRef.current[cryptoId].currentPrice = price
      publish()
    }
  }, [uid, publish])

  const addTransaction = useCallback(async (cryptoId, { qty, pricePerUnit, totalCost, type, note, date }) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'cryptos', cryptoId, 'txs'), {
      qty: qty || 0,
      pricePerUnit: pricePerUnit || 0,
      totalCost: totalCost || 0,
      type,
      note: note || '',
      date: date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeTransaction = useCallback(async (cryptoId, txId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'cryptos', cryptoId, 'txs', txId))
  }, [uid])

  return {
    cryptos,
    addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
    addTransaction, removeTransaction,
  }
}