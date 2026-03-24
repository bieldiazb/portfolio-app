import { useState } from 'react'

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
// Component separat — rep l'estat com a props, no el genera internament.
// Això garanteix que React el renderitzi correctament a l'arbre.

const dialogStyles = `
  .cd-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(5px);
    z-index: 200;
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: env(safe-area-inset-bottom);
    animation: cdFadeIn 150ms ease;
  }
  @keyframes cdFadeIn { from { opacity: 0 } to { opacity: 1 } }

  .cd-box {
    font-family: 'Geist', sans-serif;
    background: #111;
    border: 1px solid rgba(255,255,255,0.10);
    border-bottom: none;
    border-radius: 14px 14px 0 0;
    width: 100%;
    max-width: 440px;
    padding: 24px 20px 28px;
    animation: cdSlideUp 220ms cubic-bezier(0.32,0.72,0,1);
  }
  @keyframes cdSlideUp {
    from { transform: translateY(24px); opacity: 0 }
    to   { transform: translateY(0);    opacity: 1 }
  }

  .cd-icon {
    width: 42px; height: 42px; border-radius: 10px;
    background: rgba(220,50,40,0.10);
    border: 1px solid rgba(220,50,40,0.18);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }
  .cd-title {
    font-size: 16px; font-weight: 500;
    color: rgba(255,255,255,0.88);
    letter-spacing: -0.3px; margin-bottom: 6px;
  }
  .cd-sub {
    font-size: 13px; color: rgba(255,255,255,0.38);
    line-height: 1.55; margin-bottom: 22px;
  }
  .cd-name { color: rgba(255,255,255,0.65); font-weight: 500; }
  .cd-btns { display: flex; gap: 8px; }
  .cd-cancel {
    flex: 1; padding: 13px;
    border: 1px solid rgba(255,255,255,0.10);
    background: transparent; border-radius: 8px;
    font-family: 'Geist', sans-serif; font-size: 14px;
    color: rgba(255,255,255,0.42); cursor: pointer;
    transition: all 100ms; -webkit-tap-highlight-color: transparent;
  }
  .cd-cancel:active { background: rgba(255,255,255,0.05); }
  .cd-delete {
    flex: 1; padding: 13px; border: none;
    background: rgba(210,45,35,0.90); border-radius: 8px;
    font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 500;
    color: #fff; cursor: pointer; transition: background 100ms;
    -webkit-tap-highlight-color: transparent;
  }
  .cd-delete:active { background: rgba(210,45,35,1); }
`

export function ConfirmDialog({ state, onClose }) {
  if (!state) return null
  return (
    <>
      <style>{dialogStyles}</style>
      <div className="cd-overlay" onClick={onClose}>
        <div className="cd-box" onClick={e => e.stopPropagation()}>
          <div className="cd-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="rgba(220,60,50,0.90)" strokeWidth="2"
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

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Retorna { confirmState, askConfirm, closeConfirm }
// A cada component:
//   const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()
//   ...
//   <ConfirmDialog state={confirmState} onClose={closeConfirm} />
//   ...
//   onClick={() => askConfirm({ name: 'MSCI World', onConfirm: () => onRemove(id) })}

export function useConfirmDelete() {
  const [confirmState, setConfirmState] = useState(null)

  const askConfirm  = ({ name, onConfirm }) => setConfirmState({ name, onConfirm })
  const closeConfirm = () => setConfirmState(null)

  return { confirmState, askConfirm, closeConfirm }
}