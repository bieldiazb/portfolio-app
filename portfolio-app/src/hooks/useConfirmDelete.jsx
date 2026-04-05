import { useState } from 'react'
import { COLORS, FONTS } from './../components/design-tokens'

const dialogStyles = `
  .cd-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.80);
    z-index: 200;
    display: flex; align-items: flex-end; justify-content: center;
    animation: cdFadeIn 150ms ease;
    backdrop-filter: blur(4px);
  }
  @media (min-width: 640px) {
    .cd-overlay { align-items: center; padding: 16px; }
  }
  @keyframes cdFadeIn { from { opacity:0 } to { opacity:1 } }

  .cd-box {
    font-family: ${FONTS.sans};
    background: #131313;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 14px 14px 0 0;
    width: 100%; padding: 20px 20px 36px;
    animation: cdSlide 200ms cubic-bezier(0.34,1.2,0.64,1);
    box-shadow: 0 -16px 48px rgba(0,0,0,0.60);
  }
  @media (min-width: 640px) {
    .cd-box { border-radius: 14px; max-width: 360px; padding: 24px 22px; }
  }
  @keyframes cdSlide {
    from { transform: translateY(20px); opacity:0 }
    to   { transform: translateY(0);    opacity:1 }
  }

  /* drag handle — mòbil */
  .cd-drag {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(255,255,255,0.10);
    margin: 0 auto 18px; display: block;
  }
  @media (min-width: 640px) { .cd-drag { display: none; } }

  .cd-icon {
    width: 42px; height: 42px; border-radius: 10px;
    background: rgba(255,59,59,0.10);
    border: 1px solid rgba(255,59,59,0.22);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }

  .cd-title {
    font-size: 15px; font-weight: 600;
    color: #fff;
    letter-spacing: -0.2px; margin-bottom: 7px;
  }
  .cd-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.40);
    line-height: 1.65; margin-bottom: 22px;
  }
  .cd-name {
    color: rgba(255,255,255,0.75);
    font-weight: 500;
  }

  .cd-btns { display:flex; gap:8px; }

  .cd-cancel {
    flex: 1; padding: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; border-radius: 8px;
    font-family: ${FONTS.sans}; font-size: 14px;
    color: rgba(255,255,255,0.50); cursor: pointer;
    transition: all 100ms; -webkit-tap-highlight-color: transparent;
  }
  .cd-cancel:hover { border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.80); }

  .cd-delete {
    flex: 1; padding: 12px; border: none;
    background: ${COLORS.neonRed}; border-radius: 8px;
    font-family: ${FONTS.sans}; font-size: 14px; font-weight: 600;
    color: #fff; cursor: pointer; transition: opacity 100ms;
    -webkit-tap-highlight-color: transparent;
  }
  .cd-delete:hover { opacity: 0.85; }
  .cd-delete:active { opacity: 0.75; transform: scale(0.98); }
`

export function ConfirmDialog({ state, onClose }) {
  if (!state) return null
  return (
    <>
      <style>{dialogStyles}</style>
      <div className="cd-overlay" onClick={onClose}>
        <div className="cd-box" onClick={e => e.stopPropagation()}>
          <div className="cd-drag"/>
          <div className="cd-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={COLORS.neonRed} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </div>
          <p className="cd-title">Eliminar element</p>
          <p className="cd-sub">
            Segur que vols eliminar <span className="cd-name">"{state.name}"</span>?
            Aquesta acció no es pot desfer.
          </p>
          <div className="cd-btns">
            <button className="cd-cancel" onClick={onClose}>Cancel·lar</button>
            <button className="cd-delete" onClick={() => { state.onConfirm(); onClose() }}>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function useConfirmDelete() {
  const [confirmState, setConfirmState] = useState(null)
  const askConfirm   = ({ name, onConfirm }) => setConfirmState({ name, onConfirm })
  const closeConfirm = () => setConfirmState(null)
  return { confirmState, askConfirm, closeConfirm }
}