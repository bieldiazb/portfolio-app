import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { GOAL_TYPES } from '../hooks/Usegoals.js'

// ── Simulació de creixement futur ─────────────────────────────────────────────
function fv(pv, pmt, rAnnual, months) {
  if (rAnnual === 0) return pv + pmt * months
  const m = rAnnual / 100 / 12
  return pv * Math.pow(1 + m, months) + pmt * (Math.pow(1 + m, months) - 1) / m
}

function monthsToTarget(pv, pmt, rAnnual, target) {
  if (pv >= target) return 0
  let m = 0
  while (m < 600) { // màxim 50 anys
    if (fv(pv, pmt, rAnnual, m) >= target) return m
    m++
  }
  return null // no assolible
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

const TrashIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const SimTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: COLORS.elevated, border: `1px solid ${COLORS.borderMid}`, borderRadius: 5, padding: '7px 11px', fontFamily: FONTS.sans }}>
      <p style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 500, fontFamily: FONTS.mono, color: COLORS.textPrimary }}>{fmtEur(payload[0]?.value)}</p>
    </div>
  )
}

const styles = `
  .gl { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }
  .gl-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .gl-sub   { font-size:12px; color:${COLORS.textMuted}; }

  .gl-hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .gl-btn-add { display:flex; align-items:center; gap:5px; padding:6px 12px; background:${COLORS.neonPurple}; color:#fff; border:none; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:opacity 100ms; white-space:nowrap; flex-shrink:0; }
  .gl-btn-add:hover { opacity:0.85; }

  /* Targeta d'objectiu */
  .gl-card { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:18px; }
  .gl-card-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; }
  .gl-card-left { display:flex; align-items:center; gap:10px; }
  .gl-card-icon { width:34px; height:34px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
  .gl-card-name { font-size:14px; font-weight:600; color:${COLORS.textPrimary}; margin-bottom:2px; }
  .gl-card-type { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }
  .gl-card-del { width:24px; height:24px; background:transparent; border:none; color:${COLORS.textMuted}; cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:3px; transition:all 80ms; }
  .gl-card-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  /* Progress */
  .gl-prog-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
  .gl-prog-cur { font-size:20px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.5px; font-variant-numeric:tabular-nums; }
  .gl-prog-target { font-size:12px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .gl-prog-pct { font-size:13px; font-weight:600; font-family:${FONTS.mono}; }

  .gl-bar-track { height:6px; background:${COLORS.elevated}; border-radius:3px; overflow:hidden; margin-bottom:12px; position:relative; }
  .gl-bar-fill  { height:100%; border-radius:3px; transition:width 600ms cubic-bezier(0.4,0,0.2,1); }
  .gl-bar-milestone { position:absolute; top:0; height:100%; width:2px; background:rgba(255,255,255,0.20); }

  /* Stats grid */
  .gl-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:${COLORS.border}; border-radius:5px; overflow:hidden; margin-bottom:14px; }
  .gl-stat  { background:${COLORS.elevated}; padding:10px 12px; }
  .gl-stat-l { font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:4px; }
  .gl-stat-v { font-size:13px; font-weight:500; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; font-variant-numeric:tabular-nums; }
  .gl-stat-v.g { color:${COLORS.neonGreen}; }
  .gl-stat-v.p { color:${COLORS.neonPurple}; }
  .gl-stat-v.c { color:${COLORS.neonCyan}; }

  /* Gràfic simulació */
  .gl-sim-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:10px; }

  /* Alerta de preu (asset goal) */
  .gl-price-alert { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:4px; font-size:11px; }
  .gl-price-alert.above { background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; color:${COLORS.neonGreen}; }
  .gl-price-alert.below { background:${COLORS.bgAmber}; border:1px solid ${COLORS.borderAmber}; color:${COLORS.neonAmber}; }
  .gl-price-alert.wait  { background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textMuted}; }

  /* Empty */
  .gl-empty { padding:56px 0; text-align:center; }
  .gl-empty-main { font-size:14px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .gl-empty-sub  { font-size:12px; color:${COLORS.textMuted}; opacity:0.5; }

  /* Modal */
  .gl-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
  .gl-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px; width:100%; max-width:440px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90vh; overflow-y:auto; }
  .gl-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .gl-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .gl-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .gl-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .gl-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; }
  .gl-inp:focus { border-color:${COLORS.neonPurple}; }
  .gl-inp::placeholder { color:${COLORS.textMuted}; }
  .gl-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .gl-sel { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; cursor:pointer; }
  .gl-sel option { background:${COLORS.surface}; }
  .gl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .gl-fgroup { display:flex; flex-direction:column; gap:14px; }
  .gl-mfooter { display:flex; gap:8px; margin-top:20px; }
  .gl-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .gl-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .gl-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; background:${COLORS.neonPurple}; color:#fff; cursor:pointer; transition:opacity 100ms; }
  .gl-btn-ok:hover { opacity:0.85; }
  .gl-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }

  /* Type selector */
  .gl-type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:4px; }
  .gl-type-btn { padding:10px 6px; border-radius:4px; border:1px solid ${COLORS.border}; background:${COLORS.elevated}; cursor:pointer; text-align:center; transition:all 100ms; font-family:${FONTS.sans}; }
  .gl-type-btn:hover { border-color:${COLORS.borderHi}; }
  .gl-type-btn.sel { border-color:${COLORS.neonPurple}; background:rgba(123,97,255,0.10); }
  .gl-type-emoji { font-size:18px; margin-bottom:4px; }
  .gl-type-lbl { font-size:10px; color:${COLORS.textMuted}; font-weight:500; }
  .gl-type-btn.sel .gl-type-lbl { color:${COLORS.neonPurple}; }
`

