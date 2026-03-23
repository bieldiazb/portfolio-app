import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = not logged in

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  const login = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      console.error('Login error:', e)
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  return { user, login, logout, loading: user === undefined }
}
