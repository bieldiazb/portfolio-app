import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const DEFAULT_GOALS = { etf: 50, estalvi: 20, crypto: 20, robo: 10 }

export function useRebalancingGoals(uid) {
  const [goals, setGoals] = useState(DEFAULT_GOALS)

  useEffect(() => {
    if (!uid) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'settings', 'rebalancing'))
        if (snap.exists()) setGoals(snap.data().goals || DEFAULT_GOALS)
      } catch {}
    }
    load()
  }, [uid])

  const saveGoals = useCallback(async (newGoals) => {
    if (!uid) return
    setGoals(newGoals)
    try {
      await setDoc(doc(db, 'users', uid, 'settings', 'rebalancing'), { goals: newGoals })
    } catch {}
  }, [uid])

  return { goals, saveGoals }
}