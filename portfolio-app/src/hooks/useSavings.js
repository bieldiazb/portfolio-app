// ─── hooks/useSavings.js ──────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

export function useSavings(uid) {
  const accountsRef  = useRef({})
  const [accounts, setAccounts] = useState([])
  const txUnsubsRef  = useRef({})

  const publish = useCallback(() => {
    const list = Object.values(accountsRef.current)
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    setAccounts(list)
  }, [])

  useEffect(() => {
    if (!uid) return

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

      snap.docs.forEach(d => {
        const id   = d.id
        const meta = d.data()

        if (!accountsRef.current[id]) {
          accountsRef.current[id] = { id, ...meta, txs: [], balance: 0 }
        } else {
          // Actualitza metadades (nom, rate, notes) conservant txs i balance
          accountsRef.current[id] = {
            ...accountsRef.current[id],
            ...meta,
          }
        }

        // Listener de txs (una sola vegada per compte)
        if (!txUnsubsRef.current[id]) {
          const txsQ = query(
            collection(db, 'users', uid, 'savings', id, 'txs'),
            orderBy('createdAt', 'asc')
          )
          txUnsubsRef.current[id] = onSnapshot(txsQ, txSnap => {
            const txs     = txSnap.docs.map(t => ({ id: t.id, ...t.data() }))
            const balance = txs.reduce((s, t) => s + (t.amount || 0), 0)
            if (accountsRef.current[id]) {
              accountsRef.current[id] = { ...accountsRef.current[id], txs, balance }
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

  // ── Crear compte ─────────────────────────────────────────────────────────
  const addAccount = useCallback(async ({ name, rate, notes, initialBalance }) => {
    if (!uid) return
    const ref = await addDoc(collection(db, 'users', uid, 'savings'), {
      name,
      rate:  rate  || 0,
      notes: notes || '',
      createdAt: serverTimestamp(),
    })
    if (initialBalance > 0) {
      await addDoc(collection(db, 'users', uid, 'savings', ref.id, 'txs'), {
        amount: initialBalance,
        type:   'deposit',
        note:   'Saldo inicial',
        createdAt: serverTimestamp(),
      })
    }
  }, [uid])

  // ── Eliminar compte ───────────────────────────────────────────────────────
  const removeAccount = useCallback(async (accountId) => {
    if (!uid) return
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

  // ── Actualitzar qualsevol camp del compte (rate, name, notes...) ─────────
  const updateAccount = useCallback(async (accountId, changes) => {
    if (!uid || !accountId) return
    await updateDoc(doc(db, 'users', uid, 'savings', accountId), changes)
    // El listener d'onSnapshot s'encarregarà de re-publicar l'estat
  }, [uid])

  // ── Afegir transacció ─────────────────────────────────────────────────────
  const addTransaction = useCallback(async (accountId, { amount, type, note }) => {
    if (!uid) return
    const signed = type === 'withdraw' ? -Math.abs(amount) : Math.abs(amount)
    await addDoc(collection(db, 'users', uid, 'savings', accountId, 'txs'), {
      amount: signed,
      type,
      note:  note || '',
      createdAt: serverTimestamp(),
    })
  }, [uid])

  // ── Eliminar transacció ───────────────────────────────────────────────────
  const removeTransaction = useCallback(async (accountId, txId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'savings', accountId, 'txs', txId))
  }, [uid])

  return { accounts, addAccount, removeAccount, updateAccount, addTransaction, removeTransaction }
}