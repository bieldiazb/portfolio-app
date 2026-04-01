import { useState } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const styles = `
  .sv { font-family:${FONTS.sans}; }

  .sv-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; }
  .sv-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .sv-sub-row { display:flex; align-items:center; gap:8px; }
  .sv-sub-val { font-size:13px; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; font-variant-numeric:tabular-nums; }
  .sv-int-badge { font-size:11px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; padding:2px 7px; border-radius:3px; }

  .sv-hdr-btns { display:flex; gap:6px; align-items:center; flex-shrink:0; }
  .sv-btn-ico { width:28px; height:28px; background:transparent; border:1px solid ${COLORS.border}; border-radius:4px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; flex-shrink:0; }
  .sv-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .sv-btn-add { display:flex; align-items:center; gap:5px; padding:6px 12px; background:${COLORS.neonPurple}; color:#fff; border:none; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:opacity 100ms; white-space:nowrap; }
  .sv-btn-add:hover { opacity:0.85; }

  /* Desktop table */
  .sv-desktop { display:block; }
  .sv-mobile  { display:none; }
  @media (max-width:700px) {
    .sv-desktop { display:none; }
    .sv-mobile  { display:flex; flex-direction:column; }
  }

  .sv-table { width:100%; border-collapse:collapse; font-size:13px; }
  .sv-thead th { padding:8px 12px 10px; font-size:10px; font-weight:500; color:${COLORS.textMuted}; letter-spacing:0.10em; text-transform:uppercase; border-bottom:1px solid ${COLORS.border}; white-space:nowrap; }
  .sv-thead th:first-child { padding-left:0; text-align:left; }
  .sv-thead th:last-child { padding-right:0; }
  .sv-thead th:not(:first-child) { text-align:right; }

  .sv-row { border-bottom:1px solid ${COLORS.border}; cursor:pointer; transition:background 80ms; }
  .sv-row:last-child { border-bottom:none; }
  .sv-row:hover { background:${COLORS.elevated}; }
  .sv-row td { padding:12px 12px; vertical-align:middle; }
  .sv-row td:first-child { padding-left:0; }
  .sv-row td:last-child { padding-right:0; }

  .sv-asset { display:flex; align-items:center; gap:10px; }
  .sv-av { width:28px; height:28px; border-radius:50%; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sv-name { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; margin-bottom:2px; }
  .sv-notes { font-size:10px; color:${COLORS.textMuted}; }
  .sv-rate-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; padding:1px 6px; border-radius:2px; }
  .sv-num { text-align:right; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; font-weight:500; font-size:13px; font-variant-numeric:tabular-nums; }
  .sv-num.neg { color:${COLORS.neonRed}; }
  .sv-int-cell { text-align:right; font-family:${FONTS.mono}; font-size:12px; color:${COLORS.neonGreen}; }
  .sv-more-btn { background:transparent; border:none; color:${COLORS.textMuted}; cursor:pointer; font-size:16px; line-height:1; padding:0 2px; letter-spacing:2px; transition:color 100ms; }
  .sv-more-btn:hover { color:${COLORS.textPrimary}; }

  .sv-expanded-row > td { padding:0 !important; border-bottom:1px solid ${COLORS.border}; }

  /* Mobile cards */
  .sv-mcard { display:flex; align-items:center; padding:12px 0; border-bottom:1px solid ${COLORS.border}; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .sv-mcard:last-child { border-bottom:none; }

  .sv-empty { padding:56px 0; text-align:center; }
  .sv-empty-main { font-size:14px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .sv-empty-sub { font-size:12px; color:${COLORS.textMuted}; opacity:0.5; }

  .sv-tx { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .sv-tx:last-child { border-bottom:none; }
  .sv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:${COLORS.textMuted}; margin-left:8px; flex-shrink:0; transition:all 80ms; }
  .sv-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* Modal */
  .sv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
  .sv-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px; width:100%; max-width:400px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90vh; overflow-y:auto; }
  .sv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .sv-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .sv-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .sv-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .sv-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; }
  .sv-inp:focus { border-color:${COLORS.neonPurple}; }
  .sv-inp::placeholder { color:${COLORS.textMuted}; }
  .sv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .sv-inp.big { font-size:20px; padding:12px 14px; letter-spacing:-0.5px; }
  .sv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .sv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .sv-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .sv-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .sv-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 100ms; }
  .sv-btn-ok.def { background:#fff; color:#000; }
  .sv-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .sv-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .sv-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }
  .sv-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:5px; overflow:hidden; margin-bottom:16px; }
  .sv-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; color:${COLORS.textMuted}; }
  .sv-type-tab:hover { color:${COLORS.textPrimary}; background:${COLORS.elevated}; }
  .sv-type-tab.grn { background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; border-bottom:1px solid ${COLORS.borderGreen}; }
  .sv-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; border-bottom:1px solid ${COLORS.borderAmber}; }
`

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const SavIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonGreen} strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)

