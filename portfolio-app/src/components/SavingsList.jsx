import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const styles = `
  .sv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  /* ── Hero ── */
  .sv-hero {
    background: linear-gradient(135deg, #0f0f0f 0%, #141414 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 20px; margin-bottom: 12px;
    position: relative; overflow: hidden;
  }
  .sv-hero::before {
    content:''; position:absolute; top:-50px; right:-50px;
    width:200px; height:200px; border-radius:50%;
    background: radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%);
    pointer-events:none;
  }
  .sv-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .sv-hero-total { font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:12px; }
  .sv-hero-total span { font-size:30px; opacity:0.7; }
  .sv-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .sv-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; font-family:${FONTS.mono}; padding:4px 10px; border-radius:20px; color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .sv-hero-sub { font-size:11px; color:rgba(255,255,255,0.25); font-family:${FONTS.mono}; }

  /* ── Mètriques ── */
  .sv-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
  .sv-metric { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
  .sv-metric-label { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; }
  .sv-metric-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
  .sv-metric-val.g { color:${COLORS.neonGreen}; }
  .sv-metric-val.c { color:${COLORS.neonCyan}; }
  .sv-metric-sub { font-size:10px; font-family:${FONTS.mono}; color:rgba(255,255,255,0.25); }

  /* ── Accions ── */
  .sv-actions { display:flex; gap:6px; align-items:center; margin-bottom:14px; }
  .sv-btn-ico { width:30px; height:30px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .sv-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .sv-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:${COLORS.neonGreen}; color:#000; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; cursor:pointer; transition:opacity 100ms; white-space:nowrap; margin-left:auto; }
  .sv-btn-add:hover { opacity:0.85; }

  /* ── Secció ── */
  .sv-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .sv-section-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  /* ── Cards ── */
  .sv-cards { display:flex; flex-direction:column; gap:0; background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }
  .sv-card { border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 80ms; -webkit-tap-highlight-color:transparent; }
  .sv-card:last-child { border-bottom:none; }
  .sv-card:active { background:rgba(255,255,255,0.02); }

  .sv-card-main { display:flex; align-items:center; gap:12px; padding:14px; }
  .sv-av { width:36px; height:36px; border-radius:10px; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sv-card-info { flex:1; min-width:0; }
  .sv-card-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sv-card-meta { display:flex; align-items:center; gap:6px; }
  .sv-rate-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); padding:1px 6px; border-radius:3px; }
  .sv-card-notes { font-size:10px; color:rgba(255,255,255,0.25); }
  .sv-card-right { text-align:right; flex-shrink:0; }
  .sv-card-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .sv-card-int { font-size:11px; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; font-weight:500; }
  .sv-card-chevron { color:rgba(255,255,255,0.20); margin-left:6px; flex-shrink:0; transition:transform 200ms; }
  .sv-card-chevron.open { transform:rotate(180deg); }

  /* ── Expand ── */
  .sv-expand { border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.015); }
  .sv-expand-inner { padding:16px 14px; }
  .sv-expand-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .sv-expand-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:transparent; border:1px solid ${COLORS.border}; border-radius:5px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; white-space:nowrap; }

  /* ── Progress bar del saldo ── */
  .sv-progress { margin-bottom:14px; }
  .sv-progress-row { display:flex; justify-content:space-between; margin-bottom:5px; }
  .sv-progress-label { font-size:10px; color:rgba(255,255,255,0.30); font-family:${FONTS.mono}; }
  .sv-progress-track { height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
  .sv-progress-fill { height:100%; background:${COLORS.neonGreen}; border-radius:2px; transition:width 600ms; }

  /* ── Txs ── */
  .sv-tx-list { display:flex; flex-direction:column; }
  .sv-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .sv-tx:last-child { border-bottom:none; }
  .sv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:rgba(255,255,255,0.20); margin-left:8px; transition:all 80ms; }
  .sv-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* ── Empty ── */
  .sv-empty { padding:48px 0; text-align:center; }
  .sv-empty-main { font-size:14px; color:rgba(255,255,255,0.30); font-weight:500; margin-bottom:4px; }
  .sv-empty-sub { font-size:12px; color:rgba(255,255,255,0.15); }

  /* ── Modals ── */
  .sv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
  @media (min-width:640px) { .sv-overlay { align-items:center; padding:16px; } }
  .sv-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:12px 12px 0 0; width:100%; padding:20px 16px 100px; font-family:${FONTS.sans}; max-height:92dvh; overflow-y:auto; }
  @media (min-width:640px) { .sv-modal { border-radius:10px; max-width:400px; padding:24px 20px; } }
  .sv-modal-drag { width:36px; height:4px; border-radius:2px; background:${COLORS.border}; margin:0 auto 18px; display:block; }
  @media (min-width:640px) { .sv-modal-drag { display:none; } }
  .sv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .sv-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .sv-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .sv-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .sv-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .sv-inp:focus { border-color:${COLORS.neonGreen}; }
  .sv-inp::placeholder { color:${COLORS.textMuted}; }
  .sv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .sv-inp.big { font-size:22px; padding:12px 14px; letter-spacing:-0.5px; }
  .sv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .sv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .sv-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; }
  .sv-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; }
  .sv-btn-ok.def { background:#fff; color:#000; }
  .sv-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .sv-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .sv-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }
  .sv-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; margin-bottom:16px; }
  .sv-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; color:${COLORS.textMuted}; }
  .sv-type-tab.grn { background:rgba(0,255,136,0.10); color:${COLORS.neonGreen}; }
  .sv-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; }
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

const BankIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonGreen} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)

export default function SavingsList({ accounts, onAddAccount, onRemoveAccount, onAddTransaction, onRemoveTransaction }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalBalance  = accounts.reduce((s, a) => s + a.balance, 0)
  const totalInterest = accounts.reduce((s, a) => s + (a.rate && a.balance > 0 ? a.balance * a.rate / 100 : 0), 0)
  const avgRate       = accounts.filter(a => a.rate > 0).length > 0
    ? accounts.filter(a => a.rate > 0).reduce((s, a) => s + a.rate, 0) / accounts.filter(a => a.rate > 0).length
    : 0
  const maxBalance    = Math.max(...accounts.map(a => a.balance), 1)
  const sorted        = [...accounts].sort((a, b) => sortDir === 'desc' ? b.balance - a.balance : a.balance - b.balance)
  const toggle        = id => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const formatDate    = ts => !ts?.toDate ? '—' : ts.toDate().toLocaleDateString('ca-ES', { day:'2-digit', month:'short', year:'numeric' })

  return (
    <div className="sv">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      {/* ── Hero ── */}
      <div className="sv-hero">
        <p className="sv-hero-label">Estalvis totals</p>
        <p className="sv-hero-total">
          {fmtEur(totalBalance).replace('€', '')}<span>€</span>
        </p>
        <div className="sv-hero-row">
          {totalInterest > 0 && (
            <span className="sv-hero-badge">💰 +{fmtEur(totalInterest)}/any</span>
          )}
          <span className="sv-hero-sub">{accounts.length} compte{accounts.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Mètriques ── */}
      {accounts.length > 0 && (
        <div className="sv-metrics">
          <div className="sv-metric">
            <p className="sv-metric-label">Interès anual</p>
            <p className="sv-metric-val g">+{fmtEur(totalInterest)}</p>
            <p className="sv-metric-sub">estimat</p>
          </div>
          <div className="sv-metric">
            <p className="sv-metric-label">TAE mitjana</p>
            <p className="sv-metric-val c">{avgRate > 0 ? avgRate.toFixed(2) + '%' : '—'}</p>
            <p className="sv-metric-sub">dels comptes actius</p>
          </div>
          <div className="sv-metric">
            <p className="sv-metric-label">Comptes</p>
            <p className="sv-metric-val">{accounts.length}</p>
            <p className="sv-metric-sub">{accounts.filter(a => a.rate > 0).length} amb interès</p>
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
            <span className="sv-section-title">Comptes</span>
          </div>
          <div className="sv-cards">
            {sorted.map(acc => {
              const interest    = acc.rate > 0 && acc.balance > 0 ? acc.balance * acc.rate / 100 : 0
              const weightPct   = totalBalance > 0 ? (acc.balance / totalBalance) * 100 : 0

              return (
                <div key={acc.id} className="sv-card">
                  <div className="sv-card-main" onClick={() => toggle(acc.id)}>
                    <div className="sv-av"><BankIcon/></div>
                    <div className="sv-card-info">
                      <p className="sv-card-name">{acc.name}</p>
                      <div className="sv-card-meta">
                        {acc.rate > 0 && <span className="sv-rate-badge">{acc.rate}% TAE</span>}
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
                            { label:'↑ Ingrés',   color:COLORS.neonGreen, bg:'rgba(0,255,136,0.10)', border:'rgba(0,255,136,0.25)', type:'deposit' },
                            { label:'↓ Retirada', color:COLORS.neonAmber, bg:COLORS.bgAmber, border:COLORS.borderAmber, type:'withdraw' },
                          ].map(b => (
                            <button key={b.type} className="sv-expand-btn"
                              style={{ color: b.color }}
                              onClick={() => setTxModal({ accountId: acc.id, name: acc.name, type: b.type })}
                              onMouseOver={e=>{ e.currentTarget.style.background=b.bg; e.currentTarget.style.borderColor=b.border }}
                              onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
                            >{b.label}</button>
                          ))}
                          <button className="sv-expand-btn" style={{ color:COLORS.neonRed, marginLeft:'auto' }}
                            onClick={() => askConfirm({ name: acc.name, onConfirm: () => onRemoveAccount(acc.id) })}
                            onMouseOver={e=>{ e.currentTarget.style.background=COLORS.bgRed; e.currentTarget.style.borderColor=COLORS.borderRed }}
                            onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
                          >Eliminar</button>
                        </div>

                        {/* Historial de moviments */}
                        {acc.txs && acc.txs.length > 0 && (
                          <>
                            <p style={{ fontSize:9, fontWeight:500, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Moviments</p>
                            <div className="sv-tx-list" style={{ maxHeight:200, overflowY:'auto' }}>
                              {[...acc.txs].reverse().map(tx => (
                                <div key={tx.id} className="sv-tx">
                                  <div style={{ width:6, height:6, borderRadius:'50%', background:tx.amount>=0?COLORS.neonGreen:COLORS.neonAmber, flexShrink:0, marginRight:10 }}/>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <p style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.55)', margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tx.note||(tx.amount>=0?'Ingrés':'Retirada')}</p>
                                    <p style={{ fontSize:10, color:'rgba(255,255,255,0.25)', margin:0 }}>{formatDate(tx.createdAt)}</p>
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
        <div className="sv-modal-drag"/>
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">Nou compte d'estalvi</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Nom del compte</label>
            <input className="sv-inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ex: N26, BBVA Estalvi..."/>
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
    onAdd({ amount: v, type, note })
  }
  return (
    <div className="sv-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-drag"/>
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
            <input type="number" inputMode="decimal" step="any" className="sv-inp mono big" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/>
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