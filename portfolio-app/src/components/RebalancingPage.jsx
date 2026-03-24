import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const CATEGORIES = [
  { id: 'etf',     label: 'ETF / Renda variable', color: 'rgba(100,155,255,0.80)', types: ['etf', 'stock'] },
  { id: 'estalvi', label: 'Estalvi / Liquiditat',  color: 'rgba(255,255,255,0.50)', types: ['estalvi', 'efectiu'] },
  { id: 'crypto',  label: 'Crypto',                color: 'rgba(255,170,70,0.80)',  types: ['crypto'] },
  { id: 'robo',    label: 'Robo Advisor',           color: 'rgba(180,130,255,0.80)', types: ['robo'] },
]

const DEFAULT_GOALS = { etf: 50, estalvi: 20, crypto: 20, robo: 10 }
const DRIFT_THRESHOLD = 5

const styles = `
  .rb3 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .rb3-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .rb3-panel-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .rb3-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); }

  /* Score gauge */
  .rb3-score-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; background: rgba(255,255,255,0.02); }
  .rb3-score-circle { width: 52px; height: 52px; flex-shrink: 0; }
  .rb3-score-info { flex: 1; }
  .rb3-score-label { font-size: 10px; color: rgba(255,255,255,0.26); letter-spacing: 0.03em; margin-bottom: 3px; }
  .rb3-score-val { font-size: 22px; font-weight: 300; font-family: 'Geist Mono', monospace; letter-spacing: -0.8px; }
  .rb3-score-sub { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; }

  /* Goal rows */
  .rb3-goal { display: flex; align-items: flex-start; gap: 12px; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .rb3-goal:last-child { border-bottom: none; }
  .rb3-goal-left { width: 130px; flex-shrink: 0; }
  .rb3-goal-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; margin-right: 6px; flex-shrink: 0; }
  .rb3-goal-name { font-size: 12px; color: rgba(255,255,255,0.58); }
  .rb3-goal-val { font-size: 11px; color: rgba(255,255,255,0.30); font-family: 'Geist Mono', monospace; margin-top: 2px; }
  .rb3-goal-bars { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .rb3-bar-row { display: flex; align-items: center; gap: 6px; }
  .rb3-bar-lbl { font-size: 9px; color: rgba(255,255,255,0.20); width: 26px; text-align: right; font-family: 'Geist Mono', monospace; flex-shrink: 0; }
  .rb3-bar-track { flex: 1; height: 5px; background: rgba(255,255,255,0.06); border-radius: 2.5px; overflow: hidden; position: relative; }
  .rb3-bar-fill { height: 100%; border-radius: 2.5px; transition: width 600ms cubic-bezier(0.4,0,0.2,1); }
  .rb3-bar-pct { font-size: 10px; font-family: 'Geist Mono', monospace; width: 32px; text-align: right; flex-shrink: 0; }
  .rb3-bar-diff { font-size: 10px; font-family: 'Geist Mono', monospace; width: 44px; text-align: right; flex-shrink: 0; padding: 1px 5px; border-radius: 3px; }

  /* Editor */
  .rb3-edit-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .rb3-edit-row:last-child { border-bottom: none; }
  .rb3-edit-label { flex: 1; font-size: 12px; color: rgba(255,255,255,0.55); display: flex; align-items: center; gap: 7px; }
  .rb3-edit-input { width: 52px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 6px 8px; font-family: 'Geist Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.75); outline: none; text-align: right; transition: border-color 100ms; }
  .rb3-edit-input:focus { border-color: rgba(255,255,255,0.20); }
  .rb3-edit-pct { font-size: 11px; color: rgba(255,255,255,0.28); }
  .rb3-total-row { display: flex; justify-content: flex-end; font-size: 11px; font-family: 'Geist Mono', monospace; margin-top: 6px; }
  .rb3-total-ok  { color: rgba(80,210,110,0.75); }
  .rb3-total-err { color: rgba(255,90,70,0.75); }

  /* Alerts */
  .rb3-alerts { display: flex; flex-direction: column; gap: 7px; }
  .rb3-alert { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 6px; }
  .rb3-alert.warn { background: rgba(255,170,50,0.05); border: 1px solid rgba(255,170,50,0.14); }
  .rb3-alert.info { background: rgba(100,155,255,0.05); border: 1px solid rgba(100,155,255,0.12); }
  .rb3-alert.ok   { background: rgba(80,210,110,0.04); border: 1px solid rgba(80,210,110,0.10); }
  .rb3-alert-icon { font-size: 13px; flex-shrink: 0; margin-top: 0.5px; }
  .rb3-alert-body { font-size: 11.5px; color: rgba(255,255,255,0.48); line-height: 1.55; }
  .rb3-alert-body strong { font-weight: 500; color: rgba(255,255,255,0.78); }
  .rb3-alert-action { font-size: 10.5px; color: rgba(255,255,255,0.26); margin-top: 3px; font-family: 'Geist Mono', monospace; }

  /* Footer buttons */
  .rb3-footer { display: flex; gap: 8px; margin-top: 14px; }
  .rb3-btn-sec { flex: 1; padding: 9px; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; color: rgba(255,255,255,0.36); cursor: pointer; transition: all 100ms; text-align: center; }
  .rb3-btn-sec:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.60); }
  .rb3-btn-prim { flex: 1; padding: 9px; background: rgba(255,255,255,0.90); border: none; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; color: #080808; cursor: pointer; transition: background 100ms; text-align: center; }
  .rb3-btn-prim:hover { background: #fff; }
  .rb3-btn-prim:disabled { opacity: 0.35; cursor: not-allowed; }
`

