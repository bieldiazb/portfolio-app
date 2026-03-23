import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'

const ALLOWED_EMAIL = 'bieldiazbasullas@gmail.com'

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && u.email !== ALLOWED_EMAIL) {
        // Usuari no autoritzat — tanquem sessió immediatament
        await signOut(auth)
        setError('Accés no autoritzat.')
        setUser(null)
      } else {
        setError(null)
        setUser(u)
      }
    })
    return unsub
  }, [])

  const login = async () => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, provider)
      if (result.user.email !== ALLOWED_EMAIL) {
        await signOut(auth)
        setError('Accés no autoritzat.')
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Error en iniciar sessió.')
      }
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  return { user, login, logout, error, loading: user === undefined }
}
