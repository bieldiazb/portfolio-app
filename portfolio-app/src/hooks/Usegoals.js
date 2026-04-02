// ─── hooks/useGoals.js ────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

export const GOAL_TYPES = {
  savings:  { label: 'Estalvi',        icon: '🎯', color: '#7b61ff' },
  passive:  { label: 'Renda passiva',  icon: '💸', color: '#00ff88' },
  asset:    { label: 'Per actiu',      icon: '📈', color: '#00d4ff' },
}

export function useGoals(uid) {
  const [goals, setGoals] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'goals'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [uid])

  const addGoal = useCallback(async (goal) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'goals'), {
      ...goal,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const updateGoal = useCallback(async (id, data) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'goals', id), data)
  }, [uid])

  const removeGoal = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'goals', id))
  }, [uid])

  return { goals, addGoal, updateGoal, removeGoal }
}