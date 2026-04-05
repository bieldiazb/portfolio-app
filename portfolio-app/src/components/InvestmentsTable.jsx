import { useState, useMemo, useEffect, useCallback } from 'react'
import AddInvestmentModal from './AddInvestmentModal'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'
import ImportCSVModal from './Importcsvmodal.jsx'

const TYPE_LABELS = { etf:'ETF', stock:'Acció', robo:'Robo', estalvi:'Estalvi', efectiu:'Efectiu' }
const CURR_SYM    = { EUR:'€', USD:'$', GBP:'£', CHF:'Fr' }

const styles = `
  .inv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  /* ── Hero ── */
  .inv-hero {
    background: linear-gradient(135deg, #0f0f0f 0%, #141414 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 20px; margin-bottom: 12px;
    position: relative; overflow: hidden;
  }
  .inv-hero::before {
    content:''; position:absolute; top:-60px; right:-60px;
    width:220px; height:220px; border-radius:50%;
    background: radial-gradient(circle, rgba(123,97,255,0.07) 0%, transparent 70%);
    pointer-events:none;
  }
  .inv-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .inv-hero-total { font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:12px; }
  .inv-hero-total span { font-size:30px; opacity:0.7; }
  .inv-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .inv-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; font-family:${FONTS.mono}; padding:4px 10px; border-radius:20px; }
  .inv-hero-badge.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .inv-hero-badge.neg { color:${COLORS.neonRed}; background:rgba(255,59,59,0.10); border:1px solid rgba(255,59,59,0.20); }
  .inv-hero-sub { font-size:11px; color:rgba(255,255,255,0.25); font-family:${FONTS.mono}; }

  /* ── Mètriques ── */
  .inv-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
  .inv-metric {
    background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px;
    padding:12px 14px; display:flex; flex-direction:column; gap:4px;
  }
  .inv-metric-label { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; }
  .inv-metric-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
  .inv-metric-val.g { color:${COLORS.neonGreen}; }
  .inv-metric-val.r { color:${COLORS.neonRed}; }
  .inv-metric-val.p { color:${COLORS.neonPurple}; }
  .inv-metric-sub { font-size:10px; font-family:${FONTS.mono}; color:rgba(255,255,255,0.25); }

  /* ── Botons capçalera ── */
  .inv-actions { display:flex; gap:6px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
  .inv-btn-ico { width:30px; height:30px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; flex-shrink:0; }
  .inv-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .inv-btn-import { display:flex; align-items:center; gap:5px; padding:7px 13px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; white-space:nowrap; margin-left:auto; }
  .inv-btn-import:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .inv-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:${COLORS.neonPurple}; color:#fff; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; cursor:pointer; transition:opacity 100ms; white-space:nowrap; }
  .inv-btn-add:hover { opacity:0.85; }

  /* ── Secció títol ── */
  .inv-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .inv-section-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  /* ── Cards d'actiu (mòbil i desktop) ── */
  .inv-cards { display:flex; flex-direction:column; gap:0; background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }

  .inv-card { border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 80ms; -webkit-tap-highlight-color:transparent; }
  .inv-card:last-child { border-bottom:none; }
  .inv-card:active { background:rgba(255,255,255,0.02); }

  .inv-card-main { display:flex; align-items:center; gap:12px; padding:14px; }
  .inv-av { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .inv-card-info { flex:1; min-width:0; }
  .inv-card-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .inv-card-meta { display:flex; align-items:center; gap:5px; }
  .inv-type-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; padding:1px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.06em; }
  .inv-ticker { font-size:10px; color:rgba(255,255,255,0.30); font-family:${FONTS.mono}; }
  .inv-curr-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; padding:1px 5px; border-radius:3px; color:${COLORS.neonAmber}; background:${COLORS.bgAmber}; }

  .inv-card-right { text-align:right; flex-shrink:0; }
  .inv-card-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .inv-card-pct { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .inv-card-pct.pos { color:${COLORS.neonGreen}; }
  .inv-card-pct.neg { color:${COLORS.neonRed}; }
  .inv-card-chevron { color:rgba(255,255,255,0.20); margin-left:6px; flex-shrink:0; transition:transform 200ms; }
  .inv-card-chevron.open { transform:rotate(180deg); }

  /* ── Expanded panel ── */
  .inv-expand { border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.015); }
  .inv-expand-inner { padding:16px 14px; }

  .inv-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:14px; }
  .inv-stat { position:relative; padding-right:12px; }
  .inv-stat:not(:last-child)::after { content:''; position:absolute; right:6px; top:2px; height:calc(100% - 4px); width:1px; background:rgba(255,255,255,0.06); }
  .inv-stat-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); margin-bottom:5px; text-transform:uppercase; letter-spacing:0.10em; }
  .inv-stat-v { font-size:13px; font-family:${FONTS.mono}; color:#fff; font-weight:500; font-variant-numeric:tabular-nums; }
  .inv-stat-v.pos { color:${COLORS.neonGreen}; }
  .inv-stat-v.neg { color:${COLORS.neonRed}; }

  .inv-expand-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .inv-expand-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:transparent; border:1px solid ${COLORS.border}; border-radius:5px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; white-space:nowrap; }

  .inv-tx-list { display:flex; flex-direction:column; gap:0; }
  .inv-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .inv-tx:last-child { border-bottom:none; }
  .inv-tx-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-right:10px; }
  .inv-tx-name { font-size:12px; font-weight:500; color:rgba(255,255,255,0.60); margin-bottom:2px; }
  .inv-tx-date { font-size:10px; color:rgba(255,255,255,0.25); }
  .inv-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:rgba(255,255,255,0.20); margin-left:8px; flex-shrink:0; transition:all 80ms; }
  .inv-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* ── Barra de distribució ── */
  .inv-distrib { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px; margin-bottom:12px; }
  .inv-distrib-bar { display:flex; height:6px; border-radius:3px; overflow:hidden; gap:1px; margin-bottom:10px; }
  .inv-distrib-seg { height:100%; border-radius:2px; transition:flex 500ms; }
  .inv-distrib-legend { display:flex; flex-wrap:wrap; gap:10px; }
  .inv-distrib-item { display:flex; align-items:center; gap:5px; }
  .inv-distrib-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .inv-distrib-lbl { font-size:10px; color:rgba(255,255,255,0.45); font-family:${FONTS.mono}; }

  /* ── Empty ── */
  .inv-empty { padding:48px 0; text-align:center; }
  .inv-empty-main { font-size:14px; color:rgba(255,255,255,0.30); font-weight:500; margin-bottom:4px; }
  .inv-empty-sub { font-size:12px; color:rgba(255,255,255,0.15); }

  /* ── Modals ── */
  .inv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
  @media (min-width:640px) { .inv-overlay { align-items:center; padding:16px; } }
  .inv-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:12px 12px 0 0; width:100%; padding:20px 16px 36px; font-family:${FONTS.sans}; max-height:92dvh; overflow-y:auto; }
  @media (min-width:640px) { .inv-modal { border-radius:10px; max-width:420px; padding:24px 20px; } }
  .inv-modal-drag { width:36px; height:4px; border-radius:2px; background:${COLORS.border}; margin:0 auto 18px; display:block; }
  @media (min-width:640px) { .inv-modal-drag { display:none; } }
  .inv-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .inv-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .inv-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .inv-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .inv-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .inv-inp:focus { border-color:${COLORS.neonPurple}; }
  .inv-inp::placeholder { color:${COLORS.textMuted}; }
  .inv-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .inv-inp.big { font-size:20px; padding:12px 14px; }
  .inv-sel { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; cursor:pointer; -webkit-appearance:none; }
  .inv-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }
  .inv-fgroup { display:flex; flex-direction:column; gap:14px; }
  .inv-mfooter { display:flex; gap:8px; margin-top:20px; }
  .inv-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; }
  .inv-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; }
  .inv-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .inv-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .inv-btn-ok.blu { background:${COLORS.neonPurple}; color:#fff; }
  .inv-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }
  .inv-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; margin-bottom:16px; }
  .inv-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; color:${COLORS.textMuted}; }
  .inv-type-tab.grn { background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; }
  .inv-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; }
  .inv-type-tab.blu { background:${COLORS.bgPurple}; color:${COLORS.neonPurple}; }
`

