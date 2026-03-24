import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import { doc, setDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore'

export function useNetWorthSnapshots(uid) {
  const [snapshots, setSnapshots] = useState([])

  useEffect(() => {
    if (!uid) return
    const load = async () => {
      try {
        const q = query(
          collection(db, 'users', uid, 'snapshots'),
          orderBy('date', 'desc'),
          limit(730)
        )
        const snap = await getDocs(q)
        setSnapshots(snap.docs.map(d => d.data()))
      } catch (e) {
        console.error('Error carregant snapshots:', e)
      }
    }
    load()
  }, [uid])

  const saveSnapshot = useCallback(async (total, invValue, savValue, cryptoValue) => {
    if (!uid || total <= 0) return
    const today = new Date().toISOString().split('T')[0]
    try {
      await setDoc(doc(db, 'users', uid, 'snapshots', today), {
        date: today, total, invValue, savValue, cryptoValue,
        updatedAt: new Date().toISOString(),
      })
      setSnapshots(prev => {
        const idx = prev.findIndex(s => s.date === today)
        const updated = { date: today, total, invValue, savValue, cryptoValue }
        if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n }
        return [updated, ...prev]
      })
    } catch (e) {
      console.error('Error desant snapshot:', e)
    }
  }, [uid])

  return { snapshots, saveSnapshot }
}