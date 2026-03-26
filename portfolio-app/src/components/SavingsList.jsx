import { useState, useEffect } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, getDocs,
} from 'firebase/firestore'

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Firestore:
//   users/{uid}/savings/{id}           → { name, rate, notes, createdAt }
//   users/{uid}/savings/{id}/txs/{id}  → { amount, type, note, createdAt }
// El balance = suma de txs (positiu = ingrés, negatiu = retirada)

export function useSavings(uid) {
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'savings'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, async snap => {
      const accs = await Promise.all(snap.docs.map(async d => {
        const txSnap = await getDocs(
          query(collection(db, 'users', uid, 'savings', d.id, 'txs'), orderBy('createdAt', 'asc'))
        )
        const txs = txSnap.docs.map(t => ({ id: t.id, ...t.data() }))
        const balance = txs.reduce((s, t) => s + (t.amount || 0), 0)
        return { id: d.id, ...d.data(), txs, balance }
      }))
      setAccounts(accs)
    })
    return unsub
  }, [uid])

  const addAccount = async ({ name, rate, notes, initialBalance }) => {
    if (!uid) return
    const ref = await addDoc(collection(db, 'users', uid, 'savings'), {
      name, rate: rate || 0, notes: notes || '', createdAt: serverTimestamp(),
    })
    if (initialBalance > 0) {
      await addDoc(collection(db, 'users', uid, 'savings', ref.id, 'txs'), {
        amount: initialBalance, type: 'deposit', note: 'Saldo inicial', createdAt: serverTimestamp(),
      })
    }
  }

  const removeAccount = async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'savings', id))
  }

  const addTransaction = async (accountId, { amount, type, note }) => {
    if (!uid) return
    const signed = type === 'withdraw' ? -Math.abs(amount) : Math.abs(amount)
    await addDoc(collection(db, 'users', uid, 'savings', accountId, 'txs'), {
      amount: signed, type, note: note || '', createdAt: serverTimestamp(),
    })
  }

  const removeTransaction = async (accountId, txId) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'savings', accountId, 'txs', txId))
  }

  return { accounts, addAccount, removeAccount, addTransaction, removeTransaction }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  .sv { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 12px; }

  .sv-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
  .sv-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72); letter-spacing: -0.2px; }
  .sv-sub { font-size: 11px; color: rgba(255,255,255,0.26); margin-top: 3px; font-family: 'Geist Mono', monospace; letter-spacing: -0.2px; }
  .sv-btn-add { display: flex; align-items: center; gap: 4px; padding: 0 11px; height: 28px; background: rgba(255,255,255,0.92); color: #080808; border: none; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 100ms; white-space: nowrap; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .sv-btn-add:hover { background: #fff; }

  /* Card */
  .sv-card { border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; background: rgba(255,255,255,0.015); overflow: hidden; }

  .sv-card-hdr { display: flex; align-items: center; padding: 12px 14px; cursor: pointer; -webkit-tap-highlight-color: transparent; gap: 0; }
  .sv-card-hdr:active { background: rgba(255,255,255,0.03); }
  @media (hover: hover) { .sv-card-hdr:hover { background: rgba(255,255,255,0.025); } }

  .sv-card-ic { width: 30px; height: 30px; border-radius: 6px; background: rgba(80,200,110,0.10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px; }
  .sv-card-info { flex: 1; min-width: 0; }
  .sv-card-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.80); }
  .sv-card-meta { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; }

  .sv-card-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .sv-card-bal { text-align: right; }
  .sv-card-bal-v { font-size: 14px; font-weight: 500; font-family: 'Geist Mono', monospace; letter-spacing: -0.4px; color: rgba(255,255,255,0.82); }
  .sv-card-bal-v.neg { color: rgba(255,90,70,0.80); }
  .sv-card-ann { font-size: 10px; color: rgba(80,210,110,0.60); font-family: 'Geist Mono', monospace; margin-top: 1px; }

  /* Del button — always visible on mobile */
  .sv-del-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 5px; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: all 80ms; background: rgba(255,255,255,0.05); color: rgba(220,70,55,0.55); flex-shrink: 0; }
  .sv-del-btn:active { transform: scale(0.88); }
  @media (hover: hover) and (pointer: fine) {
    .sv-del-btn { background: transparent; color: rgba(255,255,255,0.18); }
    .sv-del-btn:hover { background: rgba(200,40,30,0.10); color: rgba(220,70,55,0.80); }
  }

  .sv-chevron { color: rgba(255,255,255,0.18); transition: transform 220ms; flex-shrink: 0; margin-left: 4px; }
  .sv-chevron.open { transform: rotate(180deg); }

  /* Expanded */
  .sv-body { border-top: 1px solid rgba(255,255,255,0.06); }

  .sv-quick { display: flex; gap: 6px; padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .sv-q-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: transparent; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 100ms; -webkit-tap-highlight-color: transparent; }
  .sv-q-btn.dep { color: rgba(80,210,110,0.80); }
  .sv-q-btn.dep:hover { background: rgba(80,210,110,0.07); border-color: rgba(80,210,110,0.22); }
  .sv-q-btn.wit { color: rgba(255,160,50,0.80); }
  .sv-q-btn.wit:hover { background: rgba(255,160,50,0.07); border-color: rgba(255,160,50,0.22); }
  .sv-q-btn:active { transform: scale(0.97); }

  /* Transactions */
  .sv-txs { max-height: 240px; overflow-y: auto; }
  .sv-tx { display: flex; align-items: center; padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .sv-tx:last-child { border-bottom: none; }
  .sv-tx-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-right: 10px; }
  .sv-tx-info { flex: 1; min-width: 0; }
  .sv-tx-note { font-size: 12px; color: rgba(255,255,255,0.62); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sv-tx-date { font-size: 10px; color: rgba(255,255,255,0.22); margin-top: 1px; }
  .sv-tx-amt { font-size: 12px; font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; flex-shrink: 0; margin-left: 8px; }
  .sv-tx-amt.pos { color: rgba(80,210,110,0.80); }
  .sv-tx-amt.neg { color: rgba(255,130,60,0.80); }
  .sv-tx-del { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 4px; cursor: pointer; color: rgba(255,255,255,0.14); transition: all 80ms; flex-shrink: 0; margin-left: 4px; -webkit-tap-highlight-color: transparent; }
  .sv-tx-del:hover { color: rgba(220,70,55,0.70); background: rgba(200,40,30,0.08); }
  .sv-tx-del:active { transform: scale(0.88); }

  .sv-empty-txs { padding: 18px 14px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.20); }

  .sv-sort-btn { display: flex; align-items: center; gap: 3px; padding: 0 7px; height: 24px; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 4px; font-family: 'Geist', sans-serif; font-size: 10px; color: rgba(255,255,255,0.32); cursor: pointer; transition: all 100ms; white-space: nowrap; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .sv-sort-btn:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.58); }
  .sv-sort-btn.on { border-color: rgba(255,255,255,0.16); color: rgba(255,255,255,0.62); }
  .sv-sort-arrow { display: inline-block; transition: transform 150ms; font-style: normal; }
  .sv-sort-arrow.asc { transform: rotate(180deg); }
  .sv-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
  .sv-empty-sub { font-size: 10px; color: rgba(255,255,255,0.14); margin-top: 4px; }

  /* Modals */
  .sv-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(5px); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
  .sv-modal { background: #111; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px 14px 0 0; width: 100%; max-width: 440px; padding: 22px 20px 30px; font-family: 'Geist', sans-serif; }
  .sv-modal-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .sv-modal-title { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .sv-modal-x { width: 26px; height: 26px; border-radius: 5px; background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.40); font-size: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-family: inherit; }
  .sv-lbl { display: block; font-size: 10px; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
  .sv-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.82); outline: none; box-sizing: border-box; transition: border-color 100ms; }
  .sv-inp:focus { border-color: rgba(255,255,255,0.20); }
  .sv-inp::placeholder { color: rgba(255,255,255,0.18); }
  .sv-inp.mono { font-family: 'Geist Mono', monospace; text-align: right; }
  .sv-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .sv-fgroup { display: flex; flex-direction: column; gap: 11px; }
  .sv-mfooter { display: flex; gap: 8px; margin-top: 18px; }
  .sv-btn-cancel { flex: 1; padding: 11px; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.36); cursor: pointer; }
  .sv-btn-ok { flex: 1; padding: 11px; border: none; border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; color: #080808; cursor: pointer; }
  .sv-btn-ok.def { background: rgba(255,255,255,0.92); color: #080808; }
  .sv-btn-ok.grn { background: rgba(60,200,100,0.85); }
  .sv-btn-ok.org { background: rgba(245,160,50,0.85); }
  .sv-error { font-size: 12px; color: rgba(255,80,60,0.80); background: rgba(255,50,30,0.08); border: 1px solid rgba(255,50,30,0.14); border-radius: 5px; padding: 8px 11px; }

  .sv-type-row { display: flex; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
  .sv-type-tab { flex: 1; padding: 9px; border: none; background: transparent; font-family: 'Geist', sans-serif; font-size: 13px; cursor: pointer; transition: all 100ms; color: rgba(255,255,255,0.34); }
  .sv-type-tab.grn { background: rgba(60,200,100,0.12); color: rgba(80,210,110,0.85); }
  .sv-type-tab.org { background: rgba(245,160,50,0.12); color: rgba(255,160,50,0.85); }

  .sv-big-inp { font-size: 22px !important; padding: 12px 14px !important; letter-spacing: -0.5px; }
`

const TrashIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SavingsList({ accounts, onAddAccount, onRemoveAccount, onAddTransaction, onRemoveTransaction }) {
  const [showNew, setShowNew]     = useState(false)
  const [sortDir, setSortDir]       = useState('desc')
  const [txModal, setTxModal]     = useState(null) // { accountId, name, type }
  const [expanded, setExpanded]   = useState({})
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalBalance  = accounts.reduce((s, a) => s + a.balance, 0)
  const totalInterest = accounts.reduce((s, a) => s + (a.rate && a.balance > 0 ? a.balance * a.rate / 100 : 0), 0)
  const sorted        = [...accounts].sort((a, b) => sortDir === 'desc' ? b.balance - a.balance : a.balance - b.balance)

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const formatDate = ts => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="sv">
      <style>{styles}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="sv-hdr">
        <div>
          <h2 className="sv-title">Estalvis</h2>
          <p className="sv-sub">
            {fmtEur(totalBalance)}
            {totalInterest > 0 && (
              <span style={{ color: 'rgba(80,210,110,0.60)', marginLeft: 6 }}>
                · +{fmtEur(totalInterest)}/any
              </span>
            )}
          </p>
        </div>
        <button className={`sv-sort-btn${accounts.length > 1 ? ' on' : ''}`} onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} title="Ordenar per saldo">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          <i className={`sv-sort-arrow${sortDir === 'asc' ? ' asc' : ''}`}>↓</i>
        </button>
        <button className="sv-btn-add" onClick={() => setShowNew(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nou compte
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="sv-empty">
          <p>Cap compte registrat</p>
          <p className="sv-empty-sub">Crea el teu primer compte d'estalvi</p>
        </div>
      ) : sorted.map(acc => (
        <div key={acc.id} className="sv-card">
          {/* Header */}
          <div className="sv-card-hdr" onClick={() => toggle(acc.id)}>
            <div className="sv-card-ic">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(80,210,110,0.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div className="sv-card-info">
              <p className="sv-card-name">{acc.name}</p>
              <p className="sv-card-meta">
                {acc.rate ? `${acc.rate}% TAE` : 'Sense interès'}
                {acc.txs.length > 0 && ` · ${acc.txs.length} moviment${acc.txs.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="sv-card-right" onClick={e => e.stopPropagation()}>
              <div className="sv-card-bal">
                <p className={`sv-card-bal-v${acc.balance < 0 ? ' neg' : ''}`}>{fmtEur(acc.balance)}</p>
                {acc.rate > 0 && acc.balance > 0 && (
                  <p className="sv-card-ann">+{fmtEur(acc.balance * acc.rate / 100)}/any</p>
                )}
              </div>
              <button className="sv-del-btn" title="Eliminar compte"
                onClick={() => askConfirm({ name: acc.name, onConfirm: () => onRemoveAccount(acc.id) })}>
                <TrashIcon />
              </button>
            </div>
            <svg className={`sv-chevron${expanded[acc.id] ? ' open' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Body */}
          {expanded[acc.id] && (
            <div className="sv-body">
              <div className="sv-quick">
                <button className="sv-q-btn dep" onClick={() => setTxModal({ accountId: acc.id, name: acc.name, type: 'deposit' })}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ingrés
                </button>
                <button className="sv-q-btn wit" onClick={() => setTxModal({ accountId: acc.id, name: acc.name, type: 'withdraw' })}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Retirada
                </button>
              </div>

              <div className="sv-txs">
                {acc.txs.length === 0 ? (
                  <div className="sv-empty-txs">Cap moviment — afegeix un ingrés per començar</div>
                ) : [...acc.txs].reverse().map(tx => (
                  <div key={tx.id} className="sv-tx">
                    <div className="sv-tx-dot" style={{ background: tx.amount >= 0 ? 'rgba(80,210,110,0.65)' : 'rgba(255,130,60,0.65)' }} />
                    <div className="sv-tx-info">
                      <p className="sv-tx-note">{tx.note || (tx.amount >= 0 ? 'Ingrés' : 'Retirada')}</p>
                      <p className="sv-tx-date">{formatDate(tx.createdAt)}</p>
                    </div>
                    <span className={`sv-tx-amt ${tx.amount >= 0 ? 'pos' : 'neg'}`}>
                      {tx.amount >= 0 ? '+' : ''}{fmtEur(tx.amount)}
                    </span>
                    <button className="sv-tx-del" title="Eliminar moviment"
                      onClick={() => onRemoveTransaction(acc.id, tx.id)}>
                      <TrashIcon size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {showNew && (
        <NewAccountModal
          onAdd={d => { onAddAccount(d); setShowNew(false) }}
          onClose={() => setShowNew(false)}
        />
      )}

      {txModal && (
        <TransactionModal
          accountName={txModal.name}
          defaultType={txModal.type}
          onAdd={tx => { onAddTransaction(txModal.accountId, tx); setTxModal(null) }}
          onClose={() => setTxModal(null)}
        />
      )}
    </div>
  )
}

// ─── NewAccountModal ──────────────────────────────────────────────────────────
function NewAccountModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', rate: '', notes: '', initialBalance: '' })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    setError('')
    onAdd({ name: form.name.trim(), rate: parseFloat(form.rate) || 0, notes: form.notes.trim(), initialBalance: parseFloat(form.initialBalance) || 0 })
  }

  return (
    <div className="sv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">Nou compte d'estalvi</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Nom del compte</label>
            <input className="sv-inp" autoFocus value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: N26, BBVA Estalvi..." />
          </div>
          <div className="sv-grid2">
            <div>
              <label className="sv-lbl">Saldo inicial (€)</label>
              <input type="number" step="any" className="sv-inp mono" value={form.initialBalance} onChange={e => set('initialBalance', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="sv-lbl">TAE (%)</label>
              <input type="number" step="any" className="sv-inp mono" value={form.rate} onChange={e => set('rate', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="sv-lbl">Notes</label>
            <input className="sv-inp" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="opcional" />
          </div>
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

// ─── TransactionModal ─────────────────────────────────────────────────────────
function TransactionModal({ accountName, defaultType, onAdd, onClose }) {
  const [type, setType]     = useState(defaultType || 'deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [error, setError]   = useState('')
  const isDeposit = type === 'deposit'

  const submit = () => {
    const v = parseFloat(amount)
    if (!v || v <= 0) return setError('Introdueix un import vàlid')
    setError('')
    onAdd({ amount: v, type, note })
  }

  return (
    <div className="sv-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sv-modal">
        <div className="sv-modal-hdr">
          <h3 className="sv-modal-title">{accountName}</h3>
          <button className="sv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sv-type-row">
          <button className={`sv-type-tab${type === 'deposit' ? ' grn' : ''}`} onClick={() => setType('deposit')}>↑ Ingrés</button>
          <button className={`sv-type-tab${type === 'withdraw' ? ' org' : ''}`} onClick={() => setType('withdraw')}>↓ Retirada</button>
        </div>
        <div className="sv-fgroup">
          <div>
            <label className="sv-lbl">Import (€)</label>
            <input type="number" step="any" className="sv-inp mono sv-big-inp" autoFocus
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="sv-lbl">Descripció</label>
            <input className="sv-inp" value={note} onChange={e => setNote(e.target.value)}
              placeholder={isDeposit ? 'ex: Nòmina, transferència...' : 'ex: Vacances, compra...'} />
          </div>
          {error && <p className="sv-error">{error}</p>}
        </div>
        <div className="sv-mfooter">
          <button className="sv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`sv-btn-ok ${isDeposit ? 'grn' : 'org'}`} onClick={submit}>
            {isDeposit ? '+ Afegir ingrés' : '− Registrar retirada'}
          </button>
        </div>
      </div>
    </div>
  )
}