// SVG circular gauge
function ScoreGauge({ score }) {
  const r = 20, cx = 26, cy = 26
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)
  const color = score >= 80 ? 'rgba(80,210,110,0.85)' : score >= 50 ? 'rgba(255,170,50,0.85)' : 'rgba(255,90,70,0.85)'
  return (
    <svg className="rb3-score-circle" viewBox="0 0 52 52">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontFamily="Geist Mono" fontWeight="400" fill={color}>
        {score}
      </text>
    </svg>
  )
}

export default function RebalancingPage({ investments = [], savings = [], cryptos = [], goals: savedGoals, onSaveGoals }) {
  const [goals, setGoals] = useState(savedGoals || DEFAULT_GOALS)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...goals })

  // Distribució actual
  const current = useMemo(() => {
    const vals = { etf: 0, estalvi: 0, crypto: 0, robo: 0 }
    investments.forEach(inv => {
      const val = inv.qty && inv.currentPrice ? inv.qty * inv.currentPrice : inv.initialValue || 0
      if (['etf','stock'].includes(inv.type))           vals.etf     += val
      else if (inv.type === 'robo')                     vals.robo    += val
      else if (['estalvi','efectiu'].includes(inv.type)) vals.estalvi += val
    })
    savings.forEach(s => { vals.estalvi += s.amount })
    cryptos.forEach(c => { vals.crypto += c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0 })
    const total = Object.values(vals).reduce((a, b) => a + b, 0)
    const pcts  = {}
    Object.entries(vals).forEach(([k, v]) => { pcts[k] = total > 0 ? (v / total) * 100 : 0 })
    return { vals, pcts, total }
  }, [investments, savings, cryptos])

  // Score de rebalanceig: 100 - suma de desviacions absolutes
  const score = useMemo(() => {
    const totalDrift = CATEGORIES.reduce((sum, cat) => {
      return sum + Math.abs((current.pcts[cat.id] || 0) - (goals[cat.id] || 0))
    }, 0)
    return Math.max(0, Math.round(100 - totalDrift * 1.5))
  }, [current, goals])

  const scoreLabel = score >= 85 ? 'Excel·lent' : score >= 65 ? 'Bé' : score >= 40 ? 'Atenció' : 'Rebalanceig necessari'

  // Alertes
  const alerts = useMemo(() => {
    return CATEGORIES
      .map(cat => {
        const goal   = goals[cat.id] || 0
        const actual = current.pcts[cat.id] || 0
        const diff   = actual - goal
        const diffVal = (Math.abs(diff) / 100) * current.total
        if (Math.abs(diff) < DRIFT_THRESHOLD) return null
        return { cat, diff, diffVal, type: diff > 0 ? 'warn' : 'info' }
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  }, [goals, current])

  const draftTotal = Object.values(draft).reduce((a, b) => a + (parseFloat(b) || 0), 0)
  const draftOk    = Math.abs(draftTotal - 100) < 0.5

  const handleSave = () => {
    if (!draftOk) return
    const ng = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, parseFloat(v) || 0]))
    setGoals(ng)
    onSaveGoals?.(ng)
    setEditing(false)
  }

  return (
    <div className="rb3">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="sec-v2-title">Rebalanceig</h2>
        <p className="sec-v2-sub">Compara la distribució actual amb els teus objectius</p>
      </div>

      {/* Score */}
      <div className="rb3-panel">
        <div className="rb3-score-wrap">
          <ScoreGauge score={score} />
          <div className="rb3-score-info">
            <p className="rb3-score-label">Puntuació de rebalanceig</p>
            <p className="rb3-score-val" style={{
              color: score >= 80 ? 'rgba(80,210,110,0.85)' : score >= 50 ? 'rgba(255,170,50,0.85)' : 'rgba(255,90,70,0.85)'
            }}>{scoreLabel}</p>
            <p className="rb3-score-sub">
              {alerts.length === 0 ? 'Totes les categories dins del marge' : `${alerts.length} categoria${alerts.length > 1 ? 'es' : ''} fora de marge (±${DRIFT_THRESHOLD}pp)`}
            </p>
          </div>
        </div>

        {/* Distribució */}
        <div className="rb3-panel-hdr">
          <p className="rb3-panel-title">Assignació actual vs objectiu</p>
          <button className="btn-v2-ico" style={{ fontSize: 11, width: 'auto', padding: '0 10px', height: 28, display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => { setEditing(!editing); setDraft({ ...goals }) }}>
            {editing ? '✕ Cancel·lar' : '⚙ Editar'}
          </button>
        </div>

        {editing ? (
          <>
            <div>
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="rb3-edit-row">
                  <div className="rb3-edit-label">
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    {cat.label}
                  </div>
                  <input type="number" min="0" max="100" step="1"
                    className="rb3-edit-input"
                    value={draft[cat.id] ?? ''}
                    onChange={e => setDraft(d => ({ ...d, [cat.id]: e.target.value }))}
                  />
                  <span className="rb3-edit-pct">%</span>
                </div>
              ))}
            </div>
            <div className="rb3-total-row">
              <span className={draftOk ? 'rb3-total-ok' : 'rb3-total-err'}>
                {draftTotal.toFixed(0)}% {draftOk ? '✓ correcte' : '— ha de sumar exactament 100%'}
              </span>
            </div>
            <div className="rb3-footer">
              <button className="rb3-btn-sec" onClick={() => setEditing(false)}>Cancel·lar</button>
              <button className="rb3-btn-prim" onClick={handleSave} disabled={!draftOk}>Guardar objectius</button>
            </div>
          </>
        ) : (
          CATEGORIES.map(cat => {
            const goal    = goals[cat.id] || 0
            const actual  = current.pcts[cat.id] || 0
            const diff    = actual - goal
            const isOver  = diff > DRIFT_THRESHOLD
            const isUnder = diff < -DRIFT_THRESHOLD
            const diffColor = isOver ? 'rgba(255,170,50,0.85)' : isUnder ? 'rgba(100,155,255,0.85)' : 'rgba(80,210,110,0.75)'
            const diffBg    = isOver ? 'rgba(255,170,50,0.10)' : isUnder ? 'rgba(100,155,255,0.10)' : 'transparent'

            return (
              <div key={cat.id} className="rb3-goal">
                <div className="rb3-goal-left">
                  <p className="rb3-goal-name">
                    <span className="rb3-goal-dot" style={{ background: cat.color }} />
                    {cat.label}
                  </p>
                  <p className="rb3-goal-val">{fmtEur(current.vals[cat.id] || 0)}</p>
                </div>
                <div className="rb3-goal-bars">
                  <div className="rb3-bar-row">
                    <span className="rb3-bar-lbl">obj</span>
                    <div className="rb3-bar-track">
                      <div className="rb3-bar-fill" style={{ width: `${goal}%`, background: cat.color.replace('0.80','0.20').replace('0.50','0.18') }} />
                    </div>
                    <span className="rb3-bar-pct" style={{ color: 'rgba(255,255,255,0.24)' }}>{goal}%</span>
                    <span className="rb3-bar-diff" style={{ color: 'transparent', background: 'transparent' }}>—</span>
                  </div>
                  <div className="rb3-bar-row">
                    <span className="rb3-bar-lbl" style={{ color: cat.color.replace('0.80','0.55') }}>ara</span>
                    <div className="rb3-bar-track">
                      <div className="rb3-bar-fill" style={{ width: `${Math.min(actual, 100)}%`, background: cat.color }} />
                    </div>
                    <span className="rb3-bar-pct" style={{ color: diffColor }}>{actual.toFixed(1)}%</span>
                    <span className="rb3-bar-diff" style={{ color: diffColor, background: diffBg }}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}pp
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Suggeriments */}
      {!editing && (
        <div className="rb3-panel">
          <p className="rb3-panel-title" style={{ marginBottom: 12 }}>Suggeriments d'acció</p>
          <div className="rb3-alerts">
            {alerts.length === 0 ? (
              <div className="rb3-alert ok">
                <span className="rb3-alert-icon" style={{ color: 'rgba(80,210,110,0.80)' }}>✓</span>
                <div className="rb3-alert-body">
                  <strong>Portfoli equilibrat.</strong> Totes les categories estan dins del marge de {DRIFT_THRESHOLD}pp.
                </div>
              </div>
            ) : alerts.map((a, i) => (
              <div key={i} className={`rb3-alert ${a.type}`}>
                <span className="rb3-alert-icon" style={{ color: a.type === 'warn' ? 'rgba(255,170,50,0.82)' : 'rgba(100,155,255,0.82)' }}>
                  {a.type === 'warn' ? '↑' : '↓'}
                </span>
                <div>
                  <div className="rb3-alert-body">
                    <strong>{a.cat.label}</strong> {a.type === 'warn' ? 'sobrerepresentada' : 'infraponderada'}{' '}
                    (<strong style={{ color: a.type === 'warn' ? 'rgba(255,170,50,0.85)' : 'rgba(100,155,255,0.85)' }}>
                      {a.diff >= 0 ? '+' : ''}{a.diff.toFixed(1)}pp
                    </strong>).
                  </div>
                  <div className="rb3-alert-action">
                    → {a.type === 'warn'
                      ? `Desvia ~${fmtEur(a.diffVal)} cap a categories infraponderades`
                      : `Afegeix ~${fmtEur(a.diffVal)} a ${a.cat.label}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}