// hooks/useTheme.js
// Hook per gestionar el tema clar/fosc de Cartera.
// Persisteix a localStorage i respecta la preferència del sistema.

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'cartera-theme'

function getInitialTheme() {
  // 1. Preferència guardada
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  // 2. Preferència del sistema operatiu
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  // Actualitza el meta theme-color (barra del navegador en mòbil)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f5f5' : '#0a0a0a')
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    // SSR-safe: retorna 'dark' per defecte si no hi ha window
    if (typeof window === 'undefined') return 'dark'
    return getInitialTheme()
  })

  // Aplica el tema al DOM quan canvia
  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])

  // Escolta canvis de preferència del sistema (si l'usuari no ha triat)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!mq) return
    const handler = (e) => {
      // Només aplica si l'usuari no ha guardat cap preferència manual
      try {
        if (!localStorage.getItem(STORAGE_KEY)) {
          setThemeState(e.matches ? 'light' : 'dark')
        }
      } catch {}
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  const setTheme = useCallback((t) => {
    if (t === 'light' || t === 'dark') setThemeState(t)
  }, [])

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' }
}