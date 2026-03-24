import { useState } from 'react'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'

const POPULAR = [
  { name: 'Bitcoin',   coinId: 'bitcoin',     symbol: 'BTC'  },
  { name: 'Ethereum',  coinId: 'ethereum',    symbol: 'ETH'  },
  { name: 'Solana',    coinId: 'solana',      symbol: 'SOL'  },
  { name: 'XRP',       coinId: 'ripple',      symbol: 'XRP'  },
  { name: 'Cardano',   coinId: 'cardano',     symbol: 'ADA'  },
  { name: 'Avalanche', coinId: 'avalanche-2', symbol: 'AVAX' },
  { name: 'Polkadot',  coinId: 'polkadot',    symbol: 'DOT'  },
  { name: 'Chainlink', coinId: 'chainlink',   symbol: 'LINK' },
]

const CRYPTO_COLORS = [
  { bg: 'rgba(255,160,60,0.10)',  color: 'rgba(255,170,70,0.85)'  },
  { bg: 'rgba(100,130,255,0.10)', color: 'rgba(120,150,255,0.85)' },
  { bg: 'rgba(80,200,120,0.10)',  color: 'rgba(80,210,120,0.85)'  },
  { bg: 'rgba(0,180,220,0.10)',   color: 'rgba(0,200,240,0.85)'   },
  { bg: 'rgba(180,120,255,0.10)', color: 'rgba(180,130,255,0.85)' },
  { bg: 'rgba(255,100,120,0.10)', color: 'rgba(255,110,130,0.85)' },
]
const getCryptoColor = (symbol) => {
  const map = { BTC: 0, ETH: 1, SOL: 2, XRP: 3, ADA: 4, AVAX: 5, DOT: 0, LINK: 1 }
  return CRYPTO_COLORS[map[symbol] ?? (symbol?.charCodeAt(0) % CRYPTO_COLORS.length)] || CRYPTO_COLORS[0]
}

// CSS pels botons: sempre visibles en mòbil, hover en desktop
const mobileActsCss = `
  .cr-acts { display: flex; gap: 3px; flex-shrink: 0; margin-left: 6px; }
  .cr-act-btn {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border: none; border-radius: 6px; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 100ms, color 100ms, transform 80ms;
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.35);
  }
  .cr-act-btn.del { color: rgba(220,70,55,0.55); }
  .cr-act-btn:active { transform: scale(0.88); }

  @media (hover: hover) and (pointer: fine) {
    .cr-acts { opacity: 0; transition: opacity 100ms; }
    .cr-row:hover .cr-acts { opacity: 1; }
    .cr-act-btn { background: transparent; color: rgba(255,255,255,0.22); }
    .cr-act-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.68); }
    .cr-act-btn.del { color: rgba(255,255,255,0.22); }
    .cr-act-btn.del:hover { background: rgba(200,40,30,0.10); color: rgba(220,70,55,0.80); }
  }
`

function Field({ label, children }) {
  return (
    <div>
      <label className="v2-field-label">{label}</label>
      {children}
    </div>
  )
}

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

