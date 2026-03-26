import { useState, useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { fmtEur, fmtPct } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import AddInvestmentModal from './AddInvestmentModal'

const TYPE_COLORS = {
  etf:     { bg: 'rgba(60,130,255,0.10)',  color: 'rgba(100,160,255,0.85)' },
  stock:   { bg: 'rgba(80,200,120,0.10)',  color: 'rgba(80,210,120,0.85)'  },
  robo:    { bg: 'rgba(180,120,255,0.10)', color: 'rgba(180,130,255,0.85)' },
  estalvi: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' },
  efectiu: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' },
}
const TYPE_LABELS = { etf: 'ETF', stock: 'Acció', robo: 'Robo', estalvi: 'Estalvi', efectiu: 'Efectiu' }

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  .inv2 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 10px; }
  .inv2-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4px; }
  .inv2-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72); letter-spacing: -0.2px; }
  .inv2-sub { font-size: 11px; color: rgba(255,255,255,0.26); margin-top: 3px; font-family: 'Geist Mono', monospace; letter-spacing: -0.2px; }
  .inv2-btn-add { display: flex; align-items: center; gap: 4px; padding: 0 11px; height: 28px; background: rgba(255,255,255,0.92); color: #080808; border: none; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 100ms; white-space: nowrap; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .inv2-btn-add:hover { background: #fff; }
  .inv2-btn-ico { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 5px; color: rgba(255,255,255,0.32); cursor: pointer; transition: all 100ms; flex-shrink: 0; }
  .inv2-btn-ico:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.60); }

  .inv2-card { border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; background: rgba(255,255,255,0.015); overflow: hidden; }
  .inv2-card-hdr { display: flex; align-items: center; padding: 12px 14px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .inv2-card-hdr:active { background: rgba(255,255,255,0.03); }
  @media (hover: hover) { .inv2-card-hdr:hover { background: rgba(255,255,255,0.025); } }

  .inv2-av { width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0; margin-right: 10px; }
  .inv2-info { flex: 1; min-width: 0; }
  .inv2-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .inv2-meta { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .inv2-bdg { font-size: 9px; font-weight: 500; padding: 1px 5px; border-radius: 3px; }
  .inv2-dot { font-size: 9px; color: rgba(255,255,255,0.14); }

  .inv2-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .inv2-val { text-align: right; }
  .inv2-val-v { font-size: 14px; font-weight: 500; font-family: 'Geist Mono', monospace; letter-spacing: -0.4px; color: rgba(255,255,255,0.82); }
  .inv2-val-pg { font-size: 10px; font-family: 'Geist Mono', monospace; margin-top: 1px; }
  .pos { color: rgba(80,210,110,0.80); }
  .neg { color: rgba(255,90,70,0.80); }

  .inv2-del { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 5px; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: all 80ms; background: rgba(255,255,255,0.05); color: rgba(220,70,55,0.55); flex-shrink: 0; }
  .inv2-del:active { transform: scale(0.88); }
  @media (hover: hover) and (pointer: fine) {
    .inv2-del { background: transparent; color: rgba(255,255,255,0.18); }
    .inv2-del:hover { background: rgba(200,40,30,0.10); color: rgba(220,70,55,0.80); }
  }
  .inv2-chev { color: rgba(255,255,255,0.18); transition: transform 220ms; flex-shrink: 0; margin-left: 4px; }
  .inv2-chev.open { transform: rotate(180deg); }

  .inv2-body { border-top: 1px solid rgba(255,255,255,0.06); }
  .inv2-chart-wrap { padding: 12px 14px 4px; }
  .inv2-chart-lbl { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .inv2-chart-txt { font-size: 10px; color: rgba(255,255,255,0.26); }
  .inv2-chart-price { font-size: 10px; font-family: 'Geist Mono', monospace; }

  .inv2-stats { display: flex; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .inv2-stat { flex: 1; position: relative; padding-right: 10px; }
  .inv2-stat:not(:last-child)::after { content: ''; position: absolute; right: 5px; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.06); }
  .inv2-stat-l { font-size: 9px; color: rgba(255,255,255,0.24); margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
  .inv2-stat-v { font-size: 11px; font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.65); letter-spacing: -0.3px; }

  .inv2-quick { display: flex; gap: 6px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .inv2-q-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: transparent; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 100ms; -webkit-tap-highlight-color: transparent; }
  .inv2-q-btn.buy  { color: rgba(80,210,110,0.80); }
  .inv2-q-btn.buy:hover  { background: rgba(80,210,110,0.07); border-color: rgba(80,210,110,0.22); }
  .inv2-q-btn.sell { color: rgba(255,160,50,0.80); }
  .inv2-q-btn.sell:hover { background: rgba(255,160,50,0.07); border-color: rgba(255,160,50,0.22); }
  .inv2-q-btn.cap  { color: rgba(100,155,255,0.80); }
  .inv2-q-btn.cap:hover  { background: rgba(100,155,255,0.07); border-color: rgba(100,155,255,0.22); }
  .inv2-q-btn:active { transform: scale(0.97); }

  .inv2-txs { max-height: 220px; overflow-y: auto; }
  .inv2-tx { display: flex; align-items: center; padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .inv2-tx:last-child { border-bottom: none; }
  .inv2-tx-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-right: 9px; }
  .inv2-tx-info { flex: 1; min-width: 0; }
  .inv2-tx-note { font-size: 12px; color: rgba(255,255,255,0.60); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .inv2-tx-date { font-size: 10px; color: rgba(255,255,255,0.22); margin-top: 1px; }
  .inv2-tx-right { text-align: right; flex-shrink: 0; margin-left: 8px; }
  .inv2-tx-amt { font-size: 12px; font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .inv2-tx-sub { font-size: 10px; color: rgba(255,255,255,0.26); font-family: 'Geist Mono', monospace; margin-top: 1px; }
  .inv2-tx-del { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 4px; cursor: pointer; color: rgba(255,255,255,0.14); margin-left: 4px; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .inv2-tx-del:hover { color: rgba(220,70,55,0.70); background: rgba(200,40,30,0.08); }
  .inv2-tx-del:active { transform: scale(0.88); }

  .inv2-empty-txs { padding: 16px 14px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.20); }
  .inv2-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
  .inv2-empty-sub { font-size: 10px; color: rgba(255,255,255,0.14); margin-top: 4px; }
  .inv2-sort-btn { display: flex; align-items: center; gap: 3px; padding: 0 7px; height: 24px; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 4px; font-family: 'Geist', sans-serif; font-size: 10px; color: rgba(255,255,255,0.32); cursor: pointer; transition: all 100ms; white-space: nowrap; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .inv2-sort-btn:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.58); }
  .inv2-sort-btn.on { border-color: rgba(255,255,255,0.16); color: rgba(255,255,255,0.62); }
  .inv2-sort-arrow { display: inline-block; transition: transform 150ms; font-style: normal; }
  .inv2-sort-arrow.asc { transform: rotate(180deg); }


  .inv2-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(5px); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
  .inv2-modal { background: #111; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px 14px 0 0; width: 100%; max-width: 440px; padding: 22px 20px 30px; font-family: 'Geist', sans-serif; max-height: 90vh; overflow-y: auto; }
  .inv2-modal-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .inv2-modal-title { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .inv2-modal-x { width: 26px; height: 26px; border-radius: 5px; background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.40); font-size: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-family: inherit; }
  .inv2-lbl { display: block; font-size: 10px; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
  .inv2-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.82); outline: none; box-sizing: border-box; transition: border-color 100ms; }
  .inv2-inp:focus { border-color: rgba(255,255,255,0.20); }
  .inv2-inp::placeholder { color: rgba(255,255,255,0.18); }
  .inv2-inp.mono { font-family: 'Geist Mono', monospace; text-align: right; }
  .inv2-inp.big { font-size: 20px; padding: 11px 13px; letter-spacing: -0.5px; }
  .inv2-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .inv2-fgroup { display: flex; flex-direction: column; gap: 11px; }
  .inv2-mfooter { display: flex; gap: 8px; margin-top: 18px; }
  .inv2-btn-cancel { flex: 1; padding: 11px; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.36); cursor: pointer; }
  .inv2-btn-ok { flex: 1; padding: 11px; border: none; border-radius: 6px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
  .inv2-btn-ok.def { background: rgba(255,255,255,0.92); color: #080808; }
  .inv2-btn-ok.grn { background: rgba(60,200,100,0.85); color: #080808; }
  .inv2-btn-ok.org { background: rgba(245,160,50,0.85); color: #080808; }
  .inv2-btn-ok.blu { background: rgba(80,140,255,0.85); color: #fff; }
  .inv2-error { font-size: 12px; color: rgba(255,80,60,0.80); background: rgba(255,50,30,0.08); border: 1px solid rgba(255,50,30,0.14); border-radius: 5px; padding: 8px 11px; }
  .inv2-type-row { display: flex; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
  .inv2-type-tab { flex: 1; padding: 9px; border: none; background: transparent; font-family: 'Geist', sans-serif; font-size: 12px; cursor: pointer; transition: all 100ms; color: rgba(255,255,255,0.34); }
  .inv2-type-tab.grn { background: rgba(60,200,100,0.12); color: rgba(80,210,110,0.85); }
  .inv2-type-tab.org { background: rgba(245,160,50,0.12); color: rgba(255,160,50,0.85); }
  .inv2-type-tab.blu { background: rgba(80,140,255,0.12); color: rgba(100,155,255,0.85); }
`

const TrashIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const PriceTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 5, padding: '5px 9px', fontFamily: "'Geist Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
      {fmtEur(payload[0]?.value)}
    </div>
  )
}

function fmtQty(n) {
  if (!n) return '0'
  return parseFloat(n.toFixed(6)).toString()
}

function currentValue(inv) {
  if (inv.currentPrice != null && inv.totalQty > 0) return inv.totalQty * inv.currentPrice
  return inv.totalCost || 0
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InvestmentsTable({ investments, onAddInvestment, onRemoveInvestment, onAddTransaction, onRemoveTransaction, loading, status, onRefresh }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalValue = investments.reduce((s, inv) => s + currentValue(inv), 0)
  const totalCost  = investments.reduce((s, inv) => s + (inv.totalCost || 0), 0)
  const totalGain  = totalValue - totalCost

  const sorted = [...investments].sort((a, b) => {
    const va = currentValue(a), vb = currentValue(b)
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  return (
    <div className="inv2">
      <style>{styles}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="inv2-hdr">
        <div>
          <h2 className="inv2-title">Inversions</h2>
          <p className="inv2-sub">
            {fmtEur(totalValue)}
            {totalCost > 0 && (
              <span style={{ color: totalGain >= 0 ? 'rgba(80,210,110,0.60)' : 'rgba(255,90,70,0.60)', marginLeft: 6 }}>
                · {totalGain >= 0 ? '+' : ''}{fmtEur(totalGain)} ({fmtPct(totalCost > 0 ? (totalGain / totalCost) * 100 : 0)})
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onRefresh && (
            <button className="inv2-btn-ico" onClick={onRefresh} title="Actualitzar preus">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          )}
          <button className={`inv2-sort-btn${sorted.length > 1 ? ' on' : ''}`} onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} title="Ordenar per valor">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
            <i className={`inv2-sort-arrow${sortDir === 'asc' ? ' asc' : ''}`}>↓</i>
          </button>
          <button className="inv2-btn-add" onClick={() => setShowNew(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova posició
          </button>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="inv2-empty">
          <p>Cap inversió registrada</p>
          <p className="inv2-empty-sub">Crea la teva primera posició</p>
        </div>
      ) : sorted.map(inv => (
        <InvestmentCard key={inv.id} inv={inv}
          expanded={!!expanded[inv.id]}
          onToggle={() => toggle(inv.id)}
          onRemove={() => askConfirm({ name: inv.name, onConfirm: () => onRemoveInvestment(inv.id) })}
          onOpenTx={type => setTxModal({ invId: inv.id, name: inv.name, type })}
          onRemoveTx={txId => onRemoveTransaction(inv.id, txId)}
        />
      ))}

      {showNew && <AddInvestmentModal onAdd={d => { onAddInvestment(d); setShowNew(false) }} onClose={() => setShowNew(false)} />}
      {txModal && <TransactionModal invName={txModal.name} defaultType={txModal.type} onAdd={tx => { onAddTransaction(txModal.invId, tx); setTxModal(null) }} onClose={() => setTxModal(null)} />}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function InvestmentCard({ inv, expanded, onToggle, onRemove, onOpenTx, onRemoveTx }) {
  const tc     = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
  const curVal = currentValue(inv)
  const gain   = curVal - (inv.totalCost || 0)
  const gPct   = (inv.totalCost || 0) > 0 ? (gain / inv.totalCost) * 100 : 0
  const isPos  = gain >= 0

  const chartData = useMemo(() => {
    const pts = (inv.txs || [])
      .filter(t => t.type === 'buy' && t.pricePerUnit > 0)
      .map((t, i) => ({ i, price: t.pricePerUnit }))
    if (inv.currentPrice != null) pts.push({ i: pts.length, price: inv.currentPrice })
    return pts
  }, [inv.txs, inv.currentPrice])

  const cc = isPos ? 'rgba(80,210,110,0.75)' : 'rgba(255,90,70,0.75)'

  return (
    <div className="inv2-card">
      <div className="inv2-card-hdr" onClick={onToggle}>
        <div className="inv2-av" style={{ background: tc.bg, color: tc.color }}>
          {inv.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="inv2-info">
          <p className="inv2-name">{inv.name}</p>
          <div className="inv2-meta">
            <span className="inv2-bdg" style={{ background: tc.bg, color: tc.color }}>{TYPE_LABELS[inv.type] || inv.type}</span>
            {inv.ticker && <><span className="inv2-dot">·</span><span>{inv.ticker}</span></>}
            {inv.totalQty > 0 && <><span className="inv2-dot">·</span><span>{fmtQty(inv.totalQty)} u.</span></>}
          </div>
        </div>
        <div className="inv2-right" onClick={e => e.stopPropagation()}>
          <div className="inv2-val">
            <p className="inv2-val-v">{fmtEur(curVal)}</p>
            <p className={`inv2-val-pg ${isPos ? 'pos' : 'neg'}`}>{isPos ? '+' : ''}{fmtEur(gain)} {fmtPct(gPct)}</p>
          </div>
          <button className="inv2-del" onClick={onRemove}><TrashIcon size={12} /></button>
        </div>
        <svg className={`inv2-chev${expanded ? ' open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {expanded && (
        <div className="inv2-body">
          {chartData.length >= 2 && (
            <div className="inv2-chart-wrap">
              <div className="inv2-chart-lbl">
                <span className="inv2-chart-txt">Evolució del preu de compra</span>
                {inv.currentPrice != null && (
                  <span className={`inv2-chart-price ${isPos ? 'pos' : 'neg'}`}>{fmtEur(inv.currentPrice)}/u.</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`cg${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPos ? 'rgba(80,210,110,0.18)' : 'rgba(255,90,70,0.15)'} />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="price" stroke={cc} strokeWidth={1.5} fill={`url(#cg${inv.id})`} dot={false} />
                  <Tooltip content={<PriceTip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="inv2-stats">
            <div className="inv2-stat"><p className="inv2-stat-l">Cost mitjà</p><p className="inv2-stat-v">{inv.totalQty > 0 ? fmtEur(inv.avgCost) : '—'}/u.</p></div>
            <div className="inv2-stat"><p className="inv2-stat-l">Accions</p><p className="inv2-stat-v">{fmtQty(inv.totalQty || 0)} u.</p></div>
            <div className="inv2-stat"><p className="inv2-stat-l">Invertit</p><p className="inv2-stat-v">{fmtEur(inv.totalCost || 0)}</p></div>
            <div className="inv2-stat"><p className="inv2-stat-l">P&G</p><p className={`inv2-stat-v ${isPos ? 'pos' : 'neg'}`}>{isPos ? '+' : ''}{fmtEur(gain)}</p></div>
          </div>

          <div className="inv2-quick">
            <button className="inv2-q-btn buy" onClick={() => onOpenTx('buy')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Comprar
            </button>
            <button className="inv2-q-btn sell" onClick={() => onOpenTx('sell')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Vendre
            </button>
            <button className="inv2-q-btn cap" onClick={() => onOpenTx('capital')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Aportació
            </button>
          </div>

          <div className="inv2-txs">
            {(!inv.txs || inv.txs.length === 0) ? (
              <div className="inv2-empty-txs">Cap operació — afegeix la primera compra</div>
            ) : [...inv.txs].reverse().map(tx => {
              const dotColor = tx.type === 'buy' ? 'rgba(80,210,110,0.65)' : tx.type === 'sell' ? 'rgba(255,130,60,0.65)' : 'rgba(100,155,255,0.65)'
              return (
                <div key={tx.id} className="inv2-tx">
                  <div className="inv2-tx-dot" style={{ background: dotColor }} />
                  <div className="inv2-tx-info">
                    <p className="inv2-tx-note">{tx.note || (tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venda' : 'Aportació')}</p>
                    <p className="inv2-tx-date">{tx.date || '—'}</p>
                  </div>
                  <div className="inv2-tx-right">
                    {tx.type !== 'capital' && tx.qty > 0 && (
                      <p className={`inv2-tx-amt ${tx.type === 'buy' ? 'pos' : 'neg'}`}>
                        {tx.type === 'buy' ? '+' : '−'}{fmtQty(tx.qty)} u.
                      </p>
                    )}
                    <p className="inv2-tx-sub">
                      {tx.type === 'capital'
                        ? `+${fmtEur(tx.totalCost)}`
                        : tx.pricePerUnit > 0 ? `${fmtEur(tx.pricePerUnit)}/u. · ${fmtEur(tx.totalCost)}` : fmtEur(tx.totalCost)
                      }
                    </p>
                  </div>
                  <button className="inv2-tx-del" onClick={() => onRemoveTx(tx.id)}><TrashIcon /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// // ── NewInvestmentModal ────────────────────────────────────────────────────────
// function NewInvestmentModal({ onAdd, onClose }) {
//   const [form, setForm] = useState({ name: '', ticker: '', type: 'etf' })
//   const [error, setError] = useState('')
//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
//   const TYPES = [{ id: 'etf', label: 'ETF' }, { id: 'stock', label: 'Acció' }, { id: 'robo', label: 'Robo' }, { id: 'efectiu', label: 'Efectiu' }]
//   const submit = () => {
//     if (!form.name.trim()) return setError('El nom és obligatori')
//     setError('')
//     onAdd({ name: form.name.trim(), ticker: form.ticker.trim().toUpperCase(), type: form.type })
//   }
//   return (
//     <div className="inv2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
//       <div className="inv2-modal">
//         <div className="inv2-modal-hdr"><h3 className="inv2-modal-title">Nova posició</h3><button className="inv2-modal-x" onClick={onClose}>×</button></div>
//         <div className="inv2-fgroup">
//           <div>
//             <label className="inv2-lbl">Tipus</label>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
//               {TYPES.map(t => (
//                 <button key={t.id} onClick={() => set('type', t.id)} style={{ padding: '8px 4px', borderRadius: 5, cursor: 'pointer', textAlign: 'center', fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500, border: form.type === t.id ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.07)', background: form.type === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: form.type === t.id ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.34)', transition: 'all 100ms' }}>{t.label}</button>
//               ))}
//             </div>
//           </div>
//           <div><label className="inv2-lbl">Nom</label><input className="inv2-inp" autoFocus value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: iShares Core MSCI World" /></div>
//           <div><label className="inv2-lbl">Ticker (Yahoo Finance)</label><input className="inv2-inp mono" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} placeholder="ex: IWDA.AS" /></div>
//           {error && <p className="inv2-error">{error}</p>}
//         </div>
//         <div className="inv2-mfooter"><button className="inv2-btn-cancel" onClick={onClose}>Cancel·lar</button><button className="inv2-btn-ok def" onClick={submit}>Crear posició</button></div>
//       </div>
//     </div>
//   )
// }

// ── TransactionModal ──────────────────────────────────────────────────────────
function TransactionModal({ invName, defaultType, onAdd, onClose }) {
  const [type, setType]   = useState(defaultType || 'buy')
  const [qty, setQty]     = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState('')
  const [note, setNote]   = useState('')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const isBuySell = type === 'buy' || type === 'sell'

  const handleQty   = v => { setQty(v);   if (v && price) setTotal((parseFloat(v) * parseFloat(price)).toFixed(2)) }
  const handlePrice = v => { setPrice(v); if (v && qty)   setTotal((parseFloat(qty) * parseFloat(v)).toFixed(2))   }

  const submit = () => {
    const t = parseFloat(total)
    if (!t || t <= 0) return setError("L'import és obligatori")
    if (isBuySell) {
      const q = parseFloat(qty)
      if (!q || q <= 0) return setError('La quantitat és obligatòria')
      setError('')
      onAdd({ qty: q, pricePerUnit: parseFloat(price) || (t / q), totalCost: t, type, note, date })
    } else {
      setError('')
      onAdd({ qty: 0, pricePerUnit: 0, totalCost: t, type, note, date })
    }
  }

  return (
    <div className="inv2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="inv2-modal">
        <div className="inv2-modal-hdr"><h3 className="inv2-modal-title">{invName}</h3><button className="inv2-modal-x" onClick={onClose}>×</button></div>
        <div className="inv2-type-row">
          <button className={`inv2-type-tab${type === 'buy' ? ' grn' : ''}`} onClick={() => setType('buy')}>↑ Compra</button>
          <button className={`inv2-type-tab${type === 'sell' ? ' org' : ''}`} onClick={() => setType('sell')}>↓ Venda</button>
          <button className={`inv2-type-tab${type === 'capital' ? ' blu' : ''}`} onClick={() => setType('capital')}>+ Aportació</button>
        </div>
        <div className="inv2-fgroup">
          {isBuySell && (
            <div className="inv2-grid2">
              <div><label className="inv2-lbl">Accions / participacions</label><input type="number" step="any" className="inv2-inp mono" autoFocus value={qty} onChange={e => handleQty(e.target.value)} placeholder="0" /></div>
              <div><label className="inv2-lbl">Preu per unitat (€)</label><input type="number" step="any" className="inv2-inp mono" value={price} onChange={e => handlePrice(e.target.value)} placeholder="0.00" /></div>
            </div>
          )}
          <div><label className="inv2-lbl">{isBuySell ? 'Total operació (€)' : 'Import (€)'}</label><input type="number" step="any" className={`inv2-inp mono${!isBuySell ? ' big' : ''}`} autoFocus={!isBuySell} value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00" /></div>
          <div className="inv2-grid2">
            <div><label className="inv2-lbl">Data</label><input type="date" className="inv2-inp" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className="inv2-lbl">Nota</label><input className="inv2-inp" value={note} onChange={e => setNote(e.target.value)} placeholder="opcional" /></div>
          </div>
          {error && <p className="inv2-error">{error}</p>}
        </div>
        <div className="inv2-mfooter">
          <button className="inv2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`inv2-btn-ok ${type === 'buy' ? 'grn' : type === 'sell' ? 'org' : 'blu'}`} onClick={submit}>
            {type === 'buy' ? 'Registrar compra' : type === 'sell' ? 'Registrar venda' : 'Afegir aportació'}
          </button>
        </div>
      </div>
    </div>
  )
}