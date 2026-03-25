import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from '../firebase'

// ── Afegeix aquí tots els correus autoritzats ──────────────────────────────────
const ALLOWED_EMAILS = new Set([
  'bieldiazbasullas@gmail.com',
  'info.liamoore@gmail.com',
  'bielsalashurdless@gmail.com',
])

const isAllowed = (email) => ALLOWED_EMAILS.has(email)

export function useAuth() {
  const [user, setUser]   = useState(undefined)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && !isAllowed(u.email)) {
        await signOut(auth)
        setError('Accés no autoritzat.')
        setUser(null)
      } else {
        setError(null)
        setUser(u ?? null)
      }
    })
    return unsub
  }, [])

  const login = async () => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, provider)
      if (!isAllowed(result.user.email)) {
        await signOut(auth)
        setError('Accés no autoritzat.')
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Error en iniciar sessió.')
      }
    }
  }

  const logout = () => signOut(auth)

  return { user, login, logout, error, loading: user === undefined }
}