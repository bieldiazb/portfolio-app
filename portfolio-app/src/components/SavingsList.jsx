import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const styles = `
  .sv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  /* ── Hero centrat ── */
  .sv-hero { text-align:center; padding:28px 20px 20px; }
  .sv-hero-label { font-size:11px; font-weight:400; color:var(--c-text-muted); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:8px; }
  .sv-hero-total { font-size:44px; font-weight:600; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; letter-spacing:-2px; margin-bottom:10px; }
  .sv-hero-total span { font-size:26px; opacity:0.4; font-weight:300; }
  .sv-hero-row { display:flex; align-items:center; justify-content:center; gap:8px; }
  .sv-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-green); }
  .sv-hero-sub { font-size:11px; color:var(--c-text-muted); }

  /* ── Divider ── */
  .sv-divider { height:1px; background:var(--c-border); margin:0 0 20px; }

  /* ── Stats fila ── */
  .sv-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; margin-bottom:24px; border:1px solid var(--c-border); border-radius:12px; overflow:hidden; }
  .sv-stat { padding:14px 12px; text-align:center; border-right:1px solid var(--c-border); }
  .sv-stat:last-child { border-right:none; }
  .sv-stat-label { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .sv-stat-val { font-size:14px; font-weight:600; font-family:${FONTS.mono}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; letter-spacing:-0.3px; }
  .sv-stat-val.g { color:var(--c-green); }
  .sv-stat-val.c { color:var(--c-cyan); }

  /* ── Accions ── */
  .sv-actions { display:flex; gap:6px; align-items:center; margin-bottom:20px; }
  .sv-btn-ico { width:32px; height:32px; background:transparent; border:1px solid var(--c-border); border-radius:8px; color:var(--c-text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .sv-btn-ico:hover { border-color:var(--c-border-hi); color:var(--c-text-secondary); }
  .sv-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:var(--c-green); color:#000; border:none; border-radius:8px; font-family:${FONTS.sans}; font-size:12px; font-weight:700; cursor:pointer; transition:opacity 100ms; white-space:nowrap; margin-left:auto; }
  .sv-btn-add:hover { opacity:0.85; }

  /* ── Secció ── */
  .sv-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .sv-section-title { font-size:11px; font-weight:600; color:var(--c-text-secondary); text-transform:uppercase; letter-spacing:0.12em; }

  /* ── Cards ── */
  .sv-cards { display:flex; flex-direction:column; background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; overflow:hidden; margin-bottom:12px; }
  .sv-card { border-bottom:1px solid var(--c-border); cursor:pointer; transition:background 80ms; -webkit-tap-highlight-color:transparent; }
  .sv-card:last-child { border-bottom:none; }
  .sv-card:hover { background:var(--c-elevated); }

  .sv-card-main { display:flex; align-items:center; gap:12px; padding:13px 14px; }
  .sv-dot { width:8px; height:8px; border-radius:50%; background:var(--c-green); flex-shrink:0; }
  .sv-dot.dim { background:var(--c-border-hi); }
  .sv-card-info { flex:1; min-width:0; }
  .sv-card-name { font-size:14px; font-weight:500; color:var(--c-text-primary); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sv-card-meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .sv-rate-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; color:var(--c-green); background:var(--c-bg-green); border:1px solid var(--c-border-green); padding:1px 6px; border-radius:3px; }
  .sv-card-notes { font-size:10px; color:var(--c-text-muted); }
  .sv-card-right { text-align:right; flex-shrink:0; }
  .sv-card-val { font-size:14px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .sv-card-int { font-size:11px; font-family:${FONTS.mono}; color:var(--c-green); font-weight:500; }
  .sv-card-chevron { color:var(--c-text-disabled); margin-left:6px; flex-shrink:0; transition:transform 200ms; }
  .sv-card-chevron.open { transform:rotate(180deg); }

  /* ── Expand ── */
  .sv-expand { border-top:1px solid var(--c-border); background:var(--c-elevated); }
  .sv-expand-inner { padding:16px 14px; }
  .sv-expand-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .sv-expand-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:transparent; border:1px solid var(--c-border); border-radius:8px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; white-space:nowrap; }

  /* ── TAE inline ── */
  .sv-tae-row { display:flex; align-items:center; gap:8px; padding:10px 0; margin-bottom:10px; border-bottom:1px solid var(--c-border); }
  .sv-tae-label { font-size:10px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; flex:1; }
  .sv-tae-display { display:flex; align-items:center; gap:6px; cursor:pointer; padding:4px 8px; border-radius:6px; transition:background 100ms; }
  .sv-tae-display:hover { background:var(--c-border); }
  .sv-tae-val { font-size:14px; font-weight:600; font-family:${FONTS.mono}; color:var(--c-green); }
  .sv-tae-val.zero { color:var(--c-text-muted); }
  .sv-tae-edit-icon { color:var(--c-text-disabled); }
  .sv-tae-edit { display:flex; align-items:center; gap:6px; }
  .sv-tae-inp { width:72px; background:var(--c-bg); border:1px solid var(--c-border-green); border-radius:6px; padding:6px 10px; font-family:${FONTS.mono}; font-size:14px; font-weight:600; color:var(--c-green); outline:none; text-align:right; -webkit-appearance:none; }
  .sv-tae-inp:focus { border-color:var(--c-green); }
  .sv-tae-unit { font-size:12px; color:var(--c-text-secondary); }
  .sv-tae-save { padding:5px 10px; background:var(--c-green); color:#000; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; }
  .sv-tae-cancel { padding:5px 10px; background:transparent; color:var(--c-text-muted); border:1px solid var(--c-border); border-radius:6px; font-family:${FONTS.sans}; font-size:11px; cursor:pointer; }

  /* ── Progress ── */
  .sv-progress { margin-bottom:14px; }
  .sv-progress-row { display:flex; justify-content:space-between; margin-bottom:5px; }
  .sv-progress-label { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .sv-progress-track { height:4px; background:var(--c-border); border-radius:2px; overflow:hidden; }
  .sv-progress-fill { height:100%; background:var(--c-green); border-radius:2px; transition:width 600ms; }

  /* ── Txs ── */
  .sv-tx-list { display:flex; flex-direction:column; }
  .sv-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid var(--c-border); }
  .sv-tx:last-child { border-bottom:none; }
  .sv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:var(--c-text-disabled); margin-left:8px; transition:all 80ms; }
  .sv-tx-del:hover { color:var(--c-red); background:var(--c-bg-red); }

  /* ── Empty ── */
  .sv-empty { padding:48px 0; text-align:center; }
  .sv-empty-main { font-size:14px; color:var(--c-text-muted); font-weight:500; margin-bottom:4px; }
  .sv-empty-sub { font-size:12px; color:var(--c-text-disabled); }

  /* ── Modals ── */
  .sv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); display:flex; align-items:center; justify-content:center; padding:16px; z-index:50; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); animation:svFadeIn 150ms ease; }
  @keyframes svFadeIn { from{opacity:0} to{opacity:1} }
  .sv-modal { background:var(--c-bg); border:1px solid var(--c-border); border-radius:14px; width:100%; max-width:400px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90dvh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.35); animation:svScaleIn 200ms cubic-bezier(0.32,1.1,0.60,1); }
  @keyframes svScaleIn { from{transform:scale(0.95) translateY(6px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  .sv-modal-drag { display:none; }
  .sv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .sv-modal-title { font-size:15px; font-weight:600; color:var(--c-text-primary); }
  .sv-modal-x { width:26px; height:26px; border-radius:6px; background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-secondary); font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .sv-lbl { display:block; font-size:10px; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .sv-inp { width:100%; background:var(--c-elevated); border:1px solid var(--c-border); border-radius:8px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:var(--c-text-primary); outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .sv-inp:focus { border-color:var(--c-border-green); }
  .sv-inp::placeholder { color:var(--c-text-disabled); }
  .sv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .sv-inp.big { font-size:22px; padding:12px 14px; letter-spacing:-0.5px; }
  .sv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .sv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .sv-btn-cancel { flex:1; padding:11px; border:1px solid var(--c-border); background:transparent; border-radius:8px; font-family:${FONTS.sans}; font-size:13px; color:var(--c-text-secondary); cursor:pointer; }
  .sv-btn-ok { flex:1; padding:11px; border:none; border-radius:8px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; }
  .sv-btn-ok.grn { background:var(--c-green); color:#000; }
  .sv-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .sv-error { font-size:12px; color:var(--c-red); background:var(--c-bg-red); border:1px solid var(--c-border-red); border-radius:8px; padding:9px 12px; }
  .sv-type-row { display:flex; gap:1px; background:var(--c-border); border-radius:8px; overflow:hidden; margin-bottom:16px; }
  .sv-type-tab { flex:1; padding:9px; border:none; background:var(--c-surface); font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; color:var(--c-text-muted); transition:all 100ms; }
  .sv-type-tab.grn { background:var(--c-bg-green); color:var(--c-green); }
  .sv-type-tab.org { background:var(--c-bg-amber); color:${COLORS.neonAmber}; }
`

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
)

const PencilIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const BankIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonGreen} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)

export default function SavingsList({ accounts, onAddAccount, onRemoveAccount, onAddTransaction, onRemoveTransaction, onUpdateAccount }) {
  const [showNew, setShowNew]       = useState(false)
  const [txModal, setTxModal]       = useState(null)
  const [expanded, setExpanded]     = useState({})
  const [sortDir, setSortDir]       = useState('desc')
  const [editingRate, setEditingRate] = useState({}) // { [accId]: string }
  const [editModal, setEditModal]     = useState(null)  // { acc } — modal edició complet
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalBalance  = accounts.reduce((s, a) => s + a.balance, 0)
  const totalInterest = accounts.reduce((s, a) => s + (a.rate && a.balance > 0 ? a.balance * a.rate / 100 : 0), 0)
  const avgRate       = accounts.filter(a => a.rate > 0).length > 0
    ? accounts.filter(a => a.rate > 0).reduce((s, a) => s + a.rate, 0) / accounts.filter(a => a.rate > 0).length
    : 0
  const sorted        = [...accounts].sort((a, b) => sortDir === 'desc' ? b.balance - a.balance : a.balance - b.balance)
  const toggle        = id => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const formatDate    = ts => !ts?.toDate ? '—' : ts.toDate().toLocaleDateString('ca-ES', { day:'2-digit', month:'short', year:'numeric' })

  // ── TAE inline edit helpers ──────────────────────────────────────────────
  const startEditRate  = (accId, currentRate) => {
    setEditingRate(prev => ({ ...prev, [accId]: String(currentRate || '') }))
  }
  const cancelEditRate = accId => {
    setEditingRate(prev => { const n = {...prev}; delete n[accId]; return n })
  }
  const saveRate = (acc) => {
    const val = parseFloat(String(editingRate[acc.id] || '').replace(',', '.'))
    if (!isNaN(val) && val >= 0 && onUpdateAccount) {
      onUpdateAccount(acc.id, { rate: val })
    }
    cancelEditRate(acc.id)
  }

  return (
    <div className="sv">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      {/* ── Hero centrat ── */}
      <div className="sv-hero">
        <p className="sv-hero-label">Estalvis totals</p>
        <p className="sv-hero-total">
          {fmtEur(totalBalance).replace('€', '')}<span>€</span>
        </p>
        <div className="sv-hero-row">
          {totalInterest > 0 && (
            <p className="sv-hero-badge">▲ +{fmtEur(totalInterest)}/any</p>
          )}
        </div>
      </div>

      <div className="sv-divider"/>

      {accounts.length > 0 && (
        <div className="sv-stats">
          <div className="sv-stat">
            <p className="sv-stat-label">Interès anual</p>
            <p className="sv-stat-val g">+{fmtEur(totalInterest)}</p>
          </div>
          <div className="sv-stat">
            <p className="sv-stat-label">TAE mitjana</p>
            <p className="sv-stat-val c">{avgRate > 0 ? avgRate.toFixed(2) + '%' : '—'}</p>
          </div>
          <div className="sv-stat">
            <p className="sv-stat-label">Comptes</p>
            <p className="sv-stat-val">{accounts.length}</p>
          </div>
        </div>
      )}

      {/* ── Accions ── */}
      <div className="sv-actions">
        <button className="sv-btn-ico" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} title="Ordenar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </button>
        <button className="sv-btn-add" onClick={() => setShowNew(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nou compte
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="sv-empty">
          <p className="sv-empty-main">Cap compte registrat</p>
          <p className="sv-empty-sub">Crea el teu primer compte d'estalvi</p>
        </div>
      ) : (
        <>
          <div className="sv-section-hdr">
            <span className="sv-section-title">Comptes · toca per gestionar</span>
          </div>
          <div className="sv-cards">
            {sorted.map(acc => {
              const interest  = acc.rate > 0 && acc.balance > 0 ? acc.balance * acc.rate / 100 : 0
              const weightPct = totalBalance > 0 ? (acc.balance / totalBalance) * 100 : 0
              const isEditingThisRate = editingRate[acc.id] !== undefined

              return (
                <div key={acc.id} className="sv-card">
                  <div className="sv-card-main" onClick={() => toggle(acc.id)}>
                    <div className={`sv-dot${(!acc.rate || acc.rate <= 0) ? ' dim' : ''}`}/>
                    <div className="sv-card-info">
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <p className="sv-card-name" style={{marginBottom:0}}>{acc.name}</p>
                      {acc.rate > 0 && <span className="sv-rate-badge">{acc.rate}% TAE</span>}
                    </div>
                    <div className="sv-card-meta" style={{marginTop:2}}>
                      {acc.notes && <span className="sv-card-notes">{acc.notes}</span>}
                      <span className="sv-card-notes">{acc.txs?.length || 0} mov.</span>
                    </div>
                    </div>
                    <div className="sv-card-right">
                      <p className="sv-card-val">{fmtEur(acc.balance)}</p>
                      {interest > 0 && <p className="sv-card-int">+{fmtEur(interest)}/any</p>}
                    </div>
                    <div className={`sv-card-chevron${expanded[acc.id] ? ' open' : ''}`}><ChevronDown/></div>
                  </div>

                  {expanded[acc.id] && (
                    <div className="sv-expand">
                      <div className="sv-expand-inner">

                        {/* ── Edició TAE inline ── */}
                        <div className="sv-tae-row">
                          <span className="sv-tae-label">Rendiment TAE</span>
                          {isEditingThisRate ? (
                            <div className="sv-tae-edit">
                              <input
                                type="number" inputMode="decimal" step="0.01" min="0" max="100"
                                className="sv-tae-inp"
                                value={editingRate[acc.id]}
                                onChange={e => setEditingRate(prev => ({...prev, [acc.id]: e.target.value}))}
                                onKeyDown={e => { if (e.key==='Enter') saveRate(acc); if (e.key==='Escape') cancelEditRate(acc.id) }}
                                autoFocus
                              />
                              <span className="sv-tae-unit">%</span>
                              <button className="sv-tae-save" onClick={() => saveRate(acc)}>Guardar</button>
                              <button className="sv-tae-cancel" onClick={() => cancelEditRate(acc.id)}>✕</button>
                            </div>
                          ) : (
                            <div className="sv-tae-display" onClick={e => { e.stopPropagation(); startEditRate(acc.id, acc.rate) }}>
                              <span className={`sv-tae-val${!acc.rate ? ' zero' : ''}`}>
                                {acc.rate > 0 ? `${acc.rate}%` : '0%'}
                              </span>
                              <span className="sv-tae-edit-icon"><PencilIcon/></span>
                            </div>
                          )}
                        </div>

                        {/* Barra de pes respecte al total */}
                        <div className="sv-progress">
                          <div className="sv-progress-row">
                            <span className="sv-progress-label">Pes en el total</span>
                            <span className="sv-progress-label">{weightPct.toFixed(1)}%</span>
                          </div>
                          <div className="sv-progress-track">
                            <div className="sv-progress-fill" style={{ width: `${weightPct}%` }}/>
                          </div>
                        </div>

                        {/* Botons */}
                        <div className="sv-expand-btns">
                          {[
                            { label:'↑ Ingrés',   color:COLORS.neonGreen, bg:'var(--c-bg-green)', border:'var(--c-border-green)', type:'deposit' },
                            { label:'↓ Retirada', color:COLORS.neonAmber, bg:'var(--c-bg-amber)', border:'var(--c-border-amber)', type:'withdraw' },
                          ].map(b => (
                            <button key={b.type} className="sv-expand-btn"
                              style={{ color: b.color }}
                              onClick={() => setTxModal({ accountId: acc.id, name: acc.name, type: b.type })}
                              onMouseOver={e=>{ e.currentTarget.style.background=b.bg; e.currentTarget.style.borderColor=b.border }}
                              onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--c-border)' }}
                            >{b.label}</button>
                          ))}
                          <button className="sv-expand-btn" style={{ color:'var(--c-text-secondary)' }}
                            onClick={e => { e.stopPropagation(); setEditModal({ acc }) }}
                            onMouseOver={e=>{ e.currentTarget.style.background='var(--c-elevated)'; e.currentTarget.style.borderColor='var(--c-border-hi)' }}
                            onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--c-border)' }}
                          >✏️ Editar</button>
                          <button className="sv-expand-btn" style={{ color:COLORS.neonRed, marginLeft:'auto' }}
                            onClick={() => askConfirm({ name: acc.name, onConfirm: () => onRemoveAccount(acc.id) })}
                            onMouseOver={e=>{ e.currentTarget.style.background='var(--c-bg-red)'; e.currentTarget.style.borderColor='var(--c-border-red)' }}
                            onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--c-border)' }}
                          >Eliminar</button>
                        </div>

                        {/* Historial de moviments */}
                        {acc.txs && acc.txs.length > 0 && (
                          <>
                            <p style={{ fontSize:9, fontWeight:500, color:'var(--c-text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Moviments</p>
                            <div className="sv-tx-list" style={{ maxHeight:200, overflowY:'auto' }}>
                              {[...acc.txs].reverse().map(tx => (
                                <div key={tx.id} className="sv-tx">
                                  <div style={{ width:6, height:6, borderRadius:'50%', background:tx.amount>=0?COLORS.neonGreen:COLORS.neonAmber, flexShrink:0, marginRight:10 }}/>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <p style={{ fontSize:12, fontWeight:500, color:'var(--c-text-secondary)', margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tx.note||(tx.amount>=0?'Ingrés':'Retirada')}</p>
                                    <p style={{ fontSize:10, color:'var(--c-text-muted)', margin:0 }}>{formatDate(tx.createdAt)}</p>
                                  </div>
                                  <p style={{ fontSize:12, fontWeight:600, fontFamily:FONTS.mono, color:tx.amount>=0?COLORS.neonGreen:COLORS.neonAmber, flexShrink:0, marginLeft:10, fontVariantNumeric:'tabular-nums' }}>
                                    {tx.amount>=0?'+':''}{fmtEur(tx.amount)}
                                  </p>
                                  <button className="sv-tx-del" onClick={() => onRemoveTransaction(acc.id, tx.id)}><TrashIcon size={11}/></button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ height: 16 }}/>

      {editModal && (
        <EditAccountModal
          acc={editModal.acc}
          onSave={changes => { onUpdateAccount(editModal.acc.id, changes); setEditModal(null) }}
          onClose={() => setEditModal(null)}
        />
      )}
      {showNew && <NewAccountModal onAdd={d => { onAddAccount(d); setShowNew(false) }} onClose={() => setShowNew(false)} />}
      {txModal && <TransactionModal accountName={txModal.name} defaultType={txModal.type} onAdd={tx => { onAddTransaction(txModal.accountId, tx); setTxModal(null) }} onClose={() => setTxModal(null)} />}
    </div>
  )
}

function NewAccountModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name:'', rate:'', notes:'', initialBalance:'' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    setError('')
    onAdd({ name:form.name.trim(), rate:parseFloat(form.rate)||0, notes:form.notes.trim(), initialBalance:parseFloat(form.initialBalance)||0 })
  }
  return (
    <div className="sv-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">Nou compte d'estalvi</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Nom del compte</label>
            <input className="sv-inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ex: N26, BBVA Estalvi..." autoFocus/>
          </div>
          <div className="sv-grid2">
            <div>
              <label className="sv-lbl">Saldo inicial (€)</label>
              <input type="number" step="any" inputMode="decimal" className="sv-inp mono" value={form.initialBalance} onChange={e=>set('initialBalance',e.target.value)} placeholder="0.00"/>
            </div>
            <div>
              <label className="sv-lbl">TAE (%)</label>
              <input type="number" step="any" inputMode="decimal" className="sv-inp mono" value={form.rate} onChange={e=>set('rate',e.target.value)} placeholder="0.00"/>
            </div>
          </div>
          <div>
            <label className="sv-lbl">Notes</label>
            <input className="sv-inp" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="opcional"/>
          </div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="sv-btn-ok grn" onClick={submit}>Crear compte</button>
        </div>
      </div>
    </div>
  )
}

// ── EditAccountModal — edita nom, TAE i notes d'un compte ────────────────────
function EditAccountModal({ acc, onSave, onClose }) {
  const [name,  setName]  = useState(acc.name  || '')
  const [rate,  setRate]  = useState(String(acc.rate  ?? ''))
  const [notes, setNotes] = useState(acc.notes || '')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) return setError('El nom és obligatori')
    const parsedRate = parseFloat(String(rate).replace(',', '.'))
    setError('')
    onSave({
      name:  name.trim(),
      rate:  isNaN(parsedRate) ? 0 : parsedRate,
      notes: notes.trim(),
    })
  }

  return (
    <div className="sv-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">Editar compte</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Nom del compte</label>
            <input
              className="sv-inp" value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: N26, BBVA Estalvi..."
              autoFocus
            />
          </div>
          <div className="sv-grid2">
            <div>
              <label className="sv-lbl">TAE (%)</label>
              <input
                type="number" step="0.01" min="0" max="100"
                inputMode="decimal"
                className="sv-inp mono"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="sv-lbl">Notes</label>
              <input
                className="sv-inp" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="opcional"
              />
            </div>
          </div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="sv-btn-ok grn" onClick={submit}>Guardar canvis</button>
        </div>
      </div>
    </div>
  )
}

function TransactionModal({ accountName, defaultType, onAdd, onClose }) {
  const [type, setType]     = useState(defaultType || 'deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [error, setError]   = useState('')
  const isDeposit = type === 'deposit'
  const submit = () => {
    const v = parseFloat(String(amount).replace(',', '.'))
    if (!v || v <= 0) return setError('Introdueix un import vàlid')
    setError('')
    onAdd({ amount: isDeposit ? v : -v, type, note })
  }
  return (
    <div className="sv-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">{accountName}</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-type-row">
          <button className={`sv-type-tab${type==='deposit'?' grn':''}`} onClick={() => setType('deposit')}>↑ Ingrés</button>
          <button className={`sv-type-tab${type==='withdraw'?' org':''}`} onClick={() => setType('withdraw')}>↓ Retirada</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Import (€)</label>
            <input type="number" inputMode="decimal" step="any" className="sv-inp mono big" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" autoFocus/>
          </div>
          <div>
            <label className="sv-lbl">Descripció</label>
            <input className="sv-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder={isDeposit?'ex: Nòmina...':'ex: Vacances...'}/>
          </div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`sv-btn-ok ${isDeposit?'grn':'org'}`} onClick={submit}>
            {isDeposit ? '+ Afegir ingrés' : '− Registrar retirada'}
          </button>
        </div>
      </div>
    </div>
  )
}