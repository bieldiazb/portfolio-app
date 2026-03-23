import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot,
  addDoc, deleteDoc, updateDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_INVESTMENTS = [
  { name: 'Flexible Cash Funds',         ticker: '',        type: 'efectiu', initialValue: 1368, currentPrice: 1368, note: '1.81% APY' },
  { name: 'Instant Access Savings',      ticker: '',        type: 'estalvi', initialValue: 2686, currentPrice: 2686, note: '1.5% NIR'  },
  { name: 'iShares Core MSCI World ETF', ticker: 'IWDA.AS', type: 'etf',     initialValue: 1100, currentPrice: null },
  { name: 'Vanguard S&P 500 ETF',        ticker: 'VUSA.AS', type: 'etf',     initialValue: 651,  currentPrice: null },
  { name: 'iShares Emerging Markets ETF',ticker: 'EIMI.AS', type: 'etf',     initialValue: 438,  currentPrice: null },
  { name: 'Lockheed Martin',             ticker: 'LMT',     type: 'stock',   initialValue: 364,  currentPrice: null },
  { name: 'Revolut Robo Advisor',        ticker: '',        type: 'robo',    initialValue: 220,  currentPrice: 220,  note: '6.5% esperat' },
]

export function useFirestorePortfolio(uid) {
  const [investments, setInvestments] = useState([])
  const [savings, setSavings]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [seeded, setSeeded]           = useState(false)

  // Real-time listener for investments
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'investments'), orderBy('createdAt'))
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setInvestments(data)

      // Seed default investments on first load
      if (data.length === 0 && !seeded) {
        setSeeded(true)
        for (const inv of DEFAULT_INVESTMENTS) {
          await addDoc(collection(db, 'users', uid, 'investments'), {
            ...inv,
            createdAt: serverTimestamp(),
          })
        }
      }
      setLoading(false)
    })
    return unsub
  }, [uid])

  // Real-time listener for savings
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'savings'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snap) => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  const addInvestment = async (inv) => {
    await addDoc(collection(db, 'users', uid, 'investments'), {
      ...inv,
      currentPrice: null,
      createdAt: serverTimestamp(),
    })
  }

  const removeInvestment = async (id) => {
    await deleteDoc(doc(db, 'users', uid, 'investments', id))
  }

  const updatePrice = async (id, price) => {
    await updateDoc(doc(db, 'users', uid, 'investments', id), {
      currentPrice: price,
      lastUpdated: serverTimestamp(),
    })
  }

  const addSavings = async (s) => {
    await addDoc(collection(db, 'users', uid, 'savings'), {
      ...s,
      createdAt: serverTimestamp(),
    })
  }

  const removeSavings = async (id) => {
    await deleteDoc(doc(db, 'users', uid, 'savings', id))
  }

  return {
    investments, savings, loading,
    addInvestment, removeInvestment, updatePrice,
    addSavings, removeSavings,
  }
}
