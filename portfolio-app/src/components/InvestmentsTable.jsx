import { useState } from 'react'
import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'
import AddInvestmentModal from './AddInvestmentModal'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'

const TYPE_COLORS = {
  etf:     { bg: 'rgba(60,130,255,0.10)',  color: 'rgba(100,160,255,0.85)' },
  stock:   { bg: 'rgba(80,200,120,0.10)',  color: 'rgba(80,210,120,0.85)'  },
  crypto:  { bg: 'rgba(255,160,60,0.10)',  color: 'rgba(255,170,70,0.85)'  },
  robo:    { bg: 'rgba(180,120,255,0.10)', color: 'rgba(180,130,255,0.85)' },
  estalvi: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' },
  efectiu: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' },
}
const TYPE_LABELS = {
  etf: 'ETF', stock: 'Acció', crypto: 'Crypto',
  robo: 'Robo', estalvi: 'Estalvi', efectiu: 'Efectiu',
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  .inv { font-family: 'Geist', sans-serif; }
  .inv-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .inv-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72); letter-spacing: -0.2px; }
  .inv-status { font-size: 11px; color: rgba(255,255,255,0.24); margin-top: 2px; }
  .inv-btns { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
  .btn-ico { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 5px; color: rgba(255,255,255,0.32); cursor: pointer; transition: all 100ms; flex-shrink: 0; }
  .btn-ico:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.60); }
  .btn-ico:disabled { opacity: 0.28; pointer-events: none; }
  .btn-primary { display: flex; align-items: center; gap: 4px; padding: 0 11px; height: 28px; background: rgba(255,255,255,0.92); color: #080808; border: none; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 100ms; white-space: nowrap; flex-shrink: 0; }
  .btn-primary:hover { background: #fff; }
  .inv-spin { display: inline-block; animation: invspin .7s linear infinite; }
  @keyframes invspin { to { transform: rotate(360deg); } }
  .inv-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }

  .inv-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: default; }
  .inv-row:last-child { border-bottom: none; }

  .inv-av { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0; margin-right: 10px; }
  .inv-info { flex: 1; min-width: 0; }
  .inv-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .inv-meta { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
  .inv-badge { font-size: 10px; font-weight: 500; padding: 1px 5px; border-radius: 3px; }
  .inv-ticker { font-size: 10px; color: rgba(255,255,255,0.24); font-family: 'Geist Mono', monospace; }
  .inv-dot { font-size: 9px; color: rgba(255,255,255,0.14); }

  .inv-pcol { text-align: right; margin-right: 14px; min-width: 68px; flex-shrink: 0; }
  @media (max-width: 480px) { .inv-pcol { display: none; } }
  .inv-pval { font-size: 11px; color: rgba(255,255,255,0.36); font-family: 'Geist Mono', monospace; }
  .inv-plbl { font-size: 10px; color: rgba(255,255,255,0.16); margin-top: 1px; }
  .inv-ppulse { color: rgba(255,255,255,0.18); animation: invpulse 1.4s ease-in-out infinite; font-size: 13px; letter-spacing: 2px; }
  @keyframes invpulse { 0%,100%{opacity:1} 50%{opacity:0.15} }

  .inv-vcol { text-align: right; min-width: 88px; flex-shrink: 0; }
  .inv-val { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.80); font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .inv-pg { font-size: 10px; font-family: 'Geist Mono', monospace; margin-top: 2px; }
  .inv-pg.pos { color: rgba(80,210,110,0.78); }
  .inv-pg.neg { color: rgba(255,90,70,0.78); }

  /* ── Botons acció ── */
  .inv-acts { display: flex; gap: 3px; flex-shrink: 0; margin-left: 6px; }
  .inv-act-btn {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 100ms, color 100ms, transform 80ms;
    /* Mòbil: sempre visible */
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.35);
  }
  .inv-act-btn.del { color: rgba(220,70,55,0.55); }
  .inv-act-btn:active { transform: scale(0.88); }

  /* Desktop: ocult fins hover fila */
  @media (hover: hover) and (pointer: fine) {
    .inv-acts { opacity: 0; transition: opacity 100ms; }
    .inv-row:hover .inv-acts { opacity: 1; }
    .inv-act-btn { background: transparent; color: rgba(255,255,255,0.22); }
    .inv-act-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.68); }
    .inv-act-btn.del { color: rgba(255,255,255,0.22); }
    .inv-act-btn.del:hover { background: rgba(200,40,30,0.10); color: rgba(220,70,55,0.80); }
  }
