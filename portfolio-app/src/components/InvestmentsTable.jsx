import { useState, useMemo, useEffect, useCallback } from 'react'
import AddInvestmentModal from './AddInvestmentModal'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { fmtEur, fmtPct } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'

const TYPE_LABELS = { etf:'ETF', stock:'Acció', robo:'Robo', estalvi:'Estalvi', efectiu:'Efectiu' }
const CURR_SYM    = { EUR:'€', USD:'$', GBP:'£', CHF:'Fr' }

const styles = `
  .inv { font-family:${FONTS.sans}; }

  /* Header */
  .inv-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; }
  .inv-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .inv-sub-row { display:flex; align-items:center; gap:8px; }
  .inv-sub-val { font-size:13px; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; font-variant-numeric:tabular-nums; }
  .inv-pg-badge {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:500; font-family:${FONTS.mono};
    padding:2px 8px; border-radius:${COLORS.sm};
  }
  .inv-pg-badge.pos { color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; }
  .inv-pg-badge.neg { color:${COLORS.neonRed};   background:${COLORS.bgRed};   border:1px solid ${COLORS.borderRed};   }

  .inv-hdr-btns { display:flex; gap:6px; align-items:center; flex-shrink:0; }
  .inv-btn-ico {
    width:28px; height:28px;
    background:transparent; border:1px solid ${COLORS.border};
    border-radius:${COLORS.sm};
    color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:all 100ms; flex-shrink:0;
  }
  .inv-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .inv-btn-add {
    display:flex; align-items:center; gap:5px;
    padding:6px 12px;
    background:${COLORS.neonPurple}; color:#fff;
    border:none; border-radius:${COLORS.sm};
    font-family:${FONTS.sans}; font-size:12px; font-weight:500;
    cursor:pointer; transition:opacity 100ms; white-space:nowrap;
  }
  .inv-btn-add:hover { opacity:0.85; }

  /* Table */
  .inv-table { width:100%; border-collapse:collapse; font-size:13px; }
  .inv-thead th {
    padding:8px 12px 10px;
    font-size:10px; font-weight:500;
    color:${COLORS.textMuted};
    letter-spacing:0.10em; text-transform:uppercase;
    border-bottom:1px solid ${COLORS.border};
    white-space:nowrap;
  }
  .inv-thead th:first-child { padding-left:0; text-align:left; }
  .inv-thead th:last-child { padding-right:0; }
  .inv-thead th:not(:first-child) { text-align:right; }

  .inv-row { border-bottom:1px solid ${COLORS.border}; cursor:pointer; transition:background 80ms; }
  .inv-row:last-child { border-bottom:none; }
  .inv-row:hover { background:${COLORS.elevated}; }
  .inv-row td { padding:12px 12px; vertical-align:middle; }
  .inv-row td:first-child { padding-left:0; }
  .inv-row td:last-child { padding-right:0; }

  .inv-asset { display:flex; align-items:center; gap:10px; }
  .inv-av {
    width:28px; height:28px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:600; flex-shrink:0;
    font-family:${FONTS.mono};
  }
  .inv-name { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; margin-bottom:3px; white-space:nowrap; }
  .inv-meta { display:flex; align-items:center; gap:5px; }
  .inv-type-badge {
    font-size:9px; font-weight:600; font-family:${FONTS.mono};
    padding:1px 6px; border-radius:2px;
    text-transform:uppercase; letter-spacing:0.06em;
  }
  .inv-ticker { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .inv-curr-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; padding:1px 5px; border-radius:2px; }
  .inv-curr-badge.usd { color:${COLORS.neonAmber}; background:${COLORS.bgAmber}; }
  .inv-curr-badge.gbp { color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; }

  .inv-num { text-align:right; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; font-size:12px; font-variant-numeric:tabular-nums; }
  .inv-val { text-align:right; font-family:${FONTS.mono}; font-weight:500; color:${COLORS.textPrimary}; font-size:13px; font-variant-numeric:tabular-nums; }
  .inv-val-sub { font-size:10px; color:${COLORS.textMuted}; font-weight:400; margin-top:2px; }
  .inv-pg { text-align:right; font-family:${FONTS.mono}; font-size:12px; font-variant-numeric:tabular-nums; }
  .inv-pg.pos { color:${COLORS.neonGreen}; }
  .inv-pg.neg { color:${COLORS.neonRed}; }
  .inv-pct { text-align:right; font-size:11px; font-weight:500; font-family:${FONTS.mono}; white-space:nowrap; }
  .inv-pct.pos { color:${COLORS.neonGreen}; }
  .inv-pct.neg { color:${COLORS.neonRed}; }
  .inv-pct.neu { color:${COLORS.textMuted}; }
  .inv-pes { text-align:right; font-family:${FONTS.mono}; color:${COLORS.textMuted}; font-size:12px; }
  .inv-more-btn { background:transparent; border:none; color:${COLORS.textMuted}; cursor:pointer; font-size:16px; line-height:1; padding:0 2px; letter-spacing:2px; transition:color 100ms; }
  .inv-more-btn:hover { color:${COLORS.textPrimary}; }

  /* Expanded */
  .inv-expanded-row > td { padding:0 !important; border-bottom:1px solid ${COLORS.border}; }
  .inv-panel { padding:16px 0 20px; background:${COLORS.elevated}; border-top:1px solid ${COLORS.border}; }

  /* Stats grid */
  .inv-stats { display:grid; grid-template-columns:repeat(4,1fr); padding:14px 0; border-top:1px solid ${COLORS.border}; border-bottom:1px solid ${COLORS.border}; margin-bottom:14px; }
  .inv-stat { position:relative; padding-right:16px; }
  .inv-stat:not(:last-child)::after { content:''; position:absolute; right:8px; top:0; height:100%; width:1px; background:${COLORS.border}; }
  .inv-stat-l { font-size:10px; font-weight:500; color:${COLORS.textMuted}; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.10em; }
  .inv-stat-v { font-size:13px; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.3px; font-weight:500; font-variant-numeric:tabular-nums; }
  .inv-stat-v.pos { color:${COLORS.neonGreen}; }
  .inv-stat-v.neg { color:${COLORS.neonRed}; }

  /* Action buttons */
  .inv-action-btn {
    display:inline-flex; align-items:center; justify-content:center; gap:5px;
    padding:6px 14px;
    background:transparent; border:1px solid ${COLORS.border};
    border-radius:${COLORS.sm};
    font-family:${FONTS.sans}; font-size:12px; font-weight:500;
    cursor:pointer; transition:all 100ms; white-space:nowrap;
  }

  /* Transactions */
  .inv-tx { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .inv-tx:last-child { border-bottom:none; }
  .inv-tx-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-right:10px; }
  .inv-tx-name { font-size:12px; font-weight:500; color:${COLORS.textSecondary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .inv-tx-date { font-size:10px; color:${COLORS.textMuted}; }
  .inv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:${COLORS.textMuted}; margin-left:8px; flex-shrink:0; transition:all 80ms; }
  .inv-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* Mobile */
  .inv-mobile { display:none; flex-direction:column; }
  .inv-desktop { display:block; }
  @media (max-width:700px) {
    .inv-mobile { display:flex; }
    .inv-desktop { display:none; }
  }

  .inv-mcard { display:flex; align-items:center; padding:13px 0; border-bottom:1px solid ${COLORS.border}; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .inv-mcard:last-child { border-bottom:none; }
  .inv-mcard:active { background:${COLORS.elevated}; }

  .inv-empty { padding:56px 0; text-align:center; }
  .inv-empty-main { font-size:14px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .inv-empty-sub { font-size:12px; color:${COLORS.textMuted}; opacity:0.5; }

  /* Modal */
  .inv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
  .inv-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px; width:100%; max-width:420px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90vh; overflow-y:auto; }
  .inv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .inv-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .inv-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .inv-modal-x:hover { color:${COLORS.textPrimary}; }
  .inv-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .inv-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; }
  .inv-inp:focus { border-color:${COLORS.neonPurple}; }
  .inv-inp::placeholder { color:${COLORS.textMuted}; }
  .inv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .inv-inp.big { font-size:20px; padding:12px 14px; letter-spacing:-0.5px; }
  .inv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }
  .inv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .inv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .inv-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .inv-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .inv-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 100ms; }
  .inv-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .inv-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .inv-btn-ok.blu { background:${COLORS.neonPurple}; color:#fff; }
  .inv-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }

  .inv-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:5px; overflow:hidden; margin-bottom:16px; }
  .inv-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; color:${COLORS.textMuted}; }
  .inv-type-tab:hover { color:${COLORS.textPrimary}; background:${COLORS.elevated}; }
  .inv-type-tab.grn { background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; border-bottom:1px solid ${COLORS.borderGreen}; }
  .inv-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; border-bottom:1px solid ${COLORS.borderAmber}; }
  .inv-type-tab.blu { background:${COLORS.bgPurple}; color:${COLORS.neonPurple}; border-bottom:1px solid ${COLORS.borderPurple}; }
`

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const PriceTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'5px 9px', fontFamily:FONTS.mono, fontSize:11, color:COLORS.textPrimary }}>
      {fmtEur(payload[0]?.value)}
    </div>
  )
}