export default function CryptoPage({ cryptos, onAdd, onRemove, onUpdate, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalValue = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
  const totalCost  = cryptos.reduce((s, c) => s + (c.initialValue || 0), 0)
  const totalPg    = totalValue - totalCost
  const pgPct      = totalCost > 0 ? (totalPg / totalCost) * 100 : 0
  const isPos      = totalPg >= 0

  return (
    <div style={{ fontFamily: "'Geist', sans-serif" }}>
      <style>{SHARED_STYLES + mobileActsCss}</style>

      {/* ConfirmDialog com a component normal */}
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="sec-v2-hdr">
        <div>
          <h2 className="sec-v2-title">Criptomonedes</h2>
          <p className="sec-v2-sub">
            <span style={{ fontFamily: "'Geist Mono', monospace" }}>{fmtEur(totalValue)}</span>
            {totalCost > 0 && (
              <span style={{ marginLeft: 6, color: isPos ? 'rgba(80,210,110,0.65)' : 'rgba(255,90,70,0.65)' }}>
                {isPos ? '▲' : '▼'} {fmtEur(Math.abs(totalPg))} {fmtPct(pgPct)}
              </span>
            )}
          </p>
        </div>
        <div className="sec-v2-btns">
          <button className="btn-v2-ico" onClick={onRefresh} title="Actualitzar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button className="btn-v2-primary" onClick={() => setShowModal(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Afegir
          </button>
        </div>
      </div>

      {cryptos.length === 0 ? (
        <div className="v2-empty">Cap criptomoneda registrada</div>
      ) : cryptos.map(c => {
        const val   = c.qty && c.currentPrice ? +(c.qty * c.currentPrice).toFixed(2) : c.initialValue || 0
        const pg    = val - (c.initialValue || 0)
        const pgPct = c.initialValue > 0 ? (pg / c.initialValue) * 100 : 0
        const pos   = pg >= 0
        const tc    = getCryptoColor(c.symbol)
        return (
          <div key={c.id} className="row-v2 cr-row">
            <div className="av-v2" style={{ background: tc.bg, color: tc.color }}>
              {c.symbol?.slice(0, 3) || c.name?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="row-v2-name">{c.name}</p>
              <div className="row-v2-meta">
                <span className="row-v2-badge" style={{ background: tc.bg, color: tc.color }}>{c.symbol}</span>
                {c.qty && <><span className="row-v2-dot">·</span><span className="row-v2-ticker">{c.qty} u.</span></>}
              </div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 14, minWidth: 64, flexShrink: 0, display: 'none' }}
              className="sm:block">
              {c.currentPrice
                ? <p className="row-v2-price">{fmtEur(c.currentPrice)}</p>
                : <span className="row-v2-price v2-pulse" style={{ letterSpacing: 2 }}>···</span>
              }
              <p className="row-v2-price-lbl">preu/u.</p>
            </div>
            <div style={{ textAlign: 'right', minWidth: 88, marginRight: 4, flexShrink: 0 }}>
              <p className="row-v2-val">{fmtEur(val)}</p>
              <p className={`row-v2-pg ${pos ? 'pos' : 'neg'}`}>
                {pos ? '+' : ''}{fmtEur(pg)} {fmtPct(pgPct)}
              </p>
            </div>
            <div className="cr-acts">
              <button className="cr-act-btn" title="Editar" onClick={() => setEditing(c)}>
                <EditIcon />
              </button>
              <button className="cr-act-btn del" title="Eliminar"
                onClick={() => askConfirm({ name: c.name, onConfirm: () => onRemove(c.id) })}>
                <TrashIcon />
              </button>
            </div>
          </div>
        )
      })}

      {showModal && (
        <AddCryptoModal
          onAdd={c => { onAdd(c); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
      {editing && (
        <EditCryptoModal
          crypto={editing}
          onSave={data => { onUpdate(editing.id, data); setEditing(null) }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function AddCryptoModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', symbol: '', coinId: '', qty: '', initialValue: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const selectPopular = (p) => setForm(f => ({ ...f, name: p.name, symbol: p.symbol, coinId: p.coinId }))

  return (
    <div className="v2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="v2-modal">
        <div className="v2-modal-hdr">
          <h3 className="v2-modal-title">Nova criptomoneda</h3>
          <button className="v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Populars</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {POPULAR.map(p => (
              <button key={p.coinId} onClick={() => selectPopular(p)} style={{
                padding: '7px 4px', borderRadius: 5, cursor: 'pointer', textAlign: 'center',
                fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 500,
                border: form.coinId === p.coinId ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.07)',
                background: form.coinId === p.coinId ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                color: form.coinId === p.coinId ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.34)',
                transition: 'all 100ms',
              }}>{p.symbol}</button>
            ))}
          </div>
        </div>
        <div className="v2-space">
          <div className="v2-grid2">
            <Field label="Nom"><input className="v2-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Bitcoin" /></Field>
            <Field label="Símbol"><input className="v2-input" style={{ fontFamily: "'Geist Mono', monospace" }} value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} placeholder="BTC" /></Field>
          </div>
          <Field label="CoinGecko ID"><input className="v2-input" style={{ fontFamily: "'Geist Mono', monospace" }} value={form.coinId} onChange={e => set('coinId', e.target.value)} placeholder="bitcoin" /></Field>
          <div className="v2-grid2">
            <Field label="Quantitat"><input type="number" step="any" className="v2-input mono" value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="0.5" /></Field>
            <Field label="Cost total (€)"><input type="number" step="any" className="v2-input mono" value={form.initialValue} onChange={e => set('initialValue', e.target.value)} placeholder="0.00" /></Field>
          </div>
        </div>
        <div className="v2-modal-footer">
          <button className="v2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="v2-btn-submit" onClick={() => onAdd({
            name: form.name.trim(), symbol: form.symbol.toUpperCase(),
            coinId: form.coinId.toLowerCase(), qty: parseFloat(form.qty) || 0,
            initialValue: parseFloat(form.initialValue) || 0, currentPrice: null,
          })}>Afegir</button>
        </div>
      </div>
    </div>
  )
}

function EditCryptoModal({ crypto, onSave, onClose }) {
  const [form, setForm] = useState({
    name: crypto.name || '', symbol: crypto.symbol || '',
    coinId: crypto.coinId || '', qty: crypto.qty || '', initialValue: crypto.initialValue || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="v2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="v2-modal">
        <div className="v2-modal-hdr">
          <h3 className="v2-modal-title">Editar {crypto.name}</h3>
          <button className="v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="v2-space">
          <div className="v2-grid2">
            <div><label className="v2-field-label">Nom</label><input className="v2-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="v2-field-label">Símbol</label><input className="v2-input" style={{ fontFamily: "'Geist Mono', monospace" }} value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} /></div>
          </div>
          <div><label className="v2-field-label">CoinGecko ID</label><input className="v2-input" style={{ fontFamily: "'Geist Mono', monospace" }} value={form.coinId} onChange={e => set('coinId', e.target.value)} /></div>
          <div className="v2-grid2">
            <div><label className="v2-field-label">Quantitat</label><input type="number" step="any" className="v2-input mono" value={form.qty} onChange={e => set('qty', e.target.value)} /></div>
            <div><label className="v2-field-label">Cost (€)</label><input type="number" step="any" className="v2-input mono" value={form.initialValue} onChange={e => set('initialValue', e.target.value)} /></div>
          </div>
        </div>
        <div className="v2-modal-footer">
          <button className="v2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="v2-btn-submit" onClick={() => onSave(form)}>Guardar</button>
        </div>
      </div>
    </div>
  )
}