// ── GoalCard ──────────────────────────────────────────────────────────────────
function GoalCard({ goal, currentTotal, totalDividends, investments, onRemove }) {
  const color = GOAL_TYPES[goal.type]?.color || COLORS.neonPurple

  // Valor actual depenent del tipus
  const currentValue = useMemo(() => {
    if (goal.type === 'savings') return currentTotal || 0
    if (goal.type === 'passive') return totalDividends || 0  // anualitzat
    if (goal.type === 'asset') {
      const inv = investments.find(i => i.id === goal.assetId)
      return inv?.currentPrice || inv?.avgCost || 0
    }
    return 0
  }, [goal, currentTotal, totalDividends, investments])

  const target  = goal.target || 0
  const pct     = target > 0 ? Math.min((currentValue / target) * 100, 100) : 0
  const done    = pct >= 100

  // Simulació per tipus savings
  const simData = useMemo(() => {
    if (goal.type !== 'savings') return []
    const pv    = currentTotal || 0
    const pmt   = goal.monthlyContrib || 0
    const rate  = goal.expectedReturn || 7
    const pts   = []
    const now   = new Date()
    for (let m = 0; m <= 120; m += 3) {
      const val = fv(pv, pmt, rate, m)
      pts.push({
        label: m === 0 ? 'Avui' : `${m}m`,
        value: Math.round(val),
        date:  addMonths(now, m),
      })
      if (val >= target && target > 0) { pts.push({ label: `${m}m`, value: Math.round(val), date: addMonths(now, m) }); break }
    }
    return pts
  }, [goal, currentTotal])

  const monthsNeeded = useMemo(() => {
    if (goal.type !== 'savings' || !target) return null
    return monthsToTarget(currentTotal || 0, goal.monthlyContrib || 0, goal.expectedReturn || 7, target)
  }, [goal, currentTotal, target])

  const targetDate = monthsNeeded != null
    ? addMonths(new Date(), monthsNeeded).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' })
    : null

  // Passiva: dividend mensual actual
  const monthlyPassive = totalDividends ? totalDividends / 12 : 0
  const monthlyTarget  = goal.type === 'passive' ? (goal.target || 0) : 0

  // Asset goal: preu actual vs preu objectiu
  const inv = goal.type === 'asset' ? investments.find(i => i.id === goal.assetId) : null
  const currentPrice = inv?.currentPrice || 0
  const targetPrice  = goal.targetPrice || 0
  const priceReached = goal.direction === 'below'
    ? currentPrice <= targetPrice && currentPrice > 0
    : currentPrice >= targetPrice && currentPrice > 0

  return (
    <div className="gl-card">
      <div className="gl-card-hdr">
        <div className="gl-card-left">
          <div className="gl-card-icon" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
            {GOAL_TYPES[goal.type]?.icon}
          </div>
          <div>
            <p className="gl-card-name">{goal.name}</p>
            <p className="gl-card-type">{GOAL_TYPES[goal.type]?.label}</p>
          </div>
        </div>
        <button className="gl-card-del" onClick={onRemove}><TrashIcon size={12}/></button>
      </div>

      {/* ── SAVINGS goal ── */}
      {goal.type === 'savings' && (<>
        <div className="gl-prog-row">
          <span className="gl-prog-cur">{fmtEur(currentValue)}</span>
          <div style={{ textAlign: 'right' }}>
            <span className="gl-prog-pct" style={{ color: done ? COLORS.neonGreen : color }}>
              {pct.toFixed(1)}%
            </span>
            <p className="gl-prog-target">de {fmtEur(target)}</p>
          </div>
        </div>
        <div className="gl-bar-track">
          <div className="gl-bar-fill" style={{ width: `${pct}%`, background: done ? COLORS.neonGreen : color }}/>
          {[25, 50, 75].map(m => (
            <div key={m} className="gl-bar-milestone" style={{ left: `${m}%` }}/>
          ))}
        </div>
        <div className="gl-stats">
          <div className="gl-stat">
            <p className="gl-stat-l">Falta</p>
            <p className="gl-stat-v">{done ? '✓ Assolit' : fmtEur(Math.max(0, target - currentValue))}</p>
          </div>
          <div className="gl-stat">
            <p className="gl-stat-l">Aportació/mes</p>
            <p className="gl-stat-v p">{fmtEur(goal.monthlyContrib || 0)}</p>
          </div>
          <div className="gl-stat">
            <p className="gl-stat-l">Estimat a</p>
            <p className="gl-stat-v c" style={{ fontSize: 11 }}>
              {done ? 'Completat' : targetDate || 'No assolible'}
            </p>
          </div>
        </div>
        {simData.length > 1 && !done && (
          <>
            <p className="gl-sim-title">Simulació ({goal.expectedReturn || 7}% anual)</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={simData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: FONTS.mono, fill: COLORS.textMuted }} axisLine={false} tickLine={false} interval={Math.floor(simData.length / 4)}/>
                <YAxis tick={{ fontSize: 9, fontFamily: FONTS.mono, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={44} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                <ReferenceLine y={target} stroke={color} strokeDasharray="3 3" strokeWidth={1}/>
                <Tooltip content={<SimTooltip/>} cursor={{ stroke: COLORS.borderMid, strokeWidth: 1 }}/>
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </>)}

      {/* ── PASSIVE income goal ── */}
      {goal.type === 'passive' && (<>
        <div className="gl-prog-row">
          <span className="gl-prog-cur">{fmtEur(monthlyPassive)}<span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 400 }}>/mes</span></span>
          <div style={{ textAlign: 'right' }}>
            <span className="gl-prog-pct" style={{ color: done ? COLORS.neonGreen : color }}>{pct.toFixed(1)}%</span>
            <p className="gl-prog-target">de {fmtEur(monthlyTarget)}/mes</p>
          </div>
        </div>
        <div className="gl-bar-track">
          <div className="gl-bar-fill" style={{ width: `${pct}%`, background: done ? COLORS.neonGreen : color }}/>
          {[25, 50, 75].map(m => <div key={m} className="gl-bar-milestone" style={{ left: `${m}%` }}/>)}
        </div>
        <div className="gl-stats">
          <div className="gl-stat">
            <p className="gl-stat-l">Falta/mes</p>
            <p className="gl-stat-v">{done ? '✓' : fmtEur(Math.max(0, monthlyTarget - monthlyPassive))}</p>
          </div>
          <div className="gl-stat">
            <p className="gl-stat-l">Anual actual</p>
            <p className="gl-stat-v g">{fmtEur(totalDividends || 0)}</p>
          </div>
          <div className="gl-stat">
            <p className="gl-stat-l">Anual objectiu</p>
            <p className="gl-stat-v">{fmtEur(monthlyTarget * 12)}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
          Basat en els dividends registrats. Afegeix cobraments a la secció <strong style={{ color: COLORS.textSecondary }}>Dividends</strong> per actualitzar el progrés.
        </p>
      </>)}

      {/* ── ASSET price goal ── */}
      {goal.type === 'asset' && (<>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
            {inv?.name || goal.assetName || '—'} · {inv?.ticker || ''}
          </p>
          <div className="gl-stats">
            <div className="gl-stat">
              <p className="gl-stat-l">Preu actual</p>
              <p className="gl-stat-v">{currentPrice > 0 ? fmtEur(currentPrice) : '—'}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Preu objectiu</p>
              <p className="gl-stat-v p">{fmtEur(targetPrice)}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Diferència</p>
              <p className="gl-stat-v" style={{ color: priceReached ? COLORS.neonGreen : COLORS.neonRed }}>
                {currentPrice > 0
                  ? `${((currentPrice - targetPrice) / targetPrice * 100).toFixed(1)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className={`gl-price-alert ${priceReached ? (goal.direction === 'below' ? 'above' : 'above') : 'wait'}`}>
          {priceReached
            ? `✓ Objectiu assolit — ${goal.direction === 'below' ? 'el preu és per sota' : 'el preu és per sobre'} de ${fmtEur(targetPrice)}`
            : goal.direction === 'below'
              ? `⏳ Esperant que ${inv?.ticker || 'l\'actiu'} baixi a ${fmtEur(targetPrice)} · Ara: ${fmtEur(currentPrice)}`
              : `⏳ Esperant que ${inv?.ticker || 'l\'actiu'} pugi a ${fmtEur(targetPrice)} · Ara: ${fmtEur(currentPrice)}`
          }
        </div>
        {goal.note && (
          <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 10, fontStyle: 'italic' }}>"{goal.note}"</p>
        )}
      </>)}
    </div>
  )
}

// ── Modal afegir objectiu ─────────────────────────────────────────────────────
function AddGoalModal({ investments, onAdd, onClose }) {
  const [type, setType] = useState('savings')
  const [form, setForm] = useState({
    name: '', target: '', monthlyContrib: '', expectedReturn: '7',
    assetId: investments[0]?.id || '', targetPrice: '', direction: 'below', note: '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    if (type === 'savings' && (!form.target || parseFloat(form.target) <= 0))
      return setError("L'import objectiu és obligatori")
    if (type === 'passive' && (!form.target || parseFloat(form.target) <= 0))
      return setError("L'import mensual objectiu és obligatori")
    if (type === 'asset' && (!form.targetPrice || parseFloat(form.targetPrice) <= 0))
      return setError('El preu objectiu és obligatori')
    setError('')

    const selectedInv = investments.find(i => i.id === form.assetId)
    await onAdd({
      type,
      name:           form.name.trim(),
      target:         type === 'asset' ? 0 : parseFloat(form.target) || 0,
      monthlyContrib: parseFloat(form.monthlyContrib) || 0,
      expectedReturn: parseFloat(form.expectedReturn) || 7,
      assetId:        form.assetId,
      assetName:      selectedInv?.name || '',
      targetPrice:    parseFloat(form.targetPrice) || 0,
      direction:      form.direction,
      note:           form.note,
    })
    onClose()
  }

  const eligibleInvs = investments.filter(i => i.ticker && !['efectiu', 'estalvi'].includes(i.type))

  return (
    <div className="gl-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gl-modal">
        <div className="gl-modal-hdr">
          <h3 className="gl-modal-title">Nou objectiu</h3>
          <button className="gl-modal-x" onClick={onClose}>×</button>
        </div>

        {/* Tipus */}
        <div className="gl-fgroup">
          <div>
            <label className="gl-lbl">Tipus d'objectiu</label>
            <div className="gl-type-grid">
              {Object.entries(GOAL_TYPES).map(([key, meta]) => (
                <button key={key} className={`gl-type-btn${type === key ? ' sel' : ''}`} onClick={() => setType(key)}>
                  <div className="gl-type-emoji">{meta.icon}</div>
                  <div className="gl-type-lbl">{meta.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="gl-lbl">Nom de l'objectiu</label>
            <input className="gl-inp" autoFocus value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder={
                type === 'savings' ? 'Ex: Fons d\'emergència, Pis, Jubilació...' :
                type === 'passive' ? 'Ex: Renda passiva mensual' :
                'Ex: Comprar més EUNL si baixa'
              }/>
          </div>

          {/* Savings fields */}
          {type === 'savings' && (<>
            <div>
              <label className="gl-lbl">Import objectiu (€)</label>
              <input type="number" inputMode="decimal" className="gl-inp mono" value={form.target} onChange={e => set('target', e.target.value)} placeholder="100000"/>
            </div>
            <div className="gl-grid2">
              <div>
                <label className="gl-lbl">Aportació mensual (€)</label>
                <input type="number" inputMode="decimal" className="gl-inp mono" value={form.monthlyContrib} onChange={e => set('monthlyContrib', e.target.value)} placeholder="500"/>
              </div>
              <div>
                <label className="gl-lbl">Retorn anual esperat (%)</label>
                <input type="number" inputMode="decimal" className="gl-inp mono" value={form.expectedReturn} onChange={e => set('expectedReturn', e.target.value)} placeholder="7"/>
              </div>
            </div>
          </>)}

          {/* Passive fields */}
          {type === 'passive' && (
            <div>
              <label className="gl-lbl">Objectiu de renda mensual (€/mes)</label>
              <input type="number" inputMode="decimal" className="gl-inp mono" value={form.target} onChange={e => set('target', e.target.value)} placeholder="500"/>
            </div>
          )}

          {/* Asset fields */}
          {type === 'asset' && (<>
            <div>
              <label className="gl-lbl">Actiu</label>
              <select className="gl-sel" value={form.assetId} onChange={e => set('assetId', e.target.value)}>
                {eligibleInvs.length === 0
                  ? <option value="">Cap actiu elegible</option>
                  : eligibleInvs.map(i => <option key={i.id} value={i.id}>{i.name} {i.ticker ? `(${i.ticker})` : ''}</option>)
                }
              </select>
            </div>
            <div className="gl-grid2">
              <div>
                <label className="gl-lbl">Preu objectiu (€)</label>
                <input type="number" inputMode="decimal" className="gl-inp mono" value={form.targetPrice} onChange={e => set('targetPrice', e.target.value)} placeholder="0.00"/>
              </div>
              <div>
                <label className="gl-lbl">Direcció</label>
                <select className="gl-sel" value={form.direction} onChange={e => set('direction', e.target.value)}>
                  <option value="below">Baixi per sota de</option>
                  <option value="above">Pugi per sobre de</option>
                </select>
              </div>
            </div>
            <div>
              <label className="gl-lbl">Nota (opcional)</label>
              <input className="gl-inp" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Ex: Comprar 10 participacions addicionals"/>
            </div>
          </>)}

          {error && <p className="gl-error">{error}</p>}
        </div>

        <div className="gl-mfooter">
          <button className="gl-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="gl-btn-ok" onClick={submit}>Crear objectiu</button>
        </div>
      </div>
    </div>
  )
}

// ── GoalsPage ─────────────────────────────────────────────────────────────────
export default function GoalsPage({
  goals, addGoal, removeGoal,
  currentTotal = 0,
  totalDividendsYear = 0,
  investments = [],
}) {
  const [showModal, setShowModal] = useState(false)
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const byType = useMemo(() => ({
    savings: goals.filter(g => g.type === 'savings'),
    passive: goals.filter(g => g.type === 'passive'),
    asset:   goals.filter(g => g.type === 'asset'),
  }), [goals])

  const doneCount = goals.filter(g => {
    if (g.type === 'savings') return currentTotal >= g.target
    if (g.type === 'passive') return (totalDividendsYear / 12) >= g.target
    return false
  }).length

  return (
    <div className="gl">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm}/>

      <div className="gl-hdr">
        <div>
          <h2 className="gl-title">Objectius financers</h2>
          <p className="gl-sub">
            {goals.length === 0 ? 'Cap objectiu creat' : `${goals.length} objectiu${goals.length > 1 ? 's' : ''} · ${doneCount} assolit${doneCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="gl-btn-add" onClick={() => setShowModal(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nou objectiu
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="gl-empty">
          <p className="gl-empty-main">Encara no tens objectius</p>
          <p className="gl-empty-sub">Crea el primer per veure la simulació de quan l'assoliràs</p>
        </div>
      ) : (
        <>
          {byType.savings.map(g => (
            <GoalCard key={g.id} goal={g} currentTotal={currentTotal}
              totalDividends={totalDividendsYear} investments={investments}
              onRemove={() => askConfirm({ name: g.name, onConfirm: () => removeGoal(g.id) })}/>
          ))}
          {byType.passive.map(g => (
            <GoalCard key={g.id} goal={g} currentTotal={currentTotal}
              totalDividends={totalDividendsYear} investments={investments}
              onRemove={() => askConfirm({ name: g.name, onConfirm: () => removeGoal(g.id) })}/>
          ))}
          {byType.asset.map(g => (
            <GoalCard key={g.id} goal={g} currentTotal={currentTotal}
              totalDividends={totalDividendsYear} investments={investments}
              onRemove={() => askConfirm({ name: g.name, onConfirm: () => removeGoal(g.id) })}/>
          ))}
        </>
      )}

      {showModal && (
        <AddGoalModal
          investments={investments}
          onAdd={addGoal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}