const DISTRIB_COLORS = [
  COLORS.neonPurple, COLORS.neonGreen, COLORS.neonCyan,
  COLORS.neonAmber, COLORS.neonRed, 'rgba(255,255,255,0.3)',
]

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
)

function fmtQty(n) { if (!n) return '0'; return parseFloat(n.toFixed(6)).toString() }

function currentValue(inv) {
  if (inv.currentPrice != null && inv.totalQty > 0) return inv.totalQty * inv.currentPrice
  return inv.totalCostEur || inv.totalCost || 0
}

export default function InvestmentsTable({
  investments, onAddInvestment, onRemoveInvestment,
  onAddTransaction, onRemoveTransaction,
  loading, status, onRefresh, onImportCSV,
}) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const [fxRates, setFxRates]   = useState({})
  const [showImport, setShowImport] = useState(false)
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  useEffect(() => {
    const pairs = [...new Set(investments.map(i => i.originalCurrency || i.currency).filter(c => c && c !== 'EUR'))]
    pairs.forEach(curr => {
      fetch(`/yahoo/v8/finance/chart/${curr}EUR=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(6000) })
        .then(r => r.json()).then(d => {
          const r = d?.chart?.result?.[0]?.meta?.regularMarketPrice
          if (r > 0) setFxRates(p => ({ ...p, [curr]: r }))
        }).catch(() => {})
    })
  }, [investments.length]) // eslint-disable-line

  const calcVal = inv => {
    const origCurr = inv.originalCurrency || inv.currency || 'EUR'
    const qty = inv.totalQty || 0
    if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr])
      return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
    return currentValue(inv)
  }

  const totalValue   = investments.reduce((s, i) => s + calcVal(i), 0)
  const totalCostEur = investments.reduce((s, i) => s + (i.totalCostEur || i.totalCost || 0), 0)
  const totalGain    = totalValue - totalCostEur
  const gainPct      = totalCostEur > 0 ? (totalGain / totalCostEur) * 100 : 0
  const isPos        = totalGain >= 0
  const posCount     = investments.filter(i => calcVal(i) > (i.totalCostEur || i.totalCost || 0)).length
  const sorted       = [...investments].sort((a, b) => sortDir === 'desc' ? calcVal(b) - calcVal(a) : calcVal(a) - calcVal(b))
  const toggle       = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // Distribució per tipus
  const distrib = useMemo(() => {
    const map = {}
    sorted.forEach(inv => {
      const t = inv.type || 'etf'
      if (!map[t]) map[t] = { label: TYPE_LABELS[t] || t, val: 0 }
      map[t].val += calcVal(inv)
    })
    return Object.entries(map)
      .map(([t, d], i) => ({ ...d, type: t, pct: totalValue > 0 ? d.val / totalValue : 0, color: DISTRIB_COLORS[i % DISTRIB_COLORS.length] }))
      .sort((a, b) => b.val - a.val)
  }, [sorted, totalValue]) // eslint-disable-line

  return (
    <div className="inv">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm} />

      {/* ── Hero ── */}
      <div className="inv-hero">
        <p className="inv-hero-label">Cartera d'inversions</p>
        <p className="inv-hero-total">
          {fmtEur(totalValue).replace('€', '')}<span>€</span>
        </p>
        <div className="inv-hero-row">
          <span className={`inv-hero-badge ${isPos ? 'pos' : 'neg'}`}>
            {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{fmtEur(totalGain)} ({Math.abs(gainPct).toFixed(2)}%)
          </span>
          <span className="inv-hero-sub">{investments.length} posicions · {posCount} en positiu</span>
        </div>
      </div>

      {/* ── Mètriques ── */}
      {investments.length > 0 && (
        <div className="inv-metrics">
          <div className="inv-metric">
            <p className="inv-metric-label">Invertit</p>
            <p className="inv-metric-val">{fmtEur(totalCostEur)}</p>
            <p className="inv-metric-sub">cost total</p>
          </div>
          <div className="inv-metric">
            <p className="inv-metric-label">P&amp;G</p>
            <p className={`inv-metric-val ${isPos?'g':'r'}`}>{isPos?'+':''}{fmtEur(totalGain)}</p>
            <p className="inv-metric-sub">{Math.abs(gainPct).toFixed(2)}%</p>
          </div>
          <div className="inv-metric">
            <p className="inv-metric-label">Posicions</p>
            <p className="inv-metric-val p">{investments.length}</p>
            <p className="inv-metric-sub">{posCount} positives</p>
          </div>
        </div>
      )}

      {/* ── Distribució per tipus ── */}
      {distrib.length > 1 && (
        <div className="inv-distrib">
          <div className="inv-distrib-bar">
            {distrib.map((d, i) => (
              <div key={i} className="inv-distrib-seg" style={{ flex: d.pct, background: d.color }}/>
            ))}
          </div>
          <div className="inv-distrib-legend">
            {distrib.map((d, i) => (
              <div key={i} className="inv-distrib-item">
                <div className="inv-distrib-dot" style={{ background: d.color }}/>
                <span className="inv-distrib-lbl">{d.label} {(d.pct*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Accions ── */}
      <div className="inv-actions">
        {onRefresh && (
          <button className="inv-btn-ico" onClick={onRefresh} title="Actualitzar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        )}
        <button className="inv-btn-ico" onClick={() => setSortDir(d => d==='desc'?'asc':'desc')} title="Ordenar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </button>
        <button className="inv-btn-import" onClick={() => setShowImport(true)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Importar CSV
        </button>
        <button className="inv-btn-add" onClick={() => setShowNew(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova posició
        </button>
      </div>

      {/* ── Llista ── */}
      {investments.length === 0 ? (
        <div className="inv-empty">
          <p className="inv-empty-main">Cap inversió registrada</p>
          <p className="inv-empty-sub">Afegeix la teva primera posició o importa un CSV</p>
        </div>
      ) : (
        <div className="inv-section-hdr">
          <span className="inv-section-title">Posicions</span>
        </div>
      )}

      {investments.length > 0 && (
        <div className="inv-cards">
          {sorted.map(inv => (
            <AssetCard
              key={inv.id}
              inv={inv}
              expanded={!!expanded[inv.id]}
              onToggle={() => toggle(inv.id)}
              calcVal={calcVal}
              totalValue={totalValue}
              onRemove={() => askConfirm({ name: inv.name, onConfirm: () => onRemoveInvestment(inv.id) })}
              onOpenTx={type => setTxModal({ invId: inv.id, name: inv.name, type, currency: inv.currency || inv.originalCurrency || null, ticker: inv.ticker })}
              onRemoveTx={txId => onRemoveTransaction(inv.id, txId)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 16 }}/>

      {showNew && <AddInvestmentModal onAdd={d => { onAddInvestment(d); setShowNew(false) }} onClose={() => setShowNew(false)} />}
      {txModal && (
        <TransactionModal
          invName={txModal.name} defaultType={txModal.type}
          currency={txModal.currency} ticker={txModal.ticker}
          onAdd={tx => { onAddTransaction(txModal.invId, tx); setTxModal(null) }}
          onClose={() => setTxModal(null)}
        />
      )}
      {showImport && (
        <ImportCSVModal
          onClose={() => setShowImport(false)}
          onImport={async (txs, broker) => { await onImportCSV?.(txs, broker); setShowImport(false) }}
        />
      )}
    </div>
  )
}

function AssetCard({ inv, expanded, onToggle, calcVal, totalValue, onRemove, onOpenTx, onRemoveTx }) {
  const tc       = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'
  const curVal   = calcVal(inv)
  const costEur  = inv.totalCostEur || inv.totalCost || 0
  const gain     = curVal - costEur
  const gPct     = costEur > 0 ? (gain / costEur) * 100 : 0
  const isPos    = gain >= 0
  const weight   = totalValue > 0 ? (curVal / totalValue) * 100 : 0

  const chartData = useMemo(() => {
    const pts = (inv.txs||[]).filter(t=>t.type==='buy'&&t.pricePerUnit>0).map((t,i)=>({i,price:t.pricePerUnit}))
    if (inv.currentPrice!=null) pts.push({i:pts.length,price:inv.currentPrice})
    return pts
  }, [inv.txs, inv.currentPrice])

  const btns = [
    { label:'Comprar',   color:COLORS.neonGreen,  bg:COLORS.bgGreen,  border:COLORS.borderGreen,  type:'buy' },
    { label:'Vendre',    color:COLORS.neonAmber,  bg:COLORS.bgAmber,  border:COLORS.borderAmber,  type:'sell' },
    { label:'Aportació', color:COLORS.neonCyan,   bg:COLORS.bgCyan,   border:COLORS.borderCyan,   type:'capital' },
  ]

  return (
    <div className="inv-card">
      <div className="inv-card-main" onClick={onToggle}>
        <div className="inv-av" style={{ background: tc.bg, color: tc.color }}>
          {(inv.name||'?').slice(0,2).toUpperCase()}
        </div>
        <div className="inv-card-info">
          <p className="inv-card-name">{inv.name}</p>
          <div className="inv-card-meta">
            <span className="inv-type-badge" style={{ background: tc.bg, color: tc.color }}>
              {TYPE_LABELS[inv.type]||inv.type}
            </span>
            {inv.ticker && <span className="inv-ticker">{inv.ticker}</span>}
            {origCurr!=='EUR' && <span className="inv-curr-badge">{origCurr}</span>}
          </div>
        </div>
        {/* Miní sparkline si hi ha historial */}
        {chartData.length >= 3 && (
          <div style={{ width:50, height:28, flexShrink:0 }}>
            <ResponsiveContainer width="100%" height={28}>
              <AreaChart data={chartData} margin={{top:2,right:0,left:0,bottom:2}}>
                <defs>
                  <linearGradient id={`sg${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0.3}/>
                    <stop offset="100%" stopColor={isPos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="price" stroke={isPos?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill={`url(#sg${inv.id})`} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="inv-card-right">
          <p className="inv-card-val">{fmtEur(curVal)}</p>
          <p className={`inv-card-pct ${isPos?'pos':'neg'}`}>
            {isPos?'▲ +':'▼ '}{Math.abs(gPct).toFixed(2)}%
          </p>
        </div>
        <div className={`inv-card-chevron${expanded?' open':''}`}><ChevronDown/></div>
      </div>

      {expanded && (
        <div className="inv-expand">
          <div className="inv-expand-inner">
            {/* Stats */}
            <div className="inv-stats">
              {[
                { l:'Cost mitjà', v: inv.avgCost>0 ? fmtEur(inv.avgCost)+'/u.' : '—' },
                { l:'Invertit',   v: fmtEur(costEur) },
                { l:'P&G',        v: (isPos?'+':'')+fmtEur(gain), cls: isPos?'pos':'neg' },
                { l:'Pes',        v: weight.toFixed(1)+'%' },
              ].map((s,i) => (
                <div key={i} className="inv-stat">
                  <p className="inv-stat-l">{s.l}</p>
                  <p className={`inv-stat-v${s.cls?' '+s.cls:''}`}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* Botons d'acció */}
            <div className="inv-expand-btns">
              {btns.map(b => (
                <button key={b.type} className="inv-expand-btn"
                  style={{ color: b.color }}
                  onClick={() => onOpenTx(b.type)}
                  onMouseOver={e=>{ e.currentTarget.style.background=b.bg; e.currentTarget.style.borderColor=b.border }}
                  onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
                >{b.label}</button>
              ))}
              <button className="inv-expand-btn" style={{ color:COLORS.neonRed, marginLeft:'auto' }}
                onClick={onRemove}
                onMouseOver={e=>{ e.currentTarget.style.background=COLORS.bgRed; e.currentTarget.style.borderColor=COLORS.borderRed }}
                onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
              >Eliminar</button>
            </div>

            {/* Operacions */}
            {inv.txs && inv.txs.length > 0 && (
              <>
                <p style={{ fontSize:9, fontWeight:500, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Operacions</p>
                <div className="inv-tx-list" style={{ maxHeight:180, overflowY:'auto' }}>
                  {[...inv.txs].reverse().map(tx => {
                    const dotC = tx.type==='buy' ? COLORS.neonGreen : tx.type==='sell' ? COLORS.neonAmber : COLORS.neonCyan
                    return (
                      <div key={tx.id} className="inv-tx">
                        <div className="inv-tx-dot" style={{ background:dotC }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p className="inv-tx-name">{tx.note||(tx.type==='buy'?'Compra':tx.type==='sell'?'Venda':'Aportació')}</p>
                          <p className="inv-tx-date">{tx.date||'—'}</p>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                          {tx.type!=='capital'&&tx.qty>0&&<p style={{ fontSize:12, fontWeight:600, fontFamily:FONTS.mono, color:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber, margin:0 }}>{tx.type==='buy'?'+':'−'}{fmtQty(tx.qty)}</p>}
                          <p style={{ fontSize:11, color:'rgba(255,255,255,0.30)', fontFamily:FONTS.mono, marginTop:2 }}>{fmtEur(tx.totalCostEur||tx.totalCost)}</p>
                        </div>
                        <button className="inv-tx-del" onClick={()=>onRemoveTx(tx.id)}><TrashIcon size={11}/></button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// TransactionModal idèntic al de la versió anterior
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
    fetch(`/yahoo/v8/finance/chart/${ticker}?interval=1d&range=1d`,{signal:AbortSignal.timeout(6000)})
      .then(r=>r.json()).then(d=>{
        const result=d?.chart?.result?.[0]
        let p=result?.meta?.regularMarketPrice
        const yahooCurr=result?.meta?.currency
        const realCurr=yahooCurr==='GBp'?'GBP':(yahooCurr||currency||'EUR')
        if(p&&yahooCurr==='GBp')p=p*0.01
        if(p>0)setLivePrice(+p.toFixed(4))
        if(realCurr!==resolvedCurrency)setResolvedCurrency(realCurr)
      }).catch(()=>{}).finally(()=>setFetchingPrice(false))
  },[ticker]) // eslint-disable-line

  useEffect(()=>{
    if(!resolvedCurrency||resolvedCurrency==='EUR'){setRate(1);return}
    fetch(`/yahoo/v8/finance/chart/${resolvedCurrency}EUR=X?interval=1d&range=1d`,{signal:AbortSignal.timeout(6000)})
      .then(r=>r.json()).then(d=>{const r=d?.chart?.result?.[0]?.meta?.regularMarketPrice;setRate(r>0?r:null)}).catch(()=>setRate(null))
  },[resolvedCurrency]) // eslint-disable-line

  const toNum = v => parseFloat(String(v||'').replace(',','.').replace(/[^0-9.-]/g,''))||0
  const recalc = useCallback((q,p)=>{ const t=toNum(q)*toNum(p); if(t>0)setTotal(t.toFixed(2)) },[])
  const handleQty   = v=>{ setQty(v);   if(v&&price)recalc(v,price) }
  const handlePrice = v=>{ setPrice(v); if(v&&qty)recalc(qty,v) }
  const handleTotal = v=>{ setTotal(v); if(isBuySell&&qty&&v){ const p=toNum(v)/toNum(qty); if(p>0)setPrice(p.toFixed(4)) } }
  const fillLive    = ()=>{ if(!livePrice)return; setPrice(livePrice.toString()); if(qty)recalc(qty,livePrice) }

  const totalOrig=toNum(total), totalEur=isNonEur&&rate?+(totalOrig*rate).toFixed(2):totalOrig
  const priceOrig=toNum(price), priceEur=isNonEur&&rate?+(priceOrig*rate).toFixed(4):priceOrig

  const submit=()=>{
    if(isNonEur&&!rate)return setError('Taxa de canvi no disponible')
    if(isBuySell){
      const q=toNum(qty); if(!q||q<=0)return setError('La quantitat és obligatòria')
      if(totalOrig<=0)return setError("L'import és obligatori")
      setError('')
      onAdd({qty:q,pricePerUnit:priceEur,pricePerUnitOrig:priceOrig,totalCost:totalEur,totalCostEur:totalEur,totalCostOrig:totalOrig,currency:resolvedCurrency,type,note,date})
    } else {
      if(totalOrig<=0)return setError("L'import és obligatori")
      setError('')
      onAdd({qty:0,pricePerUnit:0,totalCost:totalEur,totalCostEur:totalEur,totalCostOrig:totalOrig,currency:resolvedCurrency,type,note,date})
    }
  }

  return (
    <div className="inv-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="inv-modal">
        <div className="inv-modal-drag"/>
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
          {isBuySell&&(
            <div className="inv-grid2">
              <div>
                <label className="inv-lbl">Accions</label>
                <input type="number" inputMode="decimal" step="any" className="inv-inp mono" value={qty} onChange={e=>handleQty(e.target.value)} placeholder="0"/>
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <label className="inv-lbl" style={{margin:0}}>Preu/u. ({sym})</label>
                  {ticker&&<button onClick={fillLive} disabled={fetchingPrice||!livePrice} style={{fontSize:10,fontWeight:600,padding:'3px 8px',border:`1px solid ${COLORS.border}`,borderRadius:4,background:COLORS.elevated,color:livePrice?COLORS.neonGreen:COLORS.textMuted,fontFamily:FONTS.mono,cursor:livePrice?'pointer':'default'}}>{fetchingPrice?'...':livePrice?`${sym}${livePrice}`:'—'}</button>}
                </div>
                <input type="number" inputMode="decimal" step="any" className="inv-inp mono" value={price} onChange={e=>handlePrice(e.target.value)} placeholder="0.00"/>
                {isNonEur&&priceOrig>0&&rate&&<p style={{fontSize:10,color:COLORS.textMuted,fontFamily:FONTS.mono,marginTop:4,textAlign:'right'}}>= €{priceEur.toFixed(4)}</p>}
              </div>
            </div>
          )}
          <div>
            <label className="inv-lbl">{isBuySell?`Total (${sym})`:`Import (${sym})`}</label>
            <input type="number" inputMode="decimal" step="any" className={`inv-inp mono${!isBuySell?' big':''}`} value={total} onChange={e=>handleTotal(e.target.value)} placeholder="0.00"/>
            {isNonEur&&totalOrig>0&&<p style={{fontSize:11,color:COLORS.textMuted,fontFamily:FONTS.mono,marginTop:5,textAlign:'right'}}>{rate?<><span style={{color:COLORS.textPrimary}}>= €{totalEur.toFixed(2)}</span> <span style={{opacity:0.4}}>· 1{sym}=€{rate.toFixed(4)}</span></>:<span style={{color:COLORS.neonRed}}>Taxa no disponible</span>}</p>}
          </div>
          <div className="inv-grid2">
            <div>
              <label className="inv-lbl">Data</label>
              <input type="date" className="inv-inp" value={date} onChange={e=>setDate(e.target.value)}/>
            </div>
            <div>
              <label className="inv-lbl">Nota</label>
              <input className="inv-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="opcional"/>
            </div>
          </div>
          {error&&<p className="inv-error">{error}</p>}
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