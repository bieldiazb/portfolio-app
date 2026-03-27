import { useState, useMemo, useEffect } from 'react'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

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
  { bg: 'rgba(255,160,60,0.12)',  color: 'rgba(255,170,70,0.85)'  },
  { bg: 'rgba(100,130,255,0.12)', color: 'rgba(120,150,255,0.85)' },
  { bg: 'rgba(80,200,120,0.12)',  color: 'rgba(80,210,120,0.85)'  },
  { bg: 'rgba(0,180,220,0.12)',   color: 'rgba(0,200,240,0.85)'   },
  { bg: 'rgba(180,120,255,0.12)', color: 'rgba(180,130,255,0.85)' },
  { bg: 'rgba(255,100,120,0.12)', color: 'rgba(255,110,130,0.85)' },
]
const getCryptoColor = symbol => {
  const map = { BTC: 0, ETH: 1, SOL: 2, XRP: 3, ADA: 4, AVAX: 5, DOT: 0, LINK: 1 }
  return CRYPTO_COLORS[map[symbol] ?? (symbol?.charCodeAt(0) % CRYPTO_COLORS.length)] || CRYPTO_COLORS[0]
}

function fmtQty(n) {
  if (!n) return '0'
  return parseFloat(n.toFixed(8)).toString()
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
  .cr2 { font-family:'Geist',sans-serif; display:flex; flex-direction:column; gap:10px; }
  .cr2-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; }
  .cr2-title { font-size:14px; font-weight:500; color:rgba(255,255,255,0.72); letter-spacing:-0.2px; }
  .cr2-sub { font-size:11px; color:rgba(255,255,255,0.26); margin-top:3px; font-family:'Geist Mono',monospace; }
  .cr2-btns { display:flex; gap:6px; align-items:center; }
  .cr2-btn-add { display:flex; align-items:center; gap:4px; padding:0 11px; height:28px; background:rgba(255,255,255,0.92); color:#080808; border:none; border-radius:5px; font-family:'Geist',sans-serif; font-size:12px; font-weight:500; cursor:pointer; white-space:nowrap; flex-shrink:0; -webkit-tap-highlight-color:transparent; }
  .cr2-btn-add:hover { background:#fff; }
  .cr2-btn-ico { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.08); background:transparent; border-radius:5px; color:rgba(255,255,255,0.32); cursor:pointer; flex-shrink:0; }
  .cr2-sort-btn { display:flex; align-items:center; gap:3px; padding:0 7px; height:24px; border:1px solid rgba(255,255,255,0.08); background:transparent; border-radius:4px; font-family:'Geist',sans-serif; font-size:10px; color:rgba(255,255,255,0.32); cursor:pointer; transition:all 100ms; white-space:nowrap; flex-shrink:0; }
  .cr2-sort-btn.on { border-color:rgba(255,255,255,0.16); color:rgba(255,255,255,0.62); }
  .cr2-sort-arrow { display:inline-block; transition:transform 150ms; font-style:normal; }
  .cr2-sort-arrow.asc { transform:rotate(180deg); }
  .cr2-card { border:1px solid rgba(255,255,255,0.07); border-radius:8px; background:rgba(255,255,255,0.015); overflow:hidden; }
  .cr2-card-hdr { display:flex; align-items:center; padding:12px 14px; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .cr2-card-hdr:active { background:rgba(255,255,255,0.03); }
  @media (hover:hover) { .cr2-card-hdr:hover { background:rgba(255,255,255,0.025); } }
  .cr2-av { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; margin-right:10px; }
  .cr2-info { flex:1; min-width:0; }
  .cr2-name { font-size:13px; font-weight:500; color:rgba(255,255,255,0.80); }
  .cr2-meta { font-size:10px; color:rgba(255,255,255,0.28); margin-top:2px; display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
  .cr2-bdg { font-size:9px; font-weight:600; padding:1px 5px; border-radius:3px; }
  .cr2-dot { font-size:9px; color:rgba(255,255,255,0.14); }
  .cr2-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .cr2-val { text-align:right; }
  .cr2-val-v { font-size:14px; font-weight:500; font-family:'Geist Mono',monospace; letter-spacing:-0.4px; color:rgba(255,255,255,0.82); }
  .cr2-val-pg { font-size:10px; font-family:'Geist Mono',monospace; margin-top:1px; }
  .pos { color:rgba(80,210,110,0.80); }
  .neg { color:rgba(255,90,70,0.80); }
  .cr2-del { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:none; border-radius:5px; cursor:pointer; transition:all 80ms; background:rgba(255,255,255,0.05); color:rgba(220,70,55,0.55); flex-shrink:0; -webkit-tap-highlight-color:transparent; }
  .cr2-del:active { transform:scale(0.88); }
  @media (hover:hover) and (pointer:fine) { .cr2-del { background:transparent; color:rgba(255,255,255,0.18); } .cr2-del:hover { background:rgba(200,40,30,0.10); color:rgba(220,70,55,0.80); } }
  .cr2-chev { color:rgba(255,255,255,0.18); transition:transform 220ms; flex-shrink:0; margin-left:4px; }
  .cr2-chev.open { transform:rotate(180deg); }
  .cr2-body { border-top:1px solid rgba(255,255,255,0.06); }
  .cr2-chart-wrap { padding:12px 14px 4px; }
  .cr2-chart-lbl { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; font-size:10px; }
  .cr2-chart-txt { color:rgba(255,255,255,0.26); }
  .cr2-chart-price { font-family:'Geist Mono',monospace; }
  .cr2-stats { display:flex; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .cr2-stat { flex:1; position:relative; padding-right:10px; }
  .cr2-stat:not(:last-child)::after { content:''; position:absolute; right:5px; top:0; height:100%; width:1px; background:rgba(255,255,255,0.06); }
  .cr2-stat-l { font-size:9px; color:rgba(255,255,255,0.24); margin-bottom:3px; text-transform:uppercase; letter-spacing:0.06em; }
  .cr2-stat-v { font-size:11px; font-family:'Geist Mono',monospace; color:rgba(255,255,255,0.65); letter-spacing:-0.3px; }
  .cr2-quick { display:flex; gap:6px; padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .cr2-q-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:5px; padding:7px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); background:transparent; font-family:'Geist',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; -webkit-tap-highlight-color:transparent; }
  .cr2-q-btn.buy { color:rgba(80,210,110,0.80); }
  .cr2-q-btn.buy:hover { background:rgba(80,210,110,0.07); border-color:rgba(80,210,110,0.22); }
  .cr2-q-btn.sell { color:rgba(255,160,50,0.80); }
  .cr2-q-btn.sell:hover { background:rgba(255,160,50,0.07); border-color:rgba(255,160,50,0.22); }
  .cr2-q-btn:active { transform:scale(0.97); }
  .cr2-txs { max-height:200px; overflow-y:auto; }
  .cr2-tx { display:flex; align-items:center; padding:7px 14px; border-bottom:1px solid rgba(255,255,255,0.03); }
  .cr2-tx:last-child { border-bottom:none; }
  .cr2-tx-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-right:9px; }
  .cr2-tx-info { flex:1; min-width:0; }
  .cr2-tx-note { font-size:12px; color:rgba(255,255,255,0.60); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cr2-tx-date { font-size:10px; color:rgba(255,255,255,0.22); margin-top:1px; }
  .cr2-tx-right { text-align:right; flex-shrink:0; margin-left:8px; }
  .cr2-tx-amt { font-size:12px; font-family:'Geist Mono',monospace; letter-spacing:-0.3px; }
  .cr2-tx-sub { font-size:10px; color:rgba(255,255,255,0.26); font-family:'Geist Mono',monospace; margin-top:1px; }
  .cr2-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:4px; cursor:pointer; color:rgba(255,255,255,0.14); margin-left:4px; flex-shrink:0; -webkit-tap-highlight-color:transparent; }
  .cr2-tx-del:hover { color:rgba(220,70,55,0.70); background:rgba(200,40,30,0.08); }
  .cr2-empty-txs { padding:16px 14px; text-align:center; font-size:11px; color:rgba(255,255,255,0.20); }
  .cr2-empty { padding:48px 0; text-align:center; font-size:12px; color:rgba(255,255,255,0.22); }
  .cr2-empty-sub { font-size:10px; color:rgba(255,255,255,0.14); margin-top:4px; }
  .cr2-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
  .cr2-modal { background:#111; border:1px solid rgba(255,255,255,0.09); border-radius:12px; width:100%; max-width:440px; padding:22px 20px 26px; font-family:'Geist',sans-serif; max-height:90vh; overflow-y:auto; }
  .cr2-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
  .cr2-modal-title { font-size:15px; font-weight:500; color:rgba(255,255,255,0.85); letter-spacing:-0.3px; }
  .cr2-modal-x { width:26px; height:26px; border-radius:5px; background:rgba(255,255,255,0.06); border:none; color:rgba(255,255,255,0.40); font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:inherit; }
  .cr2-lbl { display:block; font-size:10px; color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:5px; }
  .cr2-inp { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:5px; padding:9px 11px; font-family:'Geist',sans-serif; font-size:16px; color:rgba(255,255,255,0.82); outline:none; box-sizing:border-box; transition:border-color 100ms; touch-action:manipulation; }
  .cr2-inp:focus { border-color:rgba(255,255,255,0.20); }
  .cr2-inp::placeholder { color:rgba(255,255,255,0.18); }
  .cr2-inp.mono { font-family:'Geist Mono',monospace; text-align:right; }
  .cr2-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; align-items:end; }
  .cr2-fgroup { display:flex; flex-direction:column; gap:11px; }
  .cr2-mfooter { display:flex; gap:8px; margin-top:18px; }
  .cr2-btn-cancel { flex:1; padding:11px; border:1px solid rgba(255,255,255,0.08); background:transparent; border-radius:6px; font-family:'Geist',sans-serif; font-size:13px; color:rgba(255,255,255,0.36); cursor:pointer; }
  .cr2-btn-ok { flex:1; padding:11px; border:none; border-radius:6px; font-family:'Geist',sans-serif; font-size:13px; font-weight:500; cursor:pointer; }
  .cr2-btn-ok.def { background:rgba(255,255,255,0.92); color:#080808; }
  .cr2-btn-ok.grn { background:rgba(60,200,100,0.85); color:#080808; }
  .cr2-btn-ok.org { background:rgba(245,160,50,0.85); color:#080808; }
  .cr2-error { font-size:12px; color:rgba(255,80,60,0.80); background:rgba(255,50,30,0.08); border:1px solid rgba(255,50,30,0.14); border-radius:5px; padding:8px 11px; }
  .cr2-type-row { display:flex; border:1px solid rgba(255,255,255,0.08); border-radius:6px; overflow:hidden; margin-bottom:14px; }
  .cr2-type-tab { flex:1; padding:9px; border:none; background:transparent; font-family:'Geist',sans-serif; font-size:12px; cursor:pointer; transition:all 100ms; color:rgba(255,255,255,0.34); }
  .cr2-type-tab.grn { background:rgba(60,200,100,0.12); color:rgba(80,210,110,0.85); }
  .cr2-type-tab.org { background:rgba(245,160,50,0.12); color:rgba(255,160,50,0.85); }
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

function currentValue(c) {
  const qty = c.totalQty ?? c.qty ?? 0
  if (c.currentPrice != null && qty > 0) return qty * c.currentPrice
  return c.totalCost || c.initialValue || 0
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CryptoPage({ cryptos, onAdd, onRemove, onUpdate, onRefresh, onAddTransaction, onRemoveTransaction }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalValue = cryptos.reduce((s, c) => s + currentValue(c), 0)
  const totalCost  = cryptos.reduce((s, c) => s + (c.totalCost || c.initialValue || 0), 0)
  const totalGain  = totalValue - totalCost

  const sorted = [...cryptos].sort((a, b) =>
    sortDir === 'desc' ? currentValue(b) - currentValue(a) : currentValue(a) - currentValue(b)
  )

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  return (
    <div className="cr2">
      <style>{styles}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      <div className="cr2-hdr">
        <div>
          <h2 className="cr2-title">Criptomonedes</h2>
          <p className="cr2-sub">
            {fmtEur(totalValue)}
            {totalCost > 0 && (
              <span style={{ color: totalGain >= 0 ? 'rgba(80,210,110,0.60)' : 'rgba(255,90,70,0.60)', marginLeft: 6 }}>
                · {totalGain >= 0 ? '+' : ''}{fmtEur(totalGain)} ({fmtPct(totalCost > 0 ? (totalGain / totalCost) * 100 : 0)})
              </span>
            )}
          </p>
        </div>
        <div className="cr2-btns">
          {onRefresh && (
            <button className="cr2-btn-ico" onClick={onRefresh}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          )}
          <button className={`cr2-sort-btn${sorted.length > 1 ? ' on' : ''}`} onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
            <i className={`cr2-sort-arrow${sortDir === 'asc' ? ' asc' : ''}`}>↓</i>
          </button>
          <button className="cr2-btn-add" onClick={() => setShowNew(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova crypto
          </button>
        </div>
      </div>

      {cryptos.length === 0 ? (
        <div className="cr2-empty">
          <p>Cap criptomoneda registrada</p>
          <p className="cr2-empty-sub">Afegeix la teva primera posició</p>
        </div>
      ) : sorted.map(c => (
        <CryptoCard key={c.id} c={c}
          expanded={!!expanded[c.id]}
          onToggle={() => toggle(c.id)}
          onRemove={() => askConfirm({ name: c.name, onConfirm: () => onRemove(c.id) })}
          onOpenTx={type => setTxModal({ cryptoId: c.id, name: c.name, symbol: c.symbol, coinId: c.coinId, type })}
          onRemoveTx={txId => onRemoveTransaction ? onRemoveTransaction(c.id, txId) : null}
        />
      ))}

      {showNew && <NewCryptoModal onAdd={d => { onAdd(d); setShowNew(false) }} onClose={() => setShowNew(false)} />}
      {txModal && (
        <TxModal
          name={txModal.name} symbol={txModal.symbol} coinId={txModal.coinId}
          defaultType={txModal.type}
          onAdd={tx => { if (onAddTransaction) onAddTransaction(txModal.cryptoId, tx); setTxModal(null) }}
          onClose={() => setTxModal(null)}
        />
      )}
    </div>
  )
}

function CryptoCard({ c, expanded, onToggle, onRemove, onOpenTx, onRemoveTx }) {
  const tc    = getCryptoColor(c.symbol)
  const qty   = c.totalQty ?? c.qty ?? 0
  const curVal = currentValue(c)
  const cost  = c.totalCost || c.initialValue || 0
  const gain  = curVal - cost
  const gPct  = cost > 0 ? (gain / cost) * 100 : 0
  const isPos = gain >= 0

  const chartData = useMemo(() => {
    const pts = (c.txs || [])
      .filter(t => t.type === 'buy' && t.pricePerUnit > 0)
      .map((t, i) => ({ i, price: t.pricePerUnit }))
    if (c.currentPrice != null) pts.push({ i: pts.length, price: c.currentPrice })
    return pts
  }, [c.txs, c.currentPrice])

  return (
    <div className="cr2-card">
      <div className="cr2-card-hdr" onClick={onToggle}>
        <div className="cr2-av" style={{ background: tc.bg, color: tc.color }}>
          {c.symbol?.slice(0, 3) || c.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="cr2-info">
          <p className="cr2-name">{c.name}</p>
          <div className="cr2-meta">
            <span className="cr2-bdg" style={{ background: tc.bg, color: tc.color }}>{c.symbol}</span>
            {qty > 0 && <><span className="cr2-dot">·</span><span>{fmtQty(qty)} u.</span></>}
            {c.currentPrice != null && <><span className="cr2-dot">·</span><span style={{ fontFamily: "'Geist Mono',monospace" }}>{fmtEur(c.currentPrice)}/u.</span></>}
          </div>
        </div>
        <div className="cr2-right" onClick={e => e.stopPropagation()}>
          <div className="cr2-val">
            <p className="cr2-val-v">{fmtEur(curVal)}</p>
            <p className={`cr2-val-pg ${isPos ? 'pos' : 'neg'}`}>{isPos ? '+' : ''}{fmtEur(gain)} {fmtPct(gPct)}</p>
          </div>
          <button className="cr2-del" onClick={onRemove}><TrashIcon size={12} /></button>
        </div>
        <svg className={`cr2-chev${expanded ? ' open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {expanded && (
        <div className="cr2-body">
          {chartData.length >= 2 && (
            <div className="cr2-chart-wrap">
              <div className="cr2-chart-lbl">
                <span className="cr2-chart-txt">Evolució del preu de compra</span>
                {c.currentPrice != null && (
                  <span className={`cr2-chart-price ${isPos ? 'pos' : 'neg'}`}>{fmtEur(c.currentPrice)}/u.</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={68}>
                <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`ccg${c.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPos ? 'rgba(80,210,110,0.18)' : 'rgba(255,90,70,0.15)'} />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="price" stroke={isPos ? 'rgba(80,210,110,0.75)' : 'rgba(255,90,70,0.75)'} strokeWidth={1.5} fill={`url(#ccg${c.id})`} dot={false} />
                  <Tooltip content={<PriceTip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="cr2-stats">
            <div className="cr2-stat"><p className="cr2-stat-l">Cost mitjà</p><p className="cr2-stat-v">{qty > 0 && c.avgCost ? fmtEur(c.avgCost) : '—'}/u.</p></div>
            <div className="cr2-stat"><p className="cr2-stat-l">Quantitat</p><p className="cr2-stat-v">{fmtQty(qty)}</p></div>
            <div className="cr2-stat"><p className="cr2-stat-l">Invertit</p><p className="cr2-stat-v">{fmtEur(cost)}</p></div>
            <div className="cr2-stat"><p className="cr2-stat-l">P&G</p><p className={`cr2-stat-v ${isPos ? 'pos' : 'neg'}`}>{isPos ? '+' : ''}{fmtEur(gain)}</p></div>
          </div>

          <div className="cr2-quick">
            <button className="cr2-q-btn buy" onClick={() => onOpenTx('buy')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Comprar
            </button>
            <button className="cr2-q-btn sell" onClick={() => onOpenTx('sell')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Vendre
            </button>
          </div>

          <div className="cr2-txs">
            {(!c.txs || c.txs.length === 0) ? (
              <div className="cr2-empty-txs">Cap operació — afegeix la primera compra</div>
            ) : [...c.txs].reverse().map(tx => (
              <div key={tx.id} className="cr2-tx">
                <div className="cr2-tx-dot" style={{ background: tx.type === 'buy' ? 'rgba(80,210,110,0.65)' : 'rgba(255,130,60,0.65)' }} />
                <div className="cr2-tx-info">
                  <p className="cr2-tx-note">{tx.note || (tx.type === 'buy' ? 'Compra' : 'Venda')}</p>
                  <p className="cr2-tx-date">{tx.date || '—'}</p>
                </div>
                <div className="cr2-tx-right">
                  <p className={`cr2-tx-amt ${tx.type === 'buy' ? 'pos' : 'neg'}`}>
                    {tx.type === 'buy' ? '+' : '−'}{fmtQty(tx.qty)} u.
                  </p>
                  <p className="cr2-tx-sub">
                    {tx.pricePerUnit > 0 ? `${fmtEur(tx.pricePerUnit)}/u. · ${fmtEur(tx.totalCost)}` : fmtEur(tx.totalCost)}
                  </p>
                </div>
                {onRemoveTx && <button className="cr2-tx-del" onClick={() => onRemoveTx(tx.id)}><TrashIcon /></button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NewCryptoModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', symbol: '', coinId: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const selectPopular = p => setForm({ name: p.name, symbol: p.symbol, coinId: p.coinId })

  return (
    <div className="cr2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cr2-modal">
        <div className="cr2-modal-hdr">
          <h3 className="cr2-modal-title">Nova criptomoneda</h3>
          <button className="cr2-modal-x" onClick={onClose}>×</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="cr2-lbl">Populars</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {POPULAR.map(p => (
              <button key={p.coinId} onClick={() => selectPopular(p)} style={{
                padding: '7px 4px', borderRadius: 5, cursor: 'pointer', textAlign: 'center',
                fontFamily: "'Geist Mono',monospace", fontSize: 11, fontWeight: 600,
                border: form.coinId === p.coinId ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.07)',
                background: form.coinId === p.coinId ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: form.coinId === p.coinId ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.34)',
                transition: 'all 100ms',
              }}>{p.symbol}</button>
            ))}
          </div>
        </div>
        <div className="cr2-fgroup">
          <div className="cr2-grid2">
            <div><label className="cr2-lbl">Nom</label><input className="cr2-inp" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Bitcoin" /></div>
            <div><label className="cr2-lbl">Símbol</label><input className="cr2-inp mono" value={form.symbol} onChange={e => set('symbol', e.target.value.toUpperCase())} placeholder="BTC" /></div>
          </div>
          <div>
            <label className="cr2-lbl">CoinGecko ID</label>
            <input className="cr2-inp mono" value={form.coinId} onChange={e => set('coinId', e.target.value.toLowerCase())} placeholder="bitcoin" />
          </div>
        </div>
        <p style={{ fontSize: 10, color: 'rgba(100,155,255,0.60)', marginTop: 10, lineHeight: 1.5 }}>
          Un cop creada, usa el botó <strong style={{ color: 'rgba(80,210,110,0.70)' }}>Comprar</strong> per registrar les teves operacions.
        </p>
        <div className="cr2-mfooter">
          <button className="cr2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="cr2-btn-ok def" onClick={() => {
            if (!form.name.trim() || !form.symbol.trim()) return
            onAdd({ name: form.name.trim(), symbol: form.symbol, coinId: form.coinId })
          }}>Crear posició</button>
        </div>
      </div>
    </div>
  )
}

function TxModal({ name, symbol, coinId, defaultType, onAdd, onClose }) {
  const [type, setType]   = useState(defaultType || 'buy')
  const [qty, setQty]     = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState('')
  const [note, setNote]   = useState('')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [livePrice, setLivePrice]   = useState(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!coinId) return
    setFetchingPrice(true)
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur`, { signal: AbortSignal.timeout(6000) })
      .then(r => r.json())
      .then(d => { const p = d?.[coinId]?.eur; if (p) setLivePrice(+p.toFixed(6)) })
      .catch(() => {})
      .finally(() => setFetchingPrice(false))
  }, [coinId])

  const recalc = (q, p) => { const t = parseFloat(q) * parseFloat(p); if (!isNaN(t) && t > 0) setTotal(t.toFixed(2)) }
  const handleQty   = v => { setQty(v);   if (v && price) recalc(v, price) }
  const handlePrice = v => { setPrice(v); if (v && qty)   recalc(qty, v) }
  const fillLive = () => { if (!livePrice) return; setPrice(livePrice.toString()); if (qty) recalc(qty, livePrice) }

  const submit = () => {
    const q = parseFloat(qty), t = parseFloat(total)
    if (!q || q <= 0) return setError('La quantitat és obligatòria')
    if (!t || t <= 0) return setError("L'import és obligatori")
    setError('')
    onAdd({ qty: q, pricePerUnit: parseFloat(price) || (t / q), totalCost: t, type, note, date })
  }

  return (
    <div className="cr2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cr2-modal">
        <div className="cr2-modal-hdr">
          <h3 className="cr2-modal-title">
            {name} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Geist Mono',monospace" }}>{symbol}</span>
          </h3>
          <button className="cr2-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="cr2-type-row">
          <button className={`cr2-type-tab${type === 'buy' ? ' grn' : ''}`} onClick={() => setType('buy')}>↑ Compra</button>
          <button className={`cr2-type-tab${type === 'sell' ? ' org' : ''}`} onClick={() => setType('sell')}>↓ Venda</button>
        </div>
        <div className="cr2-fgroup">
          <div className="cr2-grid2">
            <div>
              <label className="cr2-lbl">Quantitat ({symbol})</label>
              <input type="number" inputMode="decimal" step="any" className="cr2-inp mono"
                autoFocus value={qty} onChange={e => handleQty(e.target.value)} placeholder="0.00000" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <label className="cr2-lbl" style={{ margin: 0 }}>Preu/u (€)</label>
                <button onClick={fillLive} disabled={fetchingPrice || !livePrice} style={{
                  fontSize: 9, fontWeight: 500, padding: '2px 7px', borderRadius: 3,
                  cursor: livePrice ? 'pointer' : 'default',
                  border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)',
                  color: livePrice ? 'rgba(80,210,110,0.80)' : 'rgba(255,255,255,0.22)',
                  fontFamily: "'Geist Mono',monospace", transition: 'all 100ms',
                }}>
                  {fetchingPrice ? '...' : livePrice ? `↓ ${fmtEur(livePrice)}` : '—'}
                </button>
              </div>
              <input type="number" inputMode="decimal" step="any" className="cr2-inp mono"
                value={price} onChange={e => handlePrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="cr2-lbl">Total (€)</label>
            <input type="number" inputMode="decimal" step="any" className="cr2-inp mono"
              value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00" />
          </div>
          <div className="cr2-grid2">
            <div><label className="cr2-lbl">Data</label><input type="date" className="cr2-inp" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className="cr2-lbl">Nota</label><input className="cr2-inp" value={note} onChange={e => setNote(e.target.value)} placeholder="opcional" /></div>
          </div>
          {error && <p className="cr2-error">{error}</p>}
        </div>
        <div className="cr2-mfooter">
          <button className="cr2-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`cr2-btn-ok ${type === 'buy' ? 'grn' : 'org'}`} onClick={submit}>
            {type === 'buy' ? 'Registrar compra' : 'Registrar venda'}
          </button>
        </div>
      </div>
    </div>
  )
}