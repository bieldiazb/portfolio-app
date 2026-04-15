// components/ThemeToggle.jsx
// Botó de canvi de tema — tres variants: icon, pill i compact

import { useTheme } from '../hooks/useTheme'
import { FONTS, COLORS } from './design-tokens'

// ── Icones inline ──────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

// ── Variant icona (petit, per a sidebar i mob-hdr) ─────────────────────────
export function ThemeToggleIcon({ style = {} }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Canviar a mode clar' : 'Canviar a mode fosc'}
      style={{
        width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        border: '1px solid var(--c-border)',
        borderRadius: 6,
        color: 'var(--c-text-secondary)',
        cursor: 'pointer',
        transition: 'all 120ms',
        flexShrink: 0,
        ...style,
      }}
      onMouseOver={e => {
        e.currentTarget.style.borderColor = 'var(--c-border-hi)'
        e.currentTarget.style.color       = 'var(--c-text-primary)'
        e.currentTarget.style.background  = 'var(--c-elevated)'
      }}
      onMouseOut={e => {
        e.currentTarget.style.borderColor = 'var(--c-border)'
        e.currentTarget.style.color       = 'var(--c-text-secondary)'
        e.currentTarget.style.background  = 'transparent'
      }}
    >
      {isDark ? <SunIcon/> : <MoonIcon/>}
    </button>
  )
}

// ── Variant pill (per a sidebar desktop, sota el logo) ─────────────────────
export function ThemeTogglePill({ collapsed = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Mode clar' : 'Mode fosc'}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 8,
        width: '100%',
        padding: collapsed ? '8px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: 'transparent',
        border: '1px solid var(--c-border)',
        borderRadius: 8,
        color: 'var(--c-text-muted)',
        fontFamily: FONTS.sans,
        fontSize: 12, fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 120ms',
      }}
      onMouseOver={e => {
        e.currentTarget.style.background   = 'var(--c-elevated)'
        e.currentTarget.style.borderColor  = 'var(--c-border-hi)'
        e.currentTarget.style.color        = 'var(--c-text-primary)'
      }}
      onMouseOut={e => {
        e.currentTarget.style.background   = 'transparent'
        e.currentTarget.style.borderColor  = 'var(--c-border)'
        e.currentTarget.style.color        = 'var(--c-text-muted)'
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>
        {isDark ? <SunIcon/> : <MoonIcon/>}
      </span>
      {!collapsed && (
        <span style={{ flex: 1, textAlign: 'left' }}>
          {isDark ? 'Mode clar' : 'Mode fosc'}
        </span>
      )}
    </button>
  )
}

// ── Default export = icon variant ─────────────────────────────────────────
export default ThemeToggleIcon