function fmtQty(n) { if (!n) return '0'; return parseFloat(n.toFixed(6)).toString() }

function currentValue(inv) {
  if (inv.currentPrice != null && inv.totalQty > 0) return inv.totalQty * inv.currentPrice
  return inv.totalCost || 0
}

export default function InvestmentsTable({ investments, onAddInvestment, onRemoveInvestment, onAddTransaction, onRemoveTransaction, loading, status, onRefresh }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const [fxRates, setFxRates]   = useState({})
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  useEffect(() => {
    const pairs = [...new Set(investments.map(i => i.originalCurrency || i.currency).filter(c => c && c !== 'EUR'))]
    pairs.forEach(curr => {
      fetch(`/yahoo/v8/finance/chart/${curr}EUR=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
        .then(r => r.json()).then(d => { const r = d?.chart?.result?.[0]?.meta?.regularMarketPrice; if (r > 0) setFxRates(p => ({ ...p, [curr]: r })) }).catch(() => {})
    })
  }, [investments.length]) // eslint-disable-line

  const calcVal = inv => {
    const origCurr = inv.originalCurrency || inv.currency || 'EUR'
    const qty = inv.totalQty || 0
    if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
      return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
    return currentValue(inv)
  }

  const totalValue = investments.reduce((s, inv) => s + calcVal(inv), 0)
  const totalCost  = investments.reduce((s, inv) => s + (inv.totalCost || 0), 0)
  const totalGain  = totalValue - totalCost
  const isPos      = totalGain >= 0
  const gainPct    = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const sorted     = [...investments].sort((a, b) => sortDir === 'desc' ? calcVal(b) - calcVal(a) : calcVal(a) - calcVal(b))
  const toggle     = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  return (
    <div className="inv">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="inv-hdr">
        <div>
          <h2 className="inv-title">Inversions</h2>
          <div className="inv-sub-row">
            <span className="inv-sub-val">{fmtEur(totalValue)}</span>
            {totalCost > 0 && (
              <span className={`inv-pg-badge ${isPos ? 'pos' : 'neg'}`}>
                {isPos ? '▲' : '▼'} {Math.abs(gainPct).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="inv-hdr-btns">
          {onRefresh && (
            <button className="inv-btn-ico" onClick={onRefresh} title="Actualitzar preus">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          )}
          <button className="inv-btn-ico" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} title="Ordenar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          </button>
          <button className="inv-btn-add" onClick={() => setShowNew(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova posició
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="inv-empty">
          <p className="inv-empty-main">Cap inversió registrada</p>
          <p className="inv-empty-sub">Afegeix la teva primera posició</p>
        </div>
      ) : (<>
        {/* Mobile */}
        <div className="inv-mobile">
          {sorted.map(inv => (
            <MobileCard key={inv.id} inv={inv} expanded={!!expanded[inv.id]} onToggle={() => toggle(inv.id)}
              onRemove={() => askConfirm({ name: inv.name, onConfirm: () => onRemoveInvestment(inv.id) })}
              onOpenTx={type => setTxModal({ invId: inv.id, name: inv.name, type, currency: inv.currency || inv.originalCurrency || null, ticker: inv.ticker })}
              onRemoveTx={txId => onRemoveTransaction(inv.id, txId)} fxRates={fxRates} totalValue={totalValue} />
          ))}
        </div>

        {/* Desktop */}
        <div className="inv-desktop">
          <table className="inv-table">
            <thead className="inv-thead">
              <tr>
                <th>Actiu</th><th>Quantitat</th><th>Preu mig</th><th>Valor</th>
                <th>P&amp;G</th><th>P&amp;G %</th><th>Pes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(inv => (
                <InvestmentRow key={inv.id} inv={inv} expanded={!!expanded[inv.id]} onToggle={() => toggle(inv.id)}
                  onRemove={() => askConfirm({ name: inv.name, onConfirm: () => onRemoveInvestment(inv.id) })}
                  onOpenTx={type => setTxModal({ invId: inv.id, name: inv.name, type, currency: inv.currency || inv.originalCurrency || null, ticker: inv.ticker })}
                  onRemoveTx={txId => onRemoveTransaction(inv.id, txId)} fxRates={fxRates} totalValue={totalValue} />
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {showNew && <AddInvestmentModal onAdd={d => { onAddInvestment(d); setShowNew(false) }} onClose={() => setShowNew(false)} />}
      {txModal && <TransactionModal invName={txModal.name} defaultType={txModal.type} currency={txModal.currency} ticker={txModal.ticker} onAdd={tx => { onAddTransaction(txModal.invId, tx); setTxModal(null) }} onClose={() => setTxModal(null)} />}
    </div>
  )
}

function MobileCard({ inv, expanded, onToggle, onRemove, onOpenTx, onRemoveTx, fxRates={}, totalValue }) {
  const tc       = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'
  const hasOrig  = origCurr !== 'EUR' && inv.originalPrice != null && inv.totalQty > 0
  const origVal  = hasOrig ? inv.totalQty * inv.originalPrice : null
  const liveRate = fxRates[origCurr]
  const curVal   = hasOrig && liveRate ? +(origVal * liveRate).toFixed(2) : currentValue(inv)
  const gain     = curVal - (inv.totalCost || 0)
  const gPct     = (inv.totalCost || 0) > 0 ? (gain / inv.totalCost) * 100 : 0
  const isPos    = gain >= 0

  return (
    <div>
      <div className="inv-mcard" onClick={onToggle}>
        <div className="inv-av" style={{ background:tc.bg, color:tc.color, marginRight:12 }}>
          {inv.name.slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p className="inv-name" style={{ marginBottom:2 }}>{inv.name}</p>
          <div className="inv-meta">
            <span className="inv-type-badge" style={{ background:tc.bg, color:tc.color }}>{TYPE_LABELS[inv.type]||inv.type}</span>
            {inv.ticker && <span className="inv-ticker">{inv.ticker}</span>}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
          <p style={{ fontSize:13, fontWeight:500, fontFamily:FONTS.mono, color:COLORS.textPrimary, fontVariantNumeric:'tabular-nums', marginBottom:2 }}>{fmtEur(curVal)}</p>
          <p style={{ fontSize:11, fontFamily:FONTS.mono, color:isPos?COLORS.neonGreen:COLORS.neonRed, fontWeight:500 }}>{isPos?'▲':'▼'} {Math.abs(gPct).toFixed(2)}%</p>
        </div>
        <svg style={{ color:COLORS.textMuted, marginLeft:10, flexShrink:0, transition:'transform 200ms', transform:expanded?'rotate(180deg)':'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {expanded && (
        <div style={{ background:COLORS.elevated, borderTop:`1px solid ${COLORS.border}`, padding:'14px 0 16px', fontFamily:FONTS.sans }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0, paddingBottom:12, marginBottom:12, borderBottom:`1px solid ${COLORS.border}` }}>
            {[
              { l:'Cost mitjà', v: inv.totalQty>0 ? fmtEur(inv.avgCost)+'/u.' : '—' },
              { l:'Invertit',   v: fmtEur(inv.totalCost||0) },
              { l:'P&G',        v: (isPos?'+':'')+fmtEur(gain), pos:isPos },
            ].map((s,i) => (
              <div key={i} style={{ position:'relative', paddingRight:12 }}>
                {i<2 && <div style={{ position:'absolute', right:6, top:2, height:'calc(100% - 4px)', width:1, background:COLORS.border }}/>}
                <p style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.l}</p>
                <p style={{ fontSize:13, fontFamily:FONTS.mono, color:s.pos===true?COLORS.neonGreen:s.pos===false?COLORS.neonRed:COLORS.textPrimary, fontWeight:500, fontVariantNumeric:'tabular-nums' }}>{s.v}</p>
              </div>
            ))}
          </div>
          <ActionButtons onOpenTx={onOpenTx} onRemove={onRemove} />
          <TxList txs={inv.txs} onRemoveTx={onRemoveTx} />
        </div>
      )}
    </div>
  )
}

function ActionButtons({ onOpenTx, onRemove }) {
  const btns = [
    { label:'Comprar',   color:COLORS.neonGreen,  bg:COLORS.bgGreen,  border:COLORS.borderGreen,  onClick:()=>onOpenTx('buy') },
    { label:'Vendre',    color:COLORS.neonAmber,  bg:COLORS.bgAmber,  border:COLORS.borderAmber,  onClick:()=>onOpenTx('sell') },
    { label:'Aportació', color:COLORS.neonCyan,   bg:COLORS.bgCyan,   border:COLORS.borderCyan,   onClick:()=>onOpenTx('capital') },
    { label:'Eliminar',  color:COLORS.neonRed,    bg:COLORS.bgRed,    border:COLORS.borderRed,    onClick:onRemove, ml:'auto' },
  ]
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14, paddingTop:4 }}>
      {btns.map(b => (
        <button key={b.label} onClick={b.onClick} style={{ marginLeft:b.ml||0, display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', border:`1px solid ${COLORS.border}`, borderRadius:4, fontFamily:FONTS.sans, fontSize:12, fontWeight:500, cursor:'pointer', color:b.color, whiteSpace:'nowrap', transition:'all 100ms' }}
          onMouseOver={e=>{ e.currentTarget.style.background=b.bg; e.currentTarget.style.borderColor=b.border }}
          onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
        >{b.label}</button>
      ))}
    </div>
  )
}

function TxList({ txs, onRemoveTx }) {
  if (!txs || txs.length === 0) return (
    <p style={{ fontSize:12, color:COLORS.textMuted, textAlign:'center', padding:'12px 0' }}>Cap operació registrada</p>
  )
  return (
    <div>
      <p style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, textTransform:'uppercase', letterSpacing:'0.10em', margin:'0 0 8px' }}>Operacions</p>
      <div style={{ maxHeight:200, overflowY:'auto' }}>
        {[...txs].reverse().map(tx => {
          const dotC = tx.type==='buy' ? COLORS.neonGreen : tx.type==='sell' ? COLORS.neonAmber : COLORS.neonCyan
          return (
            <div key={tx.id} className="inv-tx">
              <div className="inv-tx-dot" style={{ background:dotC }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p className="inv-tx-name">{tx.note||(tx.type==='buy'?'Compra':tx.type==='sell'?'Venda':'Aportació')}</p>
                <p className="inv-tx-date">{tx.date||'—'}</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                {tx.type!=='capital' && tx.qty>0 && <p style={{ fontSize:12, fontWeight:600, fontFamily:FONTS.mono, color:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber, margin:0 }}>{tx.type==='buy'?'+':'−'}{fmtQty(tx.qty)}</p>}
                <p style={{ fontSize:11, color:COLORS.textMuted, fontFamily:FONTS.mono, marginTop:2 }}>{fmtEur(tx.totalCost)}</p>
              </div>
              <button className="inv-tx-del" onClick={()=>onRemoveTx(tx.id)}><TrashIcon size={11}/></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InvestmentRow({ inv, expanded, onToggle, onRemove, onOpenTx, onRemoveTx, fxRates={}, totalValue }) {
  const tc       = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'
  const hasOrig  = origCurr !== 'EUR' && inv.originalPrice != null && inv.totalQty > 0
  const origVal  = hasOrig ? inv.totalQty * inv.originalPrice : null
  const liveRate = fxRates[origCurr]
  const curVal   = hasOrig && liveRate ? +(origVal * liveRate).toFixed(2) : currentValue(inv)
  const gain     = curVal - (inv.totalCost || 0)
  const gPct     = (inv.totalCost || 0) > 0 ? (gain / inv.totalCost) * 100 : 0
  const isPos    = gain >= 0
  const weight   = totalValue > 0 ? (curVal / totalValue) * 100 : 0

  const chartData = useMemo(() => {
    const pts = (inv.txs||[]).filter(t=>t.type==='buy'&&t.pricePerUnit>0).map((t,i)=>({i,price:t.pricePerUnit}))
    if (inv.currentPrice!=null) pts.push({i:pts.length,price:inv.currentPrice})
    return pts
  }, [inv.txs, inv.currentPrice])

  return (<>
    <tr className="inv-row" onClick={onToggle}>
      <td>
        <div className="inv-asset">
          <div className="inv-av" style={{ background:tc.bg, color:tc.color }}>{inv.name.slice(0,2).toUpperCase()}</div>
          <div>
            <p className="inv-name">{inv.name}</p>
            <div className="inv-meta">
              <span className="inv-type-badge" style={{ background:tc.bg, color:tc.color }}>{TYPE_LABELS[inv.type]||inv.type}</span>
              {inv.ticker && <span className="inv-ticker">{inv.ticker}</span>}
              {origCurr!=='EUR' && <span className={`inv-curr-badge ${origCurr.toLowerCase()}`}>{origCurr}</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="inv-num">{inv.totalQty>0?fmtQty(inv.totalQty):'—'}</td>
      <td className="inv-num">{inv.avgCost>0?fmtEur(inv.avgCost):'—'}</td>
      <td className="inv-val" onClick={e=>e.stopPropagation()}>
        {fmtEur(curVal)}
        {origVal!=null && <div className="inv-val-sub">{CURR_SYM[origCurr]||origCurr}{origVal.toLocaleString('ca-ES',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>}
      </td>
      <td className={`inv-pg ${isPos?'pos':'neg'}`} onClick={e=>e.stopPropagation()}>{isPos?'+':''}{fmtEur(gain)}</td>
      <td className={`inv-pct ${isPos?'pos':gPct===0?'neu':'neg'}`} onClick={e=>e.stopPropagation()}>
        {isPos?'▲':gPct<0?'▼':''} {Math.abs(gPct).toFixed(2)}%
      </td>
      <td className="inv-pes" onClick={e=>e.stopPropagation()}>{weight.toFixed(1)}%</td>
      <td style={{textAlign:'right'}} onClick={e=>e.stopPropagation()}>
        <button className="inv-more-btn">···</button>
      </td>
    </tr>

    {expanded && (
      <tr className="inv-expanded-row">
        <td colSpan={8}>
          <div className="inv-panel" style={{ padding:'16px 0 20px', fontFamily:FONTS.sans }}>
            {chartData.length>=2 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, textTransform:'uppercase', letterSpacing:'0.10em' }}>Evolució del preu</span>
                  {inv.currentPrice!=null && <span style={{ fontSize:11, fontFamily:FONTS.mono, color:isPos?COLORS.neonGreen:COLORS.neonRed }}>{fmtEur(inv.originalPrice??inv.currentPrice)}/u.</span>}
                </div>
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={chartData} margin={{top:2,right:0,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id={`g${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPos?'rgba(0,255,136,0.15)':'rgba(255,59,59,0.12)'} />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="price" stroke={isPos?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill={`url(#g${inv.id})`} dot={false} />
                    <Tooltip content={<PriceTip />} cursor={{ stroke:COLORS.border, strokeWidth:1 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="inv-stats">
              {[
                { l:'Cost mitjà', v:inv.totalQty>0?fmtEur(inv.avgCost)+'/u.':'—' },
                { l:'Accions',    v:fmtQty(inv.totalQty||0) },
                { l:'Invertit',   v:fmtEur(inv.totalCost||0) },
                { l:'P&G',        v:(isPos?'+':'')+fmtEur(gain), cls:isPos?'pos':'neg' },
              ].map((s,i) => (
                <div key={i} className="inv-stat">
                  <p className="inv-stat-l">{s.l}</p>
                  <p className={`inv-stat-v${s.cls?' '+s.cls:''}`}>{s.v}</p>
                </div>
              ))}
            </div>

            <ActionButtons onOpenTx={onOpenTx} onRemove={onRemove} />
            <TxList txs={inv.txs} onRemoveTx={onRemoveTx} />
          </div>
        </td>
      </tr>
    )}
  </>)
}

function TransactionModal({ invName, defaultType, currency='EUR', ticker, onAdd, onClose }) {
  const [type, setType]       = useState(defaultType||'buy')
  const [qty, setQty]         = useState('')
  const [price, setPrice]     = useState('')
  const [total, setTotal]     = useState('')
  const [note, setNote]       = useState('')
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
  const [error, setError]     = useState('')
  const [rate, setRate]       = useState(null)
  const [livePrice, setLivePrice] = useState(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [resolvedCurrency, setResolvedCurrency] = useState(currency||'EUR')

  const isBuySell = type==='buy'||type==='sell'
  const isNonEur  = resolvedCurrency!=='EUR'
  const sym       = CURR_SYM[resolvedCurrency]||resolvedCurrency

  useEffect(() => {
    if (!ticker) return
    setFetchingPrice(true)
    fetch(`/yahoo/v8/finance/chart/${ticker}?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
      .then(r=>r.json()).then(d => {
        const result = d?.chart?.result?.[0]
        let p = result?.meta?.regularMarketPrice
        const yahooCurr = result?.meta?.currency
        const realCurr = yahooCurr==='GBp'?'GBP':(yahooCurr||currency||'EUR')
        if (p&&yahooCurr==='GBp') p=p*0.01
        if (p>0) setLivePrice(+p.toFixed(4))
        if (realCurr!==resolvedCurrency) setResolvedCurrency(realCurr)
      }).catch(()=>{}).finally(()=>setFetchingPrice(false))
  }, [ticker]) // eslint-disable-line

  useEffect(() => {
    if (!resolvedCurrency||resolvedCurrency==='EUR') { setRate(1); return }
    fetch(`/yahoo/v8/finance/chart/${resolvedCurrency}EUR=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
      .then(r=>r.json()).then(d=>{ const r=d?.chart?.result?.[0]?.meta?.regularMarketPrice; setRate(r>0?r:null) }).catch(()=>setRate(null))
  }, [resolvedCurrency]) // eslint-disable-line

  const recalc = useCallback((q,p)=>{ const t=parseFloat(q)*parseFloat(p); if (!isNaN(t)&&t>0) setTotal(t.toFixed(2)) },[])
  const handleQty   = v=>{ setQty(v);   if(v&&price) recalc(v,price) }
  const handlePrice = v=>{ setPrice(v); if(v&&qty)   recalc(qty,v) }
  const fillLive = ()=>{ if(!livePrice) return; setPrice(livePrice.toString()); if(qty) recalc(qty,livePrice) }

  const totalOrig = parseFloat(total)||0
  const totalEur  = isNonEur&&rate ? +(totalOrig*rate).toFixed(2) : totalOrig
  const priceOrig = parseFloat(price)||0
  const priceEur  = isNonEur&&rate ? +(priceOrig*rate).toFixed(4) : priceOrig

  const submit = () => {
    if (isNonEur&&!rate) return setError('Taxa de canvi no disponible')
    if (isBuySell) {
      const q=parseFloat(qty)
      if (!q||q<=0) return setError('La quantitat és obligatòria')
      if (!totalOrig||totalOrig<=0) return setError("L'import és obligatori")
      setError('')
      onAdd({ qty:q, pricePerUnit:priceEur, pricePerUnitOrig:priceOrig, totalCost:totalEur, totalCostOrig:totalOrig, currency:resolvedCurrency, type, note, date })
    } else {
      if (!totalOrig||totalOrig<=0) return setError("L'import és obligatori")
      setError('')
      onAdd({ qty:0, pricePerUnit:0, totalCost:totalEur, totalCostOrig:totalOrig, currency:resolvedCurrency, type, note, date })
    }
  }

  return (
    <div className="inv-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="inv-modal">
        <div className="inv-modal-hdr">
          <h3 className="inv-modal-title">{invName}</h3>
          <button className="inv-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="inv-type-row">
          <button className={`inv-type-tab${type==='buy'?' grn':''}`} onClick={()=>setType('buy')}>↑ Compra</button>
          <button className={`inv-type-tab${type==='sell'?' org':''}`} onClick={()=>setType('sell')}>↓ Venda</button>
          <button className={`inv-type-tab${type==='capital'?' blu':''}`} onClick={()=>setType('capital')}>+ Aportació</button>
        </div>
        <div className="inv-fgroup">
          {isBuySell && (
            <div className="inv-grid2">
              <div>
                <label className="inv-lbl">Accions</label>
                <input type="number" inputMode="decimal" step="any" className="inv-inp mono" autoFocus value={qty} onChange={e=>handleQty(e.target.value)} placeholder="0" />
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <label className="inv-lbl" style={{ margin:0 }}>Preu/u. ({sym})</label>
                  {ticker && (
                    <button onClick={fillLive} disabled={fetchingPrice||!livePrice} style={{ fontSize:10, fontWeight:600, padding:'3px 8px', border:`1px solid ${COLORS.border}`, borderRadius:4, background:COLORS.elevated, color:livePrice?COLORS.neonGreen:COLORS.textMuted, fontFamily:FONTS.mono, cursor:livePrice?'pointer':'default', transition:'all 100ms' }}>
                      {fetchingPrice?'...' : livePrice?`${sym}${livePrice}`:'—'}
                    </button>
                  )}
                </div>
                <input type="number" inputMode="decimal" step="any" className="inv-inp mono" value={price} onChange={e=>handlePrice(e.target.value)} placeholder="0.00" />
                {isNonEur&&priceOrig>0&&rate && <p style={{ fontSize:10, color:COLORS.textMuted, fontFamily:FONTS.mono, marginTop:4, textAlign:'right' }}>= €{priceEur.toFixed(4)}</p>}
              </div>
            </div>
          )}
          <div>
            <label className="inv-lbl">{isBuySell?`Total (${sym})`:`Import (${sym})`}</label>
            <input type="number" inputMode="decimal" step="any" className={`inv-inp mono${!isBuySell?' big':''}`} autoFocus={!isBuySell} value={total} onChange={e=>setTotal(e.target.value)} placeholder="0.00" />
            {isNonEur&&totalOrig>0 && (
              <p style={{ fontSize:11, color:COLORS.textMuted, fontFamily:FONTS.mono, marginTop:5, textAlign:'right' }}>
                {rate?<>= <span style={{color:COLORS.textPrimary}}>€{totalEur.toFixed(2)}</span> <span style={{opacity:0.4}}>· 1{sym}=€{rate.toFixed(4)}</span></>:<span style={{color:COLORS.neonRed}}>Taxa no disponible</span>}
              </p>
            )}
          </div>
          <div className="inv-grid2">
            <div><label className="inv-lbl">Data</label><input type="date" className="inv-inp" value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div><label className="inv-lbl">Nota</label><input className="inv-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="opcional" /></div>
          </div>
          {error && <p className="inv-error">{error}</p>}
        </div>
        <div className="inv-mfooter">
          <button className="inv-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`inv-btn-ok ${type==='buy'?'grn':type==='sell'?'org':'blu'}`} onClick={submit}>
            {type==='buy'?'Registrar compra':type==='sell'?'Registrar venda':'Afegir aportació'}
          </button>
        </div>
      </div>
    </div>
  )
}