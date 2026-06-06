import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, serverTimestamp,
} from 'firebase/firestore'

export function useGroups(uid) {
  const [groups, setGroups] = useState([])

  useEffect(() => {
    if (!uid) return
    return onSnapshot(collection(db, 'users', uid, 'groups'), snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [uid])

  const addGroup = useCallback(async ({ name, investmentIds = [] }) => {
    if (!uid) return
    return addDoc(collection(db, 'users', uid, 'groups'), {
      name,
      investmentIds,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeGroup = useCallback(async (groupId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'groups', groupId))
  }, [uid])

  const updateGroup = useCallback(async (groupId, changes) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'groups', groupId), changes)
  }, [uid])

  // Afegeix o treu una inversió d'un grup
  const toggleInvestment = useCallback(async (groupId, invId) => {
    if (!uid) return
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const ids = group.investmentIds || []
    const next = ids.includes(invId)
      ? ids.filter(id => id !== invId)
      : [...ids, invId]
    await updateDoc(doc(db, 'users', uid, 'groups', groupId), { investmentIds: next })
  }, [uid, groups])

  return { groups, addGroup, removeGroup, updateGroup, toggleInvestment }
}