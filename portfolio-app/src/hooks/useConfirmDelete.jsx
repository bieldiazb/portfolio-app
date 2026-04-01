import { useState } from 'react'
import { COLORS, FONTS} from './../components/design-tokens'

const dialogStyles = `
  .cd-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.80);
    z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: cdFadeIn 120ms ease;
  }
  @keyframes cdFadeIn { from { opacity:0 } to { opacity:1 } }

  .cd-box {
    font-family: ${FONTS.sans};
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 6px;
    width: 100%; max-width: 360px;
    padding: 22px 20px 20px;
    animation: cdPop 160ms cubic-bezier(0.34,1.4,0.64,1);
  }
  @keyframes cdPop {
    from { transform: scale(0.96); opacity:0 }
    to   { transform: scale(1);    opacity:1 }
  }

  .cd-icon {
    width: 36px; height: 36px; border-radius: 4px;
    background: ${COLORS.bgRed};
    border: 1px solid ${COLORS.borderRed};
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }

  .cd-title {
    font-size: 14px; font-weight: 600;
    color: ${COLORS.textPrimary};
    letter-spacing: -0.2px; margin-bottom: 6px;
  }
  .cd-sub {
    font-size: 12px;
    color: ${COLORS.textMuted};
    line-height: 1.6; margin-bottom: 20px;
  }
  .cd-name {
    color: ${COLORS.textSecondary};
    font-weight: 500;
    font-family: ${FONTS.mono};
  }

  .cd-btns { display:flex; gap:8px; }

  .cd-cancel {
    flex: 1; padding: 10px;
    border: 1px solid ${COLORS.border};
    background: transparent; border-radius: 4px;
    font-family: ${FONTS.sans}; font-size: 13px;
    color: ${COLORS.textSecondary}; cursor: pointer;
    transition: all 100ms; -webkit-tap-highlight-color: transparent;
  }
  .cd-cancel:hover { border-color: ${COLORS.borderHi}; color: ${COLORS.textPrimary}; }

  .cd-delete {
    flex: 1; padding: 10px; border: none;
    background: ${COLORS.neonRed}; border-radius: 4px;
    font-family: ${FONTS.sans}; font-size: 13px; font-weight: 600;
    color: #fff; cursor: pointer; transition: opacity 100ms;
    -webkit-tap-highlight-color: transparent;
  }
  .cd-delete:hover { opacity: 0.85; }
`

export function ConfirmDialog({ state, onClose }) {
  if (!state) return null
  return (
    <>
      <style>{dialogStyles}</style>
      <div className="cd-overlay" onClick={onClose}>
        <div className="cd-box" onClick={e => e.stopPropagation()}>
          <div className="cd-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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