import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot,
  addDoc, deleteDoc, updateDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_INVESTMENTS = [
  { name: 'Flexible Cash Funds',          ticker: '', type: 'estalvi', initialValue: 1368, currentPrice: 1368, note: '1.81% APY' },
  { name: 'Instant Access Savings',       ticker: '', type: 'estalvi', initialValue: 2686, currentPrice: 2686, note: '1.5% NIR'  },
  { name: 'iShares Core MSCI World ETF',  ticker: 'EUNL.DE', type: 'etf', initialValue: 1092, currentPrice: null, qty: 9.79687392 },
  { name: 'Vanguard S&P 500 ETF',         ticker: 'VUAA.L',  type: 'etf', initialValue: 655,  currentPrice: null, qty: 5.80317623 },
  { name: 'iShares Emerging Markets ETF', ticker: 'EUNM.DE', type: 'etf', initialValue: 423,  currentPrice: null, qty: 8.99105658 },
  { name: 'Lockheed Martin',              ticker: 'LMT',     type: 'stock', initialValue: 327, currentPrice: null, qty: 0.6620485 },
  { name: 'Revolut Robo Advisor',         ticker: '', type: 'robo', initialValue: 220, currentPrice: 220, note: '6.5% esperat' },
]

export function useFirestorePortfolio(uid) {
  const [investments, setInvestments] = useState([])
  const [savings, setSavings]         = useState([])
  const [cryptos, setCryptos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [seeded, setSeeded]           = useState(false)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'investments'), orderBy('createdAt'))
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setInvestments(data)
      if (data.length === 0 && !seeded) {
        setSeeded(true)
        for (const inv of DEFAULT_INVESTMENTS) {
          await addDoc(collection(db, 'users', uid, 'investments'), { ...inv, createdAt: serverTimestamp() })
        }
      }
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

  const addInvestment    = async (inv) => addDoc(collection(db, 'users', uid, 'investments'), { ...inv, currentPrice: null, createdAt: serverTimestamp() })
  const removeInvestment = async (id)  => deleteDoc(doc(db, 'users', uid, 'investments', id))
  const updatePrice      = async (id, price) => updateDoc(doc(db, 'users', uid, 'investments', id), { currentPrice: price, lastUpdated: serverTimestamp() })
  const updateInvestment = async (id, data)  => updateDoc(doc(db, 'users', uid, 'investments', id), { ...data, lastUpdated: serverTimestamp() })

  const addSavings    = async (s)  => addDoc(collection(db, 'users', uid, 'savings'), { ...s, createdAt: serverTimestamp() })
  const removeSavings = async (id) => deleteDoc(doc(db, 'users', uid, 'savings', id))

  const addCrypto         = async (c)       => addDoc(collection(db, 'users', uid, 'cryptos'), { ...c, currentPrice: null, createdAt: serverTimestamp() })
  const removeCrypto      = async (id)      => deleteDoc(doc(db, 'users', uid, 'cryptos', id))
  const updateCrypto      = async (id, data) => updateDoc(doc(db, 'users', uid, 'cryptos', id), { ...data, lastUpdated: serverTimestamp() })
  const updateCryptoPrice = async (id, price) => updateDoc(doc(db, 'users', uid, 'cryptos', id), { currentPrice: price, lastUpdated: serverTimestamp() })

  return {
    investments, savings, cryptos, loading,
    addInvestment, removeInvestment, updatePrice, updateInvestment,
    addSavings, removeSavings,
    addCrypto, removeCrypto, updateCrypto, updateCryptoPrice,
  }
}