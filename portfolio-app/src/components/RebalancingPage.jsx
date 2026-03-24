// ─── RebalancingPage.v2.jsx ─────────────────────────────────────────────────
//
// L'usuari defineix objectius d'assignació per categoria (%).
// El component detecta desviacions >5pp i suggereix accions concretes.
//
// Objectius es guarden a Firestore: users/{uid}/settings/rebalancing
//   { goals: { etf: 50, estalvi: 20, crypto: 20, robo: 10 } }
//
// Props:
//   investments, savings, cryptos — per calcular distribució actual
//   goals, onSaveGoals — per llegir/guardar objectius

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
const DRIFT_THRESHOLD = 5 // pp de desviació per alertar

const rbStyles = `
  .rb-v2 { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .rb-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .rb-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); margin-bottom: 14px; }

  /* Goal rows */
  .rb-goal { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .rb-goal:last-child { border-bottom: none; }
  .rb-goal-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .rb-goal-name { font-size: 12px; color: rgba(255,255,255,0.60); width: 140px; flex-shrink: 0; }
  .rb-goal-bars { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .rb-goal-bar-row { display: flex; align-items: center; gap: 6px; }
  .rb-goal-bar-lbl { font-size: 9px; color: rgba(255,255,255,0.22); width: 28px; text-align: right; font-family: 'Geist Mono', monospace; flex-shrink: 0; }
  .rb-goal-track { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
  .rb-goal-fill { height: 100%; border-radius: 2px; transition: width 600ms cubic-bezier(0.4,0,0.2,1); }
  .rb-goal-pct { font-size: 10px; font-family: 'Geist Mono', monospace; width: 34px; text-align: right; flex-shrink: 0; }
  .rb-goal-diff { font-size: 10px; font-family: 'Geist Mono', monospace; width: 42px; text-align: right; flex-shrink: 0; }

  /* Goal editor */
  .rb-editor { display: flex; flex-direction: column; gap: 10px; }
  .rb-editor-row { display: flex; align-items: center; gap: 10px; }
  .rb-editor-label { font-size: 12px; color: rgba(255,255,255,0.55); flex: 1; }
  .rb-editor-input {
    width: 56px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px; padding: 6px 8px; font-family: 'Geist Mono', monospace;
    font-size: 12px; color: rgba(255,255,255,0.75); outline: none; text-align: right;
    transition: border-color 100ms;
  }
  .rb-editor-input:focus { border-color: rgba(255,255,255,0.20); }
  .rb-editor-pct { font-size: 11px; color: rgba(255,255,255,0.28); flex-shrink: 0; }
  .rb-total-indicator { display: flex; justify-content: flex-end; font-size: 11px; font-family: 'Geist Mono', monospace; margin-top: 4px; }
  .rb-total-ok { color: rgba(80,210,110,0.75); }
  .rb-total-err { color: rgba(255,90,70,0.75); }

  /* Alerts */
  .rb-alert { display: flex; align-items: flex-start; gap: 9px; padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; }
  .rb-alert:last-child { margin-bottom: 0; }
  .rb-alert.warn { background: rgba(255,170,50,0.05); border: 1px solid rgba(255,170,50,0.14); }
  .rb-alert.info { background: rgba(100,155,255,0.05); border: 1px solid rgba(100,155,255,0.12); }
  .rb-alert.ok { background: rgba(80,210,110,0.04); border: 1px solid rgba(80,210,110,0.10); }
  .rb-alert-icon { font-size: 11px; flex-shrink: 0; margin-top: 1px; }
  .rb-alert-body { font-size: 11.5px; color: rgba(255,255,255,0.50); line-height: 1.6; }
  .rb-alert-body strong { font-weight: 500; color: rgba(255,255,255,0.78); }
  .rb-alert-action { font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 4px; }

  /* Actions */
  .rb-footer { display: flex; gap: 8px; margin-top: 14px; }
  .rb-btn-sec { flex: 1; padding: 9px; border: 1px solid rgba(255,255,255,0.08); background: transparent; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; color: rgba(255,255,255,0.38); cursor: pointer; transition: all 100ms; text-align: center; }
  .rb-btn-sec:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.62); }
  .rb-btn-prim { flex: 1; padding: 9px; background: rgba(255,255,255,0.90); border: none; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500; color: #080808; cursor: pointer; transition: background 100ms; text-align: center; }
  .rb-btn-prim:hover { background: #fff; }
`