`

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

export default function InvestmentsTable({ investments, onAdd, onRemove, onUpdate, onRefresh, loading, status }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  return (
    <div className="inv">
      <style>{styles}</style>

      {/* ConfirmDialog com a component normal — sempre a l'arbre */}
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="inv-hdr">
        <div>
          <h2 className="inv-title">Posicions obertes</h2>
          <p className="inv-status">{status}</p>
        </div>
        <div className="inv-btns">
          <button className="btn-ico" onClick={onRefresh} disabled={loading} title="Actualitzar">
            <span className={loading ? 'inv-spin' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </span>
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Afegir
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="inv-empty">Cap inversió registrada</div>
      ) : investments.map(inv => (
        <div key={inv.id} className="inv-row">
          {(() => {
            const val   = getEffectiveValue(inv)
            const pg    = val - (inv.initialValue || 0)
            const pgPct = (inv.initialValue || 0) > 0 ? (pg / inv.initialValue) * 100 : 0
            const isPos = pg >= 0
            const tc    = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
            const hasLive = inv.ticker && !['efectiu', 'estalvi', 'robo'].includes(inv.type)
            return (
              <>
                <div className="inv-av" style={{ background: tc.bg, color: tc.color }}>
                  {inv.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="inv-info">
                  <p className="inv-name">{inv.name}</p>
                  <div className="inv-meta">
                    <span className="inv-badge" style={{ background: tc.bg, color: tc.color }}>
                      {TYPE_LABELS[inv.type] || inv.type}
                    </span>
                    {inv.ticker && <><span className="inv-dot">·</span><span className="inv-ticker">{inv.ticker}</span></>}
                    {inv.qty    && <><span className="inv-dot">·</span><span className="inv-ticker">{inv.qty} u.</span></>}
                  </div>
                </div>
                <div className="inv-pcol">
                  {hasLive
                    ? inv.currentPrice !== null
                      ? <p className="inv-pval">{fmtEur(inv.currentPrice)}</p>
                      : <span className="inv-ppulse">···</span>
                    : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)' }}>—</span>
                  }
                  <p className="inv-plbl">preu/u.</p>
                </div>
                <div className="inv-vcol">
                  <p className="inv-val">{fmtEur(val)}</p>
                  <p className={`inv-pg ${isPos ? 'pos' : 'neg'}`}>
                    {isPos ? '+' : ''}{fmtEur(pg)} {fmtPct(pgPct)}
                  </p>
                </div>
                <div className="inv-acts">
                  <button className="inv-act-btn" title="Editar"
                    onClick={() => setEditing(inv)}>
                    <EditIcon />
                  </button>
                  <button className="inv-act-btn del" title="Eliminar"
                    onClick={() => askConfirm({ name: inv.name, onConfirm: () => onRemove(inv.id) })}>
                    <TrashIcon />
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      ))}

      {showModal && (
        <AddInvestmentModal
          onAdd={inv => { onAdd(inv); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
      {editing && (
        <EditInvestmentModal
          inv={editing}
          onSave={data => { onUpdate(editing.id, data); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ── EditInvestmentModal ──────────────────────────────────────────────────────
const inp = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '9px 11px', fontFamily: "'Geist', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.82)', outline: 'none' }
const lbl = { display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }

function EditInvestmentModal({ inv, onSave, onClose }) {
  const [form, setForm] = useState({
    name: inv.name || '', ticker: inv.ticker || '', type: inv.type || 'etf',
    qty: inv.qty ?? '', initialValue: inv.initialValue ?? '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hasQty = !['efectiu', 'estalvi', 'robo'].includes(form.type)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px 12px 0 0', width: '100%', maxWidth: 420, padding: 22, maxHeight: '92vh', overflowY: 'auto', fontFamily: "'Geist', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.3px' }}>Editar posició</h3>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.40)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div><label style={lbl}>Tipus</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="etf">ETF</option><option value="stock">Acció</option>
              <option value="efectiu">Efectiu</option><option value="estalvi">Estalvi</option>
              <option value="robo">Robo Advisor</option>
            </select>
          </div>
          <div><label style={lbl}>Nom</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} /></div>
          {hasQty && <div><label style={lbl}>Ticker Yahoo Finance</label><input style={{ ...inp, fontFamily: "'Geist Mono', monospace" }} value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} /></div>}
          <div style={{ display: 'grid', gridTemplateColumns: hasQty ? '1fr 1fr' : '1fr', gap: 10 }}>
            {hasQty && <div><label style={lbl}>Quantitat</label><input type="number" step="any" style={{ ...inp, textAlign: 'right', fontFamily: "'Geist Mono', monospace" }} value={form.qty} onChange={e => set('qty', e.target.value)} /></div>}
            <div><label style={lbl}>Cost total (€)</label><input type="number" step="any" style={{ ...inp, textAlign: 'right', fontFamily: "'Geist Mono', monospace" }} value={form.initialValue} onChange={e => set('initialValue', e.target.value)} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', borderRadius: 6, fontFamily: "'Geist', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.36)', cursor: 'pointer' }}>Cancel·lar</button>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: 11, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 6, fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 500, color: '#080808', cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}