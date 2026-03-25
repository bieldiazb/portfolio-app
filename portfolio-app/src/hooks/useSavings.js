import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

// ─── useSavings ───────────────────────────────────────────────────────────────
// Dos listeners completament independents:
//   1. Listener de comptes → manté la llista de comptes
//   2. Per cada compte, listener de txs → actualitza balance i historial
//
// El listener de txs es crea UNA SOLA VEGADA per compte i escolta
// canvis en temps real. No depèn del listener de comptes.

export function useSavings(uid) {
  // accountsRef guarda l'estat dels comptes sense dependre del re-render
  const accountsRef = useRef({})
  const [accounts, setAccounts] = useState([])
  const txUnsubsRef = useRef({})

  // Funció per recalcular i publicar l'estat
  const publish = useCallback(() => {
    const list = Object.values(accountsRef.current)
      .sort((a, b) => {
        // Ordena per createdAt descendent
        const ta = a.createdAt?.seconds ?? 0
        const tb = b.createdAt?.seconds ?? 0
        return tb - ta
      })
    setAccounts(list)
  }, [])

  useEffect(() => {
    if (!uid) return

    // ── Listener 1: comptes ──────────────────────────────────────────────────
    const accountsQ = query(
      collection(db, 'users', uid, 'savings'),
      orderBy('createdAt', 'desc')
    )

    const unsubAccounts = onSnapshot(accountsQ, snap => {
      const currentIds = new Set(snap.docs.map(d => d.id))

      // Elimina comptes esborrats
      Object.keys(accountsRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          delete accountsRef.current[id]
          txUnsubsRef.current[id]?.()
          delete txUnsubsRef.current[id]
        }
      })

      // Per cada compte, actualitza les metadades
      snap.docs.forEach(d => {
        const id = d.id
        const meta = d.data()

        // Si el compte és nou, inicialitza'l
        if (!accountsRef.current[id]) {
          accountsRef.current[id] = { id, ...meta, txs: [], balance: 0 }
        } else {
          // Actualitza les metadades (nom, rate, notes) però manté txs i balance
          accountsRef.current[id] = {
            ...accountsRef.current[id],
            ...meta,
          }
        }

        // ── Listener 2: txs de cada compte ──────────────────────────────────
        // Crea el listener de txs si no existeix encara per aquest compte
        if (!txUnsubsRef.current[id]) {
          const txsQ = query(
            collection(db, 'users', uid, 'savings', id, 'txs'),
            orderBy('createdAt', 'asc')
          )

          txUnsubsRef.current[id] = onSnapshot(txsQ, txSnap => {
            // Aquest callback s'executa CADA VEGADA que canvien les txs
            const txs = txSnap.docs.map(t => ({ id: t.id, ...t.data() }))
            const balance = txs.reduce((s, t) => s + (t.amount || 0), 0)

            // Actualitza l'estat del compte amb les txs noves
            if (accountsRef.current[id]) {
              accountsRef.current[id] = {
                ...accountsRef.current[id],
                txs,
                balance,
              }
              publish()
            }
          })
        }
      })

      publish()
    })

    return () => {
      unsubAccounts()
      Object.values(txUnsubsRef.current).forEach(fn => fn?.())
      txUnsubsRef.current = {}
      accountsRef.current = {}
    }
  }, [uid, publish])

  // ── Accions ─────────────────────────────────────────────────────────────────

  const addAccount = useCallback(async ({ name, rate, notes, initialBalance }) => {
    if (!uid) return
    const ref = await addDoc(collection(db, 'users', uid, 'savings'), {
      name,
      rate: rate || 0,
      notes: notes || '',
      createdAt: serverTimestamp(),
    })
    if (initialBalance > 0) {
      await addDoc(collection(db, 'users', uid, 'savings', ref.id, 'txs'), {
        amount: initialBalance,
        type: 'deposit',
        note: 'Saldo inicial',
        createdAt: serverTimestamp(),
      })
    }
  }, [uid])

  const removeAccount = useCallback(async (accountId) => {
    if (!uid) return
    // Elimina totes les txs primer (Firestore no fa cascade delete)
    const acc = accountsRef.current[accountId]
    if (acc?.txs?.length) {
      await Promise.all(
        acc.txs.map(tx =>
          deleteDoc(doc(db, 'users', uid, 'savings', accountId, 'txs', tx.id))
        )
      )
    }
    await deleteDoc(doc(db, 'users', uid, 'savings', accountId))
  }, [uid])

  const addTransaction = useCallback(async (accountId, { amount, type, note }) => {
    if (!uid) return
    const signed = type === 'withdraw' ? -Math.abs(amount) : Math.abs(amount)
    // Firestore escriu el document → el listener de txs es dispara → publish()
    await addDoc(collection(db, 'users', uid, 'savings', accountId, 'txs'), {
      amount: signed,
      type,
      note: note || '',
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeTransaction = useCallback(async (accountId, txId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'savings', accountId, 'txs', txId))
  }, [uid])

  return { accounts, addAccount, removeAccount, addTransaction, removeTransaction }
}