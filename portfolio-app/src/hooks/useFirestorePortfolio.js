import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot,
  addDoc, deleteDoc, updateDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

export function useFirestorePortfolio(uid) {
  const [investments, setInvestments] = useState([])
  const [savings, setSavings]         = useState([])
  const [cryptos, setCryptos]         = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'investments'), orderBy('createdAt'))
    const unsub = onSnapshot(q, snap => {
      setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [uid])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'savings'), orderBy('createdAt'))
    const unsub = onSnapshot(q, snap => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'cryptos'), orderBy('createdAt'))
    const unsub = onSnapshot(q, snap => {
      setCryptos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  const addInvestment    = async (inv)        => addDoc(collection(db, 'users', uid, 'investments'), { ...inv, currentPrice: null, createdAt: serverTimestamp() })
  const removeInvestment = async (id)         => deleteDoc(doc(db, 'users', uid, 'investments', id))
  const updatePrice      = async (id, price)  => updateDoc(doc(db, 'users', uid, 'investments', id), { currentPrice: price, lastUpdated: serverTimestamp() })
  const updateInvestment = async (id, data)   => updateDoc(doc(db, 'users', uid, 'investments', id), { ...data, lastUpdated: serverTimestamp() })

  const addSavings    = async (s)  => addDoc(collection(db, 'users', uid, 'savings'), { ...s, createdAt: serverTimestamp() })
  const removeSavings = async (id) => deleteDoc(doc(db, 'users', uid, 'savings', id))

  const addCrypto         = async (c)          => addDoc(collection(db, 'users', uid, 'cryptos'), { ...c, currentPrice: null, createdAt: serverTimestamp() })
  const removeCrypto      = async (id)         => deleteDoc(doc(db, 'users', uid, 'cryptos', id))
  const updateCrypto      = async (id, data)   => updateDoc(doc(db, 'users', uid, 'cryptos', id), { ...data, lastUpdated: serverTimestamp() })
  const updateCryptoPrice = async (id, price)  => updateDoc(doc(db, 'users', uid, 'cryptos', id), { currentPrice: price, lastUpdated: serverTimestamp() })

  return {
    investments, savings, cryptos, loading,
    addInvestment, removeInvestment, updatePrice, updateInvestment,
    addSavings, removeSavings,
    addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
  }
}