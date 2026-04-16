import { useState, useMemo, useEffect, useCallback } from 'react'
import AddInvestmentModal from './AddInvestmentModal'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'
import ImportCSVModal from './Importcsvmodal.jsx'

const TYPE_LABELS = { etf:'ETF', stock:'Acció', robo:'Robo', estalvi:'Estalvi', efectiu:'Efectiu' }
const CURR_SYM    = { EUR:'€', USD:'$', GBP:'£', CHF:'Fr' }

const styles = `
  .inv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  .inv-hero { background:linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%); border:1px solid var(--c-border); border-radius:12px; padding:20px; margin-bottom:12px; position:relative; overflow:hidden; }
  .inv-hero::before { content:''; position:absolute; top:-60px; right:-60px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle,var(--c-bg-purple) 0%,transparent 70%); pointer-events:none; }
  .inv-hero-label { font-size:11px; font-weight:500; color:var(--c-text-muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .inv-hero-total { font-size:36px; font-weight:600; color:var(--c-text-primary); letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:12px; }
  .inv-hero-total span { font-size:30px; opacity:0.7; }
  .inv-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .inv-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; font-family:${FONTS.mono}; padding:4px 10px; border-radius:20px; }
  .inv-hero-badge.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .inv-hero-badge.neg { color:${COLORS.neonRed}; background:rgba(255,59,59,0.10); border:1px solid rgba(255,59,59,0.20); }
  .inv-hero-sub { font-size:11px; color:var(--c-text-muted); font-family:${FONTS.mono}; }

  .inv-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
  .inv-metric { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
  .inv-metric-label { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; }
  .inv-metric-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-text-primary); letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
  .inv-metric-val.g { color:${COLORS.neonGreen}; }
  .inv-metric-val.r { color:${COLORS.neonRed}; }
  .inv-metric-val.p { color:${COLORS.neonPurple}; }
  .inv-metric-sub { font-size:10px; font-family:${FONTS.mono}; color:var(--c-text-muted); }

  .inv-actions { display:flex; gap:6px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
  .inv-btn-ico { width:30px; height:30px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; flex-shrink:0; }
  .inv-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .inv-btn-import { display:flex; align-items:center; gap:5px; padding:7px 13px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; white-space:nowrap; margin-left:auto; }
  .inv-btn-import:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .inv-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:${COLORS.neonPurple}; color:#fff; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; cursor:pointer; transition:opacity 100ms; white-space:nowrap; }
  .inv-btn-add:hover { opacity:0.85; }

  .inv-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .inv-section-title { font-size:10px; font-weight:600; color:var(--c-text-secondary); text-transform:uppercase; letter-spacing:0.14em; }

  .inv-cards { display:flex; flex-direction:column; gap:0; background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; overflow:hidden; }
  .inv-card { border-bottom:1px solid var(--c-border); cursor:pointer; transition:background 80ms; -webkit-tap-highlight-color:transparent; }
  .inv-card:last-child { border-bottom:none; }
  .inv-card:hover { background:var(--c-elevated); }
  .inv-card:active { background:var(--c-elevated); }

  .inv-card-main { display:flex; align-items:center; gap:12px; padding:14px; }
  .inv-av { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .inv-card-info { flex:1; min-width:0; }
  .inv-card-name { font-size:14px; font-weight:500; color:var(--c-text-primary); margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .inv-card-meta { display:flex; align-items:center; gap:5px; }
  .inv-type-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; padding:1px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.06em; }
  .inv-ticker { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .inv-curr-badge { font-size:9px; font-weight:600; font-family:${FONTS.mono}; padding:1px 5px; border-radius:3px; color:${COLORS.neonAmber}; background:${COLORS.bgAmber}; }

  .inv-card-right { text-align:right; flex-shrink:0; }
  .inv-card-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .inv-card-pct { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .inv-card-pct.pos { color:${COLORS.neonGreen}; }
  .inv-card-pct.neg { color:${COLORS.neonRed}; }
  .inv-card-arrow { color:var(--c-text-disabled); margin-left:6px; flex-shrink:0; }

  .inv-distrib { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; padding:14px; margin-bottom:12px; }
  .inv-distrib-bar { display:flex; height:6px; border-radius:3px; overflow:hidden; gap:1px; margin-bottom:10px; }
  .inv-distrib-seg { height:100%; border-radius:2px; transition:flex 500ms; }
  .inv-distrib-legend { display:flex; flex-wrap:wrap; gap:10px; }
  .inv-distrib-item { display:flex; align-items:center; gap:5px; }
  .inv-distrib-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .inv-distrib-lbl { font-size:10px; color:var(--c-text-secondary); font-family:${FONTS.mono}; }

  .inv-empty { padding:48px 0; text-align:center; }
  .inv-empty-main { font-size:14px; color:var(--c-text-muted); font-weight:500; margin-bottom:4px; }
  .inv-empty-sub { font-size:12px; color:var(--c-text-disabled); }

  /* ── Asset Detail Modal — sempre centrat, mai bottom sheet ── */
  .adm-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.82);
    backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
    z-index:60; display:flex; align-items:center; justify-content:center;
    padding:16px;
    animation:admFadeIn 160ms ease;
  }
  @keyframes admFadeIn { from{opacity:0} to{opacity:1} }

  .adm-sheet {
    background:var(--c-bg);
    border:1px solid var(--c-border);
    border-radius:16px;
    width:100%;
    max-width:420px;          /* mòbil: fins a 420px */
    max-height:88dvh;
    overflow-y:auto; overflow-x:hidden;
    font-family:${FONTS.sans};
    box-shadow:0 24px 80px rgba(0,0,0,0.70);
    animation:admScaleIn 220ms cubic-bezier(0.32,1.1,0.60,1);
  }
  @media (min-width:640px) {
    .adm-sheet { max-width:660px; }  /* desktop: més ample */
  }
  @keyframes admScaleIn { from{transform:scale(0.95) translateY(8px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }

  .adm-drag { display:none; }  /* no cal drag handle en dialog centrat */

  /* Header */
  .adm-hdr {
    display:flex; align-items:center; gap:12px;
    padding:16px 20px 12px;
    border-bottom:1px solid var(--c-border);
    position:sticky; top:0; background:var(--c-bg); z-index:2;
  }
  .adm-hdr-av { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .adm-hdr-info { flex:1; min-width:0; }
  .adm-hdr-name { font-size:16px; font-weight:600; color:var(--c-text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
  .adm-hdr-meta { display:flex; align-items:center; gap:5px; }
  .adm-close { width:30px; height:30px; border-radius:8px; background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-muted); font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; flex-shrink:0; }
  .adm-close:hover { background:var(--c-border-hi); color:var(--c-text-primary); }

  /* Hero value */
  .adm-value-section { padding:20px 20px 0; }
  .adm-value-lbl { font-size:10px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:6px; }
  .adm-value-num { font-size:40px; font-weight:300; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; letter-spacing:-1px; margin-bottom:10px; }
  .adm-value-num span { font-size:28px; opacity:0.5; }
  .adm-badges { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:20px; }
  .adm-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; font-family:${FONTS.mono}; padding:5px 12px; border-radius:20px; }
  .adm-badge.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .adm-badge.neg { color:${COLORS.neonRed}; background:rgba(255,59,59,0.10); border:1px solid rgba(255,59,59,0.20); }
  .adm-badge.neu { color:var(--c-text-secondary); background:var(--c-elevated); border:1px solid var(--c-border); }

  /* Chart */
  .adm-chart { padding:0 0 4px; }
  .adm-chart-tooltip { background:var(--c-elevated); border:1px solid var(--c-border-mid); border-radius:8px; padding:8px 12px; font-family:${FONTS.sans}; }
  .adm-chart-tooltip-date { font-size:10px; color:var(--c-text-muted); margin-bottom:4px; }
  .adm-chart-tooltip-val { font-size:13px; font-weight:600; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }

  /* Stats grid */
  .adm-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; padding:16px 20px; }
  @media (min-width:640px) { .adm-stats { grid-template-columns:repeat(4,1fr); } }
  .adm-stat { background:var(--c-elevated); border:1px solid var(--c-border); border-radius:10px; padding:12px 14px; }
  .adm-stat-l { font-size:9px; font-weight:600; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:6px; }
  .adm-stat-v { font-size:18px; font-weight:300; font-family:${FONTS.num}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; letter-spacing:-0.5px; }
  .adm-stat-v.pos { color:${COLORS.neonGreen}; }
  .adm-stat-v.neg { color:${COLORS.neonRed}; }
  .adm-stat-v.dim { color:var(--c-text-secondary); }
  .adm-stat-sub { font-size:10px; color:var(--c-text-muted); margin-top:3px; font-family:${FONTS.mono}; }

  /* Actions */
  .adm-actions { display:flex; gap:8px; padding:0 20px 16px; }
  .adm-action-btn { flex:1; padding:12px 8px; border-radius:10px; border:none; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 100ms; display:flex; align-items:center; justify-content:center; gap:5px; }
  .adm-action-btn:hover { opacity:0.85; }
  .adm-action-btn.buy  { background:rgba(0,255,136,0.12); color:${COLORS.neonGreen}; border:1px solid rgba(0,255,136,0.25); }
  .adm-action-btn.sell { background:rgba(255,149,0,0.10); color:${COLORS.neonAmber}; border:1px solid rgba(255,149,0,0.25); }
  .adm-action-btn.cap  { background:rgba(0,212,255,0.08); color:${COLORS.neonCyan};  border:1px solid rgba(0,212,255,0.20); }

  /* Divider */
  .adm-divider { height:1px; background:var(--c-border); margin:0 20px; }

  /* Transactions */
  .adm-txs { padding:16px 20px 32px; }
  .adm-txs-title { font-size:10px; font-weight:600; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.14em; margin-bottom:12px; }
  .adm-tx { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--c-border); }
  .adm-tx:last-child { border-bottom:none; }
  .adm-tx-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; font-weight:700; }
  .adm-tx-info { flex:1; min-width:0; }
  .adm-tx-name { font-size:12px; font-weight:500; color:var(--c-text-secondary); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .adm-tx-date { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .adm-tx-right { text-align:right; flex-shrink:0; }
  .adm-tx-qty { font-size:12px; font-weight:600; font-family:${FONTS.mono}; font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .adm-tx-cost { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; font-variant-numeric:tabular-nums; }
  .adm-tx-del { width:24px; height:24px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:5px; cursor:pointer; color:var(--c-text-disabled); transition:all 80ms; flex-shrink:0; }
  .adm-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* Delete zone */
  .adm-delete-zone { padding:0 20px 24px; }
  .adm-delete-btn { width:100%; padding:12px; border:1px solid rgba(255,59,59,0.20); background:rgba(255,59,59,0.04); border-radius:10px; font-family:${FONTS.sans}; font-size:13px; font-weight:500; color:rgba(255,59,59,0.60); cursor:pointer; transition:all 100ms; }
  .adm-delete-btn:hover { background:rgba(255,59,59,0.10); border-color:rgba(255,59,59,0.40); color:${COLORS.neonRed}; }

  /* Modals (transaction) */
  .inv-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:70; }
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

function fmtQty(n) { if (!n) return '0'; return parseFloat(n.toFixed(6)).toString() }

function currentValue(inv) {
  if (inv.currentPrice != null && inv.totalQty > 0) return inv.totalQty * inv.currentPrice
  return inv.totalCostEur || inv.totalCost || 0
}

// ── Chart Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="adm-chart-tooltip">
      <p className="adm-chart-tooltip-date">{d?.date || ''}</p>
      <p className="adm-chart-tooltip-val">{fmtEur(payload[0]?.value || 0)}/u.</p>
    </div>
  )
}

// ── Asset Detail Modal ───────────────────────────────────────────────────────
function AssetDetailModal({ inv, totalValue, calcVal, onClose, onOpenTx, onRemoveTx, onRemove, fxRates }) {
  const tc      = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
  const curVal  = calcVal(inv)
  const costEur = inv.totalCostEur || inv.totalCost || 0
  const gain    = curVal - costEur
  const gPct    = costEur > 0 ? (gain / costEur) * 100 : 0
  const isPos   = gain >= 0
  const weight  = totalValue > 0 ? (curVal / totalValue) * 100 : 0
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'

  // Construeix dades del gràfic: tots els buys ordenats per data + preu actual
  const chartData = useMemo(() => {
    const fmtChartDate = d => {
      if (!d) return '—'
      const parts = d.split('-')  // ['2025','12','22']
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`  // '22/12'
      return d
    }
    const buys = (inv.txs || [])
      .filter(t => t.type === 'buy' && t.pricePerUnit > 0)
      .sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1)
      .map(t => ({
        date: t.date || '',
        price: +(t.pricePerUnit || 0),
        label: fmtChartDate(t.date),
      }))

    // Afegim el preu actual com a últim punt
    if (inv.currentPrice != null && inv.currentPrice > 0) {
      const today = new Date().toISOString().split('T')[0]
      buys.push({ date: today, price: +inv.currentPrice, label: 'Ara', isCurrent: true })
    }
    return buys
  }, [inv.txs, inv.currentPrice])

  // Preu actual viu (en moneda original)
  const liveOrigPrice = inv.originalPrice || inv.currentPrice || null
  const liveEurPrice  = inv.currentPrice || null

  // Tanca al clicar fora
  const handleOverlay = e => { if (e.target === e.currentTarget) onClose() }

  return (
    <div className="adm-overlay" onClick={handleOverlay}>
      <div className="adm-sheet">
        <div className="adm-drag"/>

        {/* ── Capçalera sticky ── */}
        <div className="adm-hdr">
          <div className="adm-hdr-av" style={{ background: tc.bg, color: tc.color }}>
            {(inv.name || '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="adm-hdr-info">
            <p className="adm-hdr-name">{inv.name}</p>
            <div className="adm-hdr-meta">
              <span className="inv-type-badge" style={{ background: tc.bg, color: tc.color }}>
                {TYPE_LABELS[inv.type] || inv.type}
              </span>
              {inv.ticker && <span className="inv-ticker">{inv.ticker}</span>}
              {origCurr !== 'EUR' && <span className="inv-curr-badge">{origCurr}</span>}
            </div>
          </div>
          <button className="adm-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Valor hero ── */}
        <div className="adm-value-section">
          <p className="adm-value-lbl">Valor actual</p>
          <p className="adm-value-num">
            {fmtEur(curVal).replace('€', '')}<span>€</span>
          </p>
          <div className="adm-badges">
            <span className={`adm-badge ${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '▲ +' : '▼ '}{isPos ? '+' : ''}{fmtEur(gain)}
            </span>
            <span className={`adm-badge ${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '+' : ''}{gPct.toFixed(2)}%
            </span>
            {liveEurPrice != null && (
              <span className="adm-badge neu">
                {fmtEur(liveEurPrice)}/u.
              </span>
            )}
          </div>
        </div>

        {/* ── Gràfic evolució de preus ── */}
        {chartData.length >= 2 && (
          <div className="adm-chart">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id={`adm-grad-${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPos ? COLORS.neonGreen : COLORS.neonRed} stopOpacity={0.25}/>
                    <stop offset="100%" stopColor={isPos ? COLORS.neonGreen : COLORS.neonRed} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="var(--c-border)" vertical={false}/>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fontFamily: FONTS.mono, fill: 'var(--c-text-muted)' }}
                  axisLine={false} tickLine={false}
                  interval="preserveStartEnd"
                  tickCount={4}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 9, fontFamily: FONTS.mono, fill: 'var(--c-text-muted)' }}
                  axisLine={false} tickLine={false} width={48}
                  tickFormatter={v => fmtEur(v).replace(' €', '')}
                />
                {/* Línia de cost mitjà com a referència */}
                {inv.avgCost > 0 && (
                  <ReferenceLine
                    y={inv.avgCost}
                    stroke="var(--c-border-hi)"
                    strokeDasharray="4 4"
                    label={{ value: 'cost mitjà', position: 'insideTopRight', fontSize: 9, fill: 'var(--c-text-muted)', fontFamily: FONTS.mono }}
                  />
                )}
                <Tooltip content={<ChartTooltip/>} cursor={{ stroke: 'var(--c-border-hi)', strokeWidth: 1 }}/>
                <Area
                  type="monotone" dataKey="price"
                  stroke={isPos ? COLORS.neonGreen : COLORS.neonRed}
                  strokeWidth={1.8}
                  fill={`url(#adm-grad-${inv.id})`}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    if (payload.isCurrent) {
                      return <circle key={cx} cx={cx} cy={cy} r={4} fill={isPos ? COLORS.neonGreen : COLORS.neonRed} stroke="var(--c-bg)" strokeWidth={2}/>
                    }
                    return <circle key={cx} cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.20)" stroke="none"/>
                  }}
                  activeDot={{ r: 5, fill: isPos ? COLORS.neonGreen : COLORS.neonRed, stroke: 'var(--c-bg)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Stats 2x2 ── */}
        <div className="adm-stats">
          <div className="adm-stat">
            <p className="adm-stat-l">Cost mitjà</p>
            <p className="adm-stat-v dim">{inv.avgCost > 0 ? fmtEur(inv.avgCost) : '—'}</p>
            <p className="adm-stat-sub">per unitat · {fmtQty(inv.totalQty)} u.</p>
          </div>
          <div className="adm-stat">
            <p className="adm-stat-l">Invertit</p>
            <p className="adm-stat-v dim">{fmtEur(costEur)}</p>
            <p className="adm-stat-sub">cost total EUR</p>
          </div>
          <div className="adm-stat">
            <p className="adm-stat-l">P&amp;G total</p>
            <p className={`adm-stat-v ${isPos ? 'pos' : 'neg'}`}>{isPos ? '+' : ''}{fmtEur(gain)}</p>
            <p className="adm-stat-sub">{isPos ? '+' : ''}{gPct.toFixed(2)}% sobre cost</p>
          </div>
          <div className="adm-stat">
            <p className="adm-stat-l">Pes al portfoli</p>
            <p className="adm-stat-v dim">{weight.toFixed(1)}%</p>
            <p className="adm-stat-sub">{(inv.txs || []).length} operacions</p>
          </div>
        </div>

        {/* ── Botons d'acció ── */}
        <div className="adm-actions">
          <button className="adm-action-btn buy" onClick={() => onOpenTx('buy')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Comprar
          </button>
          <button className="adm-action-btn sell" onClick={() => onOpenTx('sell')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Vendre
          </button>
          <button className="adm-action-btn cap" onClick={() => onOpenTx('capital')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Capital
          </button>
        </div>

        <div className="adm-divider"/>

        {/* ── Historial transaccions ── */}
        {inv.txs && inv.txs.length > 0 && (
          <div className="adm-txs">
            <p className="adm-txs-title">Operacions ({inv.txs.length})</p>
            {[...inv.txs].reverse().map(tx => {
              const isBuy  = tx.type === 'buy'
              const isSell = tx.type === 'sell'
              const dotC   = isBuy ? COLORS.neonGreen : isSell ? COLORS.neonAmber : COLORS.neonCyan
              const dotBg  = isBuy ? 'rgba(0,255,136,0.10)' : isSell ? 'rgba(255,149,0,0.10)' : 'rgba(0,212,255,0.10)'
              const label  = isBuy ? 'BUY' : isSell ? 'SELL' : 'CAP'
              return (
                <div key={tx.id} className="adm-tx">
                  <div className="adm-tx-icon" style={{ background: dotBg, color: dotC }}>
                    {label}
                  </div>
                  <div className="adm-tx-info">
                    <p className="adm-tx-name">{tx.note || (isBuy ? 'Compra' : isSell ? 'Venda' : 'Aportació de capital')}</p>
                    <p className="adm-tx-date">{tx.date || '—'}</p>
                  </div>
                  <div className="adm-tx-right">
                    {tx.type !== 'capital' && tx.qty > 0 && (
                      <p className="adm-tx-qty" style={{ color: dotC }}>
                        {isBuy ? '+' : '−'}{fmtQty(tx.qty)} u.
                      </p>
                    )}
                    <p className="adm-tx-cost">{fmtEur(tx.totalCostEur || tx.totalCost)}</p>
                  </div>
                  <button className="adm-tx-del" onClick={() => onRemoveTx(tx.id)}>
                    <TrashIcon size={11}/>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Eliminar posició ── */}
        <div className="adm-delete-zone">
          <button className="adm-delete-btn" onClick={onRemove}>
            Eliminar posició "{inv.name}"
          </button>
        </div>
      </div>
    </div>
  )
}

// ── InvestmentsTable ─────────────────────────────────────────────────────────
export default function InvestmentsTable({
  investments, onAddInvestment, onRemoveInvestment,
  onAddTransaction, onRemoveTransaction,
  loading, status, onRefresh, onImportCSV,
}) {
  const [showNew, setShowNew]       = useState(false)
  const [txModal, setTxModal]       = useState(null)
  const [detailInv, setDetailInv]   = useState(null)
  const [sortDir, setSortDir]       = useState('desc')
  const [fxRates, setFxRates]       = useState({})
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

  // Filtra posicions amb qty ~0 (totalment venudes) — no es mostren a la taula
  const activeInvestments = investments.filter(i => (i.totalQty || 0) > 0.00001)

  const totalValue   = activeInvestments.reduce((s, i) => s + calcVal(i), 0)
  const totalCostEur = activeInvestments.reduce((s, i) => s + (i.totalCostEur || i.totalCost || 0), 0)
  const totalGain    = totalValue - totalCostEur
  const gainPct      = totalCostEur > 0 ? (totalGain / totalCostEur) * 100 : 0
  const isPos        = totalGain >= 0
  const posCount     = activeInvestments.filter(i => calcVal(i) > (i.totalCostEur || i.totalCost || 0)).length
  const sorted       = [...activeInvestments].sort((a, b) => sortDir === 'desc' ? calcVal(b) - calcVal(a) : calcVal(a) - calcVal(b))

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

  // Quan s'obre el modal de transacció, tanquem el modal de detall temporalment
  const openTx = (inv, type) => {
    setTxModal({ invId: inv.id, name: inv.name, type, currency: inv.currency || inv.originalCurrency || null, ticker: inv.ticker })
  }

  // Quan es tanca el modal de tx, actualitza el detallInv amb les dades noves
  const handleRemoveInv = (inv) => {
    askConfirm({ name: inv.name, onConfirm: () => { onRemoveInvestment(inv.id); setDetailInv(null) } })
  }

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
          <span className="inv-hero-sub">{activeInvestments.length} posicions · {posCount} en positiu</span>
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
      {activeInvestments.length === 0 ? (
        <div className="inv-empty">
          <p className="inv-empty-main">Cap inversió registrada</p>
          <p className="inv-empty-sub">Afegeix la teva primera posició o importa un CSV</p>
        </div>
      ) : (
        <div className="inv-section-hdr">
          <span className="inv-section-title">Posicions · clica per veure detall</span>
        </div>
      )}

      {investments.length > 0 && (
        <div className="inv-cards">
          {sorted.map(inv => {
            const tc      = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
            const curVal  = calcVal(inv)
            const costEur = inv.totalCostEur || inv.totalCost || 0
            const gain    = curVal - costEur
            const gPct    = costEur > 0 ? (gain / costEur) * 100 : 0
            const isP     = gain >= 0
            const origCurr = inv.originalCurrency || inv.currency || 'EUR'

            return (
              <div key={inv.id} className="inv-card" onClick={() => setDetailInv(inv)}>
                <div className="inv-card-main">
                  <div className="inv-av" style={{ background: tc.bg, color: tc.color }}>
                    {(inv.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="inv-card-info">
                    <p className="inv-card-name">{inv.name}</p>
                    <div className="inv-card-meta">
                      <span className="inv-type-badge" style={{ background: tc.bg, color: tc.color }}>
                        {TYPE_LABELS[inv.type] || inv.type}
                      </span>
                      {inv.ticker && <span className="inv-ticker">{inv.ticker}</span>}
                      {origCurr !== 'EUR' && <span className="inv-curr-badge">{origCurr}</span>}
                    </div>
                  </div>
                  {/* Mini sparkline */}
                  {(() => {
                    const pts = (inv.txs||[]).filter(t=>t.type==='buy'&&t.pricePerUnit>0).map((t,i)=>({i,price:t.pricePerUnit}))
                    if (inv.currentPrice!=null) pts.push({i:pts.length,price:inv.currentPrice})
                    return pts.length >= 3 ? (
                      <div style={{ width:50, height:28, flexShrink:0 }}>
                        <ResponsiveContainer width="100%" height={28}>
                          <AreaChart data={pts} margin={{top:2,right:0,left:0,bottom:2}}>
                            <defs>
                              <linearGradient id={`sg${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={isP?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0.3}/>
                                <stop offset="100%" stopColor={isP?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="price" stroke={isP?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill={`url(#sg${inv.id})`} dot={false}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : null
                  })()}
                  <div className="inv-card-right">
                    <p className="inv-card-val">{fmtEur(curVal)}</p>
                    <p className={`inv-card-pct ${isP?'pos':'neg'}`}>
                      {isP?'▲ +':'▼ '}{Math.abs(gPct).toFixed(2)}%
                    </p>
                  </div>
                  <div className="inv-card-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ height: 16 }}/>

      {/* ── Modals ── */}
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

      {/* ── Asset Detail Modal ── */}
      {detailInv && (() => {
        // Sincronitza amb les dades fresques (txs, preus) de investments
        const fresh = investments.find(i => i.id === detailInv.id) || detailInv
        return (
          <AssetDetailModal
            inv={fresh}
            totalValue={totalValue}
            calcVal={calcVal}
            fxRates={fxRates}
            onClose={() => setDetailInv(null)}
            onOpenTx={type => openTx(fresh, type)}
            onRemoveTx={txId => onRemoveTransaction(fresh.id, txId)}
            onRemove={() => handleRemoveInv(fresh)}
          />
        )
      })()}
    </div>
  )
}

// ── TransactionModal ─────────────────────────────────────────────────────────
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
              <input type="date" className="inv-inv-inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%',background:COLORS.bg,border:`1px solid ${COLORS.border}`,borderRadius:5,padding:'10px 12px',fontFamily:FONTS.sans,fontSize:16,color:COLORS.textPrimary,outline:'none',boxSizing:'border-box'}}/>
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

export function calcInvValue(inv) {
  const qty = inv.totalQty || 0
  if (inv.currentPrice != null && qty > 0) return +(qty * inv.currentPrice).toFixed(2)
  return inv.totalCostEur || inv.totalCost || 0
}
export function calcInvCost(inv) {
  return inv.totalCostEur || inv.totalCost || 0
}