function ExpandedPanel({ acc, onOpenTx, onRemoveTx, onRemove, formatDate }) {
  const btns = [
    { label:'Ingrés',   color:COLORS.neonGreen, bg:COLORS.bgGreen, border:COLORS.borderGreen, type:'deposit' },
    { label:'Retirada', color:COLORS.neonAmber, bg:COLORS.bgAmber, border:COLORS.borderAmber, type:'withdraw' },
    { label:'Eliminar', color:COLORS.neonRed,   bg:COLORS.bgRed,   border:COLORS.borderRed,   type:'del', ml:'auto' },
  ]
  return (
    <div style={{ background:COLORS.elevated, borderTop:`1px solid ${COLORS.border}`, padding:'14px 5px', fontFamily:FONTS.sans }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {btns.map(b => (
          <button key={b.type} onClick={()=>b.type==='del'?onRemove():onOpenTx(b.type)}
            style={{ marginLeft:b.ml||0, display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', border:`1px solid ${COLORS.border}`, borderRadius:4, fontFamily:FONTS.sans, fontSize:12, fontWeight:500, cursor:'pointer', color:b.color, whiteSpace:'nowrap', transition:'all 100ms' }}
            onMouseOver={e=>{ e.currentTarget.style.background=b.bg; e.currentTarget.style.borderColor=b.border }}
            onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
          >{b.label}</button>
        ))}
      </div>
      <p style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, textTransform:'uppercase', letterSpacing:'0.10em', margin:'0 0 8px' }}>Moviments</p>
      <div style={{ maxHeight:200, overflowY:'auto' }}>
        {acc.txs.length===0 ? (
          <p style={{ textAlign:'center', fontSize:12, color:COLORS.textMuted, padding:'12px 0' }}>Cap moviment registrat</p>
        ) : [...acc.txs].reverse().map(tx => (
          <div key={tx.id} className="sv-tx">
            <div style={{ width:6, height:6, borderRadius:'50%', background:tx.amount>=0?COLORS.neonGreen:COLORS.neonAmber, flexShrink:0, marginRight:10 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:500, color:COLORS.textSecondary, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{tx.note||(tx.amount>=0?'Ingrés':'Retirada')}</p>
              <p style={{ fontSize:10, color:COLORS.textMuted, margin:0 }}>{formatDate(tx.createdAt)}</p>
            </div>
            <p style={{ fontSize:12, fontWeight:600, fontFamily:FONTS.mono, color:tx.amount>=0?COLORS.neonGreen:COLORS.neonAmber, flexShrink:0, marginLeft:10, fontVariantNumeric:'tabular-nums' }}>
              {tx.amount>=0?'+':''}{fmtEur(tx.amount)}
            </p>
            <button className="sv-tx-del" onClick={()=>onRemoveTx(tx.id)}><TrashIcon size={11}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SavingsList({ accounts, onAddAccount, onRemoveAccount, onAddTransaction, onRemoveTransaction }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalBalance  = accounts.reduce((s,a) => s+a.balance, 0)
  const totalInterest = accounts.reduce((s,a) => s+(a.rate&&a.balance>0?a.balance*a.rate/100:0), 0)
  const sorted = [...accounts].sort((a,b) => sortDir==='desc'?b.balance-a.balance:a.balance-b.balance)
  const toggle = id => setExpanded(e => ({ ...e, [id]:!e[id] }))
  const formatDate = ts => !ts?.toDate ? '—' : ts.toDate().toLocaleDateString('ca-ES',{day:'2-digit',month:'short',year:'numeric'})
  const openTx = (accountId,name,type) => setTxModal({accountId,name,type})

  return (
    <div className="sv">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="sv-hdr">
        <div>
          <h2 className="sv-title">Estalvis</h2>
          <div className="sv-sub-row">
            <span className="sv-sub-val">{fmtEur(totalBalance)}</span>
            {totalInterest>0 && <span className="sv-int-badge">+{fmtEur(totalInterest)}/any</span>}
          </div>
        </div>
        <div className="sv-hdr-btns">
          <button className="sv-btn-ico" onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          </button>
          <button className="sv-btn-add" onClick={()=>setShowNew(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nou compte
          </button>
        </div>
      </div>

      {accounts.length===0 ? (
        <div className="sv-empty"><p className="sv-empty-main">Cap compte registrat</p><p className="sv-empty-sub">Crea el teu primer compte d'estalvi</p></div>
      ) : (<>
        {/* Desktop */}
        <div className="sv-desktop">
          <table className="sv-table">
            <thead className="sv-thead">
              <tr><th>Compte</th><th>Saldo</th><th>TAE</th><th>Interès/any</th><th>Mov.</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map(acc => (<>
                <tr key={acc.id} className="sv-row" onClick={()=>toggle(acc.id)}>
                  <td>
                    <div className="sv-asset">
                      <div className="sv-av"><SavIcon/></div>
                      <div>
                        <p className="sv-name">{acc.name}</p>
                        {acc.notes && <p className="sv-notes">{acc.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className={`sv-num${acc.balance<0?' neg':''}`}>{fmtEur(acc.balance)}</td>
                  <td style={{textAlign:'right'}}>{acc.rate>0?<span className="sv-rate-badge">{acc.rate}%</span>:<span style={{fontSize:12,color:COLORS.textMuted}}>—</span>}</td>
                  <td className="sv-int-cell">{acc.rate>0&&acc.balance>0?'+'+fmtEur(acc.balance*acc.rate/100):'—'}</td>
                  <td style={{textAlign:'right',color:COLORS.textMuted,fontSize:12,fontFamily:FONTS.mono}}>{acc.txs.length}</td>
                  <td style={{textAlign:'right'}} onClick={e=>e.stopPropagation()}><button className="sv-more-btn">···</button></td>
                </tr>
                {expanded[acc.id] && (
                  <tr key={acc.id+'_exp'} className="sv-expanded-row">
                    <td colSpan={6}>
                      <ExpandedPanel acc={acc} onOpenTx={type=>openTx(acc.id,acc.name,type)} onRemoveTx={txId=>onRemoveTransaction(acc.id,txId)} onRemove={()=>askConfirm({name:acc.name,onConfirm:()=>onRemoveAccount(acc.id)})} formatDate={formatDate} />
                    </td>
                  </tr>
                )}
              </>))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sv-mobile">
          {sorted.map(acc => (
            <div key={acc.id}>
              <div className="sv-mcard" onClick={()=>toggle(acc.id)}>
                <div className="sv-av" style={{marginRight:12}}><SavIcon/></div>
                <div style={{flex:1,minWidth:0}}>
                  <p className="sv-name" style={{marginBottom:3}}>{acc.name}</p>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {acc.rate>0 && <span className="sv-rate-badge">{acc.rate}% TAE</span>}
                    <span style={{fontSize:10,color:COLORS.textMuted,fontFamily:FONTS.mono}}>{acc.txs.length} mov.</span>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                  <p style={{fontSize:13,fontWeight:500,fontFamily:FONTS.mono,color:COLORS.textPrimary,fontVariantNumeric:'tabular-nums',marginBottom:2}}>{fmtEur(acc.balance)}</p>
                  {acc.rate>0&&acc.balance>0 && <p style={{fontSize:11,fontFamily:FONTS.mono,color:COLORS.neonGreen}}>+{fmtEur(acc.balance*acc.rate/100)}/any</p>}
                </div>
                <svg style={{color:COLORS.textMuted,marginLeft:10,flexShrink:0,transition:'transform 200ms',transform:expanded[acc.id]?'rotate(180deg)':'none'}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {expanded[acc.id] && <ExpandedPanel acc={acc} onOpenTx={type=>openTx(acc.id,acc.name,type)} onRemoveTx={txId=>onRemoveTransaction(acc.id,txId)} onRemove={()=>askConfirm({name:acc.name,onConfirm:()=>onRemoveAccount(acc.id)})} formatDate={formatDate} />}
            </div>
          ))}
        </div>
      </>)}

      {showNew && <NewAccountModal onAdd={d=>{onAddAccount(d);setShowNew(false)}} onClose={()=>setShowNew(false)} />}
      {txModal && <TransactionModal accountName={txModal.name} defaultType={txModal.type} onAdd={tx=>{onAddTransaction(txModal.accountId,tx);setTxModal(null)}} onClose={()=>setTxModal(null)} />}
    </div>
  )
}

function NewAccountModal({ onAdd, onClose }) {
  const [form, setForm] = useState({name:'',rate:'',notes:'',initialBalance:''})
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const submit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    setError('')
    onAdd({name:form.name.trim(),rate:parseFloat(form.rate)||0,notes:form.notes.trim(),initialBalance:parseFloat(form.initialBalance)||0})
  }
  return (
    <div className="sv-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr"><h3 className="sv-modal-title">Nou compte d'estalvi</h3><button className="sv-modal-x" onClick={onClose}>×</button></div>
        <div className="sv-fgroup">
          <div><label className="sv-lbl">Nom del compte</label><input className="sv-inp" autoFocus value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ex: N26, BBVA Estalvi..." /></div>
          <div className="sv-grid2">
            <div><label className="sv-lbl">Saldo inicial (€)</label><input type="number" step="any" className="sv-inp mono" value={form.initialBalance} onChange={e=>set('initialBalance',e.target.value)} placeholder="0.00" /></div>
            <div><label className="sv-lbl">TAE (%)</label><input type="number" step="any" className="sv-inp mono" value={form.rate} onChange={e=>set('rate',e.target.value)} placeholder="0.00" /></div>
          </div>
          <div><label className="sv-lbl">Notes</label><input className="sv-inp" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="opcional" /></div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="sv-btn-ok def" onClick={submit}>Crear compte</button>
        </div>
      </div>
    </div>
  )
}

function TransactionModal({ accountName, defaultType, onAdd, onClose }) {
  const [type, setType]     = useState(defaultType||'deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [error, setError]   = useState('')
  const isDeposit = type==='deposit'
  const submit = () => {
    const v = parseFloat(amount)
    if (!v||v<=0) return setError('Introdueix un import vàlid')
    setError('')
    onAdd({amount:v,type,note})
  }
  return (
    <div className="sv-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr"><h3 className="sv-modal-title">{accountName}</h3><button className="sv-modal-x" onClick={onClose}>×</button></div>
        <div className="sv-type-row">
          <button className={`sv-type-tab${type==='deposit'?' grn':''}`} onClick={()=>setType('deposit')}>↑ Ingrés</button>
          <button className={`sv-type-tab${type==='withdraw'?' org':''}`} onClick={()=>setType('withdraw')}>↓ Retirada</button>
        </div>
        <div className="sv-fgroup">
          <div><label className="sv-lbl">Import (€)</label><input type="number" step="any" className="sv-inp mono big" autoFocus value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" /></div>
          <div><label className="sv-lbl">Descripció</label><input className="sv-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder={isDeposit?'ex: Nòmina...':'ex: Vacances...'} /></div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`sv-btn-ok ${isDeposit?'grn':'org'}`} onClick={submit}>{isDeposit?'+ Afegir ingrés':'− Registrar retirada'}</button>
        </div>
      </div>
    </div>
  )
}