export default function RebalancingPage({ investments = [], savings = [], cryptos = [], goals: savedGoals, onSaveGoals }) {
  const [goals, setGoals] = useState(savedGoals || DEFAULT_GOALS)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...goals })

  // Calcula distribució actual
  const current = useMemo(() => {
    const vals = { etf: 0, estalvi: 0, crypto: 0, robo: 0 }

    investments.forEach(inv => {
      const val = inv.qty && inv.currentPrice ? inv.qty * inv.currentPrice : inv.initialValue || 0
      if (['etf', 'stock'].includes(inv.type))    vals.etf     += val
      else if (inv.type === 'robo')               vals.robo    += val
      else if (['estalvi','efectiu'].includes(inv.type)) vals.estalvi += val
    })
    savings.forEach(s => { vals.estalvi += s.amount })
    cryptos.forEach(c => {
      vals.crypto += c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0
    })

    const total = Object.values(vals).reduce((a, b) => a + b, 0)
    const pcts = {}
    Object.entries(vals).forEach(([k, v]) => { pcts[k] = total > 0 ? (v / total) * 100 : 0 })
    return { vals, pcts, total }
  }, [investments, savings, cryptos])

  // Detecta desviacions
  const alerts = useMemo(() => {
    const list = []
    CATEGORIES.forEach(cat => {
      const goal = goals[cat.id] || 0
      const actual = current.pcts[cat.id] || 0
      const diff = actual - goal
      if (Math.abs(diff) < DRIFT_THRESHOLD) return

      const diffVal = (Math.abs(diff) / 100) * current.total
      if (diff > 0) {
        list.push({
          type: 'warn',
          icon: '↑',
          cat,
          diff,
          msg: <>
            <strong>{cat.label}</strong> sobrerepresentada (<strong style={{ color: 'rgba(255,170,50,0.85)' }}>+{diff.toFixed(1)}pp</strong>).
          </>,
          action: `Considera desviar ~${fmtEur(diffVal)} cap a categories infraponderadas.`,
        })
      } else {
        list.push({
          type: 'info',
          icon: '↓',
          cat,
          diff,
          msg: <>
            <strong>{cat.label}</strong> infraponderada (<strong style={{ color: 'rgba(100,155,255,0.85)' }}>{diff.toFixed(1)}pp</strong>).
          </>,
          action: `Considera afegir ~${fmtEur(diffVal)} a ${cat.label}.`,
        })
      }
    })
    return list.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  }, [goals, current])

  const draftTotal = Object.values(draft).reduce((a, b) => a + (parseFloat(b) || 0), 0)
  const draftOk = Math.abs(draftTotal - 100) < 0.5

  const handleSaveDraft = () => {
    if (!draftOk) return
    const newGoals = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, parseFloat(v) || 0]))
    setGoals(newGoals)
    onSaveGoals?.(newGoals)
    setEditing(false)
  }

  return (
    <div className="rb-v2">
      <style>{`${SHARED_STYLES}${rbStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Rebalanceig</h2>
        <p className="sec-v2-sub">Compara la distribució actual amb els teus objectius</p>
      </div>

      {/* Distribució actual vs objectius */}
      <div className="rb-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="rb-panel-title" style={{ margin: 0 }}>Assignació actual vs objectiu</p>
          <button className="btn-v2-ico" style={{ fontSize: 11, width: 'auto', padding: '0 10px', gap: 5, display: 'flex', alignItems: 'center' }}
            onClick={() => { setEditing(!editing); setDraft({ ...goals }) }}>
            {editing ? 'Cancel·lar' : 'Editar objectius'}
          </button>
        </div>

        {editing ? (
          <>
            <div className="rb-editor">
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="rb-editor-row">
                  <div className="rb-editor-label" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    {cat.label}
                  </div>
                  <input type="number" min="0" max="100" step="1"
                    className="rb-editor-input"
                    value={draft[cat.id] ?? ''}
                    onChange={e => setDraft(d => ({ ...d, [cat.id]: e.target.value }))}
                  />
                  <span className="rb-editor-pct">%</span>
                </div>
              ))}
            </div>
            <div className="rb-total-indicator">
              <span className={draftOk ? 'rb-total-ok' : 'rb-total-err'}>
                Total: {draftTotal.toFixed(0)}% {draftOk ? '✓' : '— ha de sumar 100%'}
              </span>
            </div>
            <div className="rb-footer">
              <button className="rb-btn-sec" onClick={() => setEditing(false)}>Cancel·lar</button>
              <button className="rb-btn-prim" onClick={handleSaveDraft} style={{ opacity: draftOk ? 1 : 0.4, cursor: draftOk ? 'pointer' : 'not-allowed' }}>
                Guardar objectius
              </button>
            </div>
          </>
        ) : (
          CATEGORIES.map(cat => {
            const goal    = goals[cat.id] || 0
            const actual  = current.pcts[cat.id] || 0
            const diff    = actual - goal
            const isOver  = diff > DRIFT_THRESHOLD
            const isUnder = diff < -DRIFT_THRESHOLD

            return (
              <div key={cat.id} className="rb-goal">
                <div className="rb-goal-dot" style={{ background: cat.color }} />
                <div className="rb-goal-name">{cat.label}</div>
                <div className="rb-goal-bars">
                  <div className="rb-goal-bar-row">
                    <span className="rb-goal-bar-lbl">obj</span>
                    <div className="rb-goal-track">
                      <div className="rb-goal-fill" style={{ width: `${goal}%`, background: cat.color.replace('0.80','0.25').replace('0.50','0.20') }} />
                    </div>
                    <span className="rb-goal-pct" style={{ color: 'rgba(255,255,255,0.26)' }}>{goal}%</span>
                    <span className="rb-goal-diff" style={{ color: 'transparent' }}>—</span>
                  </div>
                  <div className="rb-goal-bar-row">
                    <span className="rb-goal-bar-lbl" style={{ color: cat.color.replace('0.80','0.60').replace('0.50','0.50') }}>ara</span>
                    <div className="rb-goal-track">
                      <div className="rb-goal-fill" style={{ width: `${actual}%`, background: cat.color }} />
                    </div>
                    <span className="rb-goal-pct" style={{
                      color: isOver ? 'rgba(255,170,50,0.85)' : isUnder ? 'rgba(100,155,255,0.85)' : 'rgba(80,210,110,0.80)'
                    }}>{actual.toFixed(1)}%</span>
                    <span className="rb-goal-diff" style={{
                      color: isOver ? 'rgba(255,170,50,0.75)' : isUnder ? 'rgba(100,155,255,0.75)' : 'rgba(80,210,110,0.60)'
                    }}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}pp
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Alertes i suggeriments */}
      {!editing && (
        <div className="rb-panel">
          <p className="rb-panel-title">Suggeriments</p>
          {alerts.length === 0 ? (
            <div className="rb-alert ok">
              <span className="rb-alert-icon" style={{ color: 'rgba(80,210,110,0.75)' }}>✓</span>
              <div className="rb-alert-body">
                <strong>Portfoli ben equilibrat.</strong> Totes les categories estan dins del marge de {DRIFT_THRESHOLD}pp dels objectius.
              </div>
            </div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className={`rb-alert ${a.type}`}>
                <span className="rb-alert-icon" style={{
                  color: a.type === 'warn' ? 'rgba(255,170,50,0.80)' : 'rgba(100,155,255,0.80)'
                }}>{a.icon}</span>
                <div>
                  <div className="rb-alert-body">{a.msg}</div>
                  <div className="rb-alert-action">{a.action}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

