import { useState, useEffect } from 'react'

const NAV = [
  { id: 'investments', label: 'Inversions',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { id: 'savings',     label: 'Estalvis',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { id: 'crypto',      label: 'Crypto',      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 8h5a2 2 0 0 1 0 4H9v4h5a2 2 0 0 0 0-4"/><line x1="9" y1="12" x2="14" y2="12"/></svg> },
  { id: 'projections', label: 'Projeccions', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { id: 'chart',       label: 'Gràfics',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12V2z"/></svg> },
]

const bnStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .bn {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 40;
    background: hsl(0 0% 5%);
    border-top: 1px solid hsl(0 0% 11%);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    font-family: 'DM Sans', sans-serif;
  }

  /* Amaga en desktop amb CSS pur — no depèn de Tailwind */
  @media (min-width: 1024px) {
    .bn { display: none; }
  }

  .bn-inner {
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    height: 58px;
  }

  .bn-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    transition: color 150ms;
    color: hsl(0 0% 32%);
    font-family: 'DM Sans', sans-serif;
  }

  .bn-item.active { color: hsl(142 60% 50%); }
  .bn-item:active { opacity: 0.7; }

  .bn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 28px;
    border-radius: 8px;
    transition: background 150ms;
    position: relative;
  }

  .bn-item.active .bn-icon {
    background: hsl(142 60% 45% / 0.13);
  }

  .bn-item.active .bn-icon::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%; transform: translateX(-50%);
    width: 4px; height: 4px;
    border-radius: 50%;
    background: hsl(142 60% 50%);
  }

  .bn-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1;
  }

  .bn-item.active .bn-label {
    font-weight: 600;
    color: hsl(142 60% 50%);
  }
`

export default function BottomNav({ active, onChange }) {
  return (
    <>
      <style>{bnStyles}</style>
      {/* Sense lg:hidden — el CSS del @media s'encarrega d'ocultar-lo en desktop */}
      <nav className="bn">
        <div className="bn-inner">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`bn-item${active === item.id ? ' active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              <span className="bn-icon">{item.icon}</span>
              <span className="bn-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}