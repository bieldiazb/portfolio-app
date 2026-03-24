// ─── AlertsSystem.jsx ───────────────────────────────────────────────────────
// Component + hook per gestionar alertes de preu i rebalanceig.
// Les alertes es guarden a Firestore: users/{uid}/alerts/{id}
//
// Tipus d'alerta:
//   price_above  — actiu supera un preu
//   price_below  — actiu cau per sota d'un preu
//   drift        — categoria s'allunya dels objectius >X pp
//   milestone    — portfoli total supera un valor

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAlerts(uid) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'alerts'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [uid])

  const addAlert = useCallback(async (alert) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'alerts'), {
      ...alert,
      triggered: false,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeAlert = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'alerts', id))
  }, [uid])

  const markTriggered = useCallback(async (id) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'alerts', id), {
      triggered: true, triggeredAt: new Date().toISOString(),
    })
  }, [uid])

  // Comprova alertes contra les dades actuals
  const checkAlerts = useCallback((investments, cryptos, totalPortfolio, goals, currentPcts) => {
    alerts.forEach(alert => {
      if (alert.triggered) return

      let shouldTrigger = false

      if (alert.type === 'price_above' || alert.type === 'price_below') {
        const assets = [...investments, ...cryptos]
        const asset  = assets.find(a => a.id === alert.assetId || a.ticker === alert.ticker)
        if (!asset?.currentPrice) return
        if (alert.type === 'price_above' && asset.currentPrice >= alert.targetPrice) shouldTrigger = true
        if (alert.type === 'price_below' && asset.currentPrice <= alert.targetPrice) shouldTrigger = true
      }

      if (alert.type === 'milestone') {
        if (totalPortfolio >= alert.targetValue) shouldTrigger = true
      }

      if (alert.type === 'drift') {
        const actual = currentPcts[alert.categoryId] || 0
        const goal   = goals[alert.categoryId] || 0
        if (Math.abs(actual - goal) >= alert.threshold) shouldTrigger = true
      }

      if (shouldTrigger) markTriggered(alert.id)
    })
  }, [alerts, markTriggered])

  return { alerts, addAlert, removeAlert, checkAlerts }
}

// ─── Component ───────────────────────────────────────────────────────────────

const ALERT_TYPES = [
  { id: 'price_above', label: 'Preu per sobre de',  icon: '↑' },
  { id: 'price_below', label: 'Preu per sota de',   icon: '↓' },
  { id: 'milestone',   label: 'Portfoli supera',    icon: '★' },
  { id: 'drift',       label: 'Desviació objectiu', icon: '⚡' },
]

const styles = `
  .al-sys { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .al-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .al-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); margin-bottom: 14px; }

  /* Alert cards */
  .al-card { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .al-card:last-child { border-bottom: none; }
  .al-card-icon { width: 28px; height: 28px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
  .al-card-body { flex: 1; min-width: 0; }
  .al-card-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.72); }
  .al-card-sub { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; font-family: 'Geist Mono', monospace; }
  .al-card-status { font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; margin-top: 2px; display: inline-block; }
  .al-card-status.active   { background: rgba(100,155,255,0.12); color: rgba(100,155,255,0.80); }
  .al-card-status.triggered{ background: rgba(80,210,110,0.10);  color: rgba(80,210,110,0.80);  }
  .al-card-del { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 4px; cursor: pointer; color: rgba(255,255,255,0.18); transition: all 100ms; flex-shrink: 0; }
  .al-card-del:hover { color: rgba(255,90,70,0.65); background: rgba(255,50,30,0.06); }

  .al-triggered-badge { font-size: 9px; color: rgba(255,255,255,0.22); font-style: italic; margin-top: 2px; display: block; }

  /* Form */
  .al-form { display: flex; flex-direction: column; gap: 11px; }
  .al-form-lbl { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: block; }
  .al-form-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.80); outline: none; transition: border-color 100ms; }
  .al-form-inp:focus { border-color: rgba(255,255,255,0.20); }
  .al-form-inp::placeholder { color: rgba(255,255,255,0.18); }
  .al-form-select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 13px; color: rgba(255,255,255,0.80); outline: none; cursor: pointer; }
  .al-form-select option { background: #111; }
  .al-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .al-form-footer { display: flex; gap: 8px; margin-top: 4px; }

  .al-type-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; }
  .al-type-btn { padding: 8px 10px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); cursor: pointer; font-family: 'Geist', sans-serif; font-size: 11px; color: rgba(255,255,255,0.36); transition: all 100ms; display: flex; align-items: center; gap: 7px; }
  .al-type-btn:hover { border-color: rgba(255,255,255,0.14); color: rgba(255,255,255,0.62); background: rgba(255,255,255,0.05); }
  .al-type-btn.on { border-color: rgba(255,255,255,0.20); color: rgba(255,255,255,0.80); background: rgba(255,255,255,0.07); }

  .al-empty { padding: 36px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
  .al-empty-sub { font-size: 10px; color: rgba(255,255,255,0.14); margin-top: 4px; }
`

export default function AlertsPage({ investments = [], cryptos = [], alerts, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'price_above', assetId: '', ticker: '', targetPrice: '', targetValue: '', categoryId: 'etf', threshold: '5', label: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const allAssets = useMemo(() => [
    ...investments.map(i => ({ id: i.id, name: i.name, ticker: i.ticker, currentPrice: i.currentPrice })),
    ...cryptos.map(c => ({ id: c.id, name: c.name, ticker: c.symbol, currentPrice: c.currentPrice })),
  ], [investments, cryptos])

  const handleSubmit = () => {
    const base = { type: form.type, label: form.label }
    if (form.type === 'price_above' || form.type === 'price_below') {
      const asset = allAssets.find(a => a.id === form.assetId)
      if (!asset || !form.targetPrice) return
      onAdd({ ...base, assetId: form.assetId, ticker: asset.ticker, assetName: asset.name, targetPrice: parseFloat(form.targetPrice) })
    } else if (form.type === 'milestone') {
      if (!form.targetValue) return
      onAdd({ ...base, targetValue: parseFloat(form.targetValue) })
    } else if (form.type === 'drift') {
      onAdd({ ...base, categoryId: form.categoryId, threshold: parseInt(form.threshold) || 5 })
    }
    setShowForm(false)
    setForm({ type: 'price_above', assetId: '', ticker: '', targetPrice: '', targetValue: '', categoryId: 'etf', threshold: '5', label: '' })
  }

  const activeAlerts    = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  const alertLabel = (a) => {
    if (a.label) return a.label
    if (a.type === 'price_above') return `${a.assetName || a.ticker} supera ${fmtEur(a.targetPrice)}`
    if (a.type === 'price_below') return `${a.assetName || a.ticker} cau per sota ${fmtEur(a.targetPrice)}`
    if (a.type === 'milestone')   return `Portfoli supera ${fmtEur(a.targetValue)}`
    if (a.type === 'drift')       return `Desviació ${a.categoryId} > ${a.threshold}pp`
    return 'Alerta'
  }

  const alertIcon = (type) => {
    const t = ALERT_TYPES.find(x => x.id === type)
    return t?.icon || '!'
  }

  const alertIconBg = (type) => {
    if (type === 'price_above') return { bg: 'rgba(80,210,110,0.10)', color: 'rgba(80,210,110,0.80)' }
    if (type === 'price_below') return { bg: 'rgba(255,90,70,0.10)',  color: 'rgba(255,90,70,0.80)' }
    if (type === 'milestone')   return { bg: 'rgba(255,170,70,0.10)', color: 'rgba(255,170,70,0.80)' }
    return { bg: 'rgba(100,155,255,0.10)', color: 'rgba(100,155,255,0.80)' }
  }

  return (
    <div className="al-sys">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="sec-v2-title">Alertes</h2>
          <p className="sec-v2-sub">{activeAlerts.length} alerta{activeAlerts.length !== 1 ? 'es' : ''} activa{activeAlerts.length !== 1 ? 'es' : ''}</p>
        </div>
        <button className="btn-v2-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel·lar' : '+ Nova alerta'}
        </button>
      </div>

      {/* Formulari nova alerta */}
      {showForm && (
        <div className="al-panel">
          <p className="al-panel-title">Nova alerta</p>
          <div className="al-form">
            {/* Tipus */}
            <div>
              <label className="al-form-lbl">Tipus</label>
              <div className="al-type-grid">
                {ALERT_TYPES.map(t => (
                  <button key={t.id} className={`al-type-btn${form.type === t.id ? ' on' : ''}`} onClick={() => set('type', t.id)}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nom personalitzat */}
            <div>
              <label className="al-form-lbl">Nom (opcional)</label>
              <input className="al-form-inp" placeholder="ex: Bitcoin ATH propera" value={form.label} onChange={e => set('label', e.target.value)} />
            </div>

            {/* Camps per tipus */}
            {(form.type === 'price_above' || form.type === 'price_below') && (
              <div className="al-grid2">
                <div>
                  <label className="al-form-lbl">Actiu</label>
                  <select className="al-form-select" value={form.assetId} onChange={e => set('assetId', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {allAssets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.ticker || '—'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="al-form-lbl">Preu objectiu (€)</label>
                  <input type="number" step="any" className="al-form-inp" style={{ fontFamily: "'Geist Mono', monospace", textAlign: 'right' }}
                    placeholder="0.00" value={form.targetPrice} onChange={e => set('targetPrice', e.target.value)} />
                </div>
              </div>
            )}

            {form.type === 'milestone' && (
              <div>
                <label className="al-form-lbl">Valor total objectiu (€)</label>
                <input type="number" step="1000" className="al-form-inp" style={{ fontFamily: "'Geist Mono', monospace", textAlign: 'right' }}
                  placeholder="25.000" value={form.targetValue} onChange={e => set('targetValue', e.target.value)} />
              </div>
            )}

            {form.type === 'drift' && (
              <div className="al-grid2">
                <div>
                  <label className="al-form-lbl">Categoria</label>
                  <select className="al-form-select" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                    <option value="etf">ETF / Renda variable</option>
                    <option value="estalvi">Estalvi / Liquiditat</option>
                    <option value="crypto">Crypto</option>
                    <option value="robo">Robo Advisor</option>
                  </select>
                </div>
                <div>
                  <label className="al-form-lbl">Llindar (pp)</label>
                  <input type="number" min="1" max="50" className="al-form-inp" style={{ fontFamily: "'Geist Mono', monospace", textAlign: 'right' }}
                    placeholder="5" value={form.threshold} onChange={e => set('threshold', e.target.value)} />
                </div>
              </div>
            )}

            <div className="al-form-footer">
              <button className="v2-btn-cancel" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel·lar</button>
              <button className="v2-btn-submit" style={{ flex: 1 }} onClick={handleSubmit}>Crear alerta</button>
            </div>
          </div>
        </div>
      )}

      {/* Alertes actives */}
      <div className="al-panel">
        <p className="al-panel-title">Actives</p>
        {activeAlerts.length === 0 ? (
          <div className="al-empty">
            <p>Cap alerta activa</p>
            <p className="al-empty-sub">Crea la primera alerta per rebre notificacions</p>
          </div>
        ) : activeAlerts.map(a => {
          const { bg, color } = alertIconBg(a.type)
          return (
            <div key={a.id} className="al-card">
              <div className="al-card-icon" style={{ background: bg, color }}>{alertIcon(a.type)}</div>
              <div className="al-card-body">
                <p className="al-card-title">{alertLabel(a)}</p>
                <p className="al-card-sub">
                  {a.type === 'price_above' || a.type === 'price_below'
                    ? `Preu actual: ${a.assetName || a.ticker}`
                    : a.type === 'milestone' ? 'Portfoli total'
                    : `Desviació >${a.threshold}pp`
                  }
                </p>
                <span className="al-card-status active">Activa</span>
              </div>
              <button className="al-card-del" onClick={() => onRemove(a.id)} title="Eliminar">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Alertes disparades */}
      {triggeredAlerts.length > 0 && (
        <div className="al-panel">
          <p className="al-panel-title">Historial</p>
          {triggeredAlerts.map(a => {
            const { bg, color } = alertIconBg(a.type)
            return (
              <div key={a.id} className="al-card" style={{ opacity: 0.55 }}>
                <div className="al-card-icon" style={{ background: bg, color }}>{alertIcon(a.type)}</div>
                <div className="al-card-body">
                  <p className="al-card-title">{alertLabel(a)}</p>
                  <span className="al-card-status triggered">Disparada</span>
                  {a.triggeredAt && (
                    <span className="al-triggered-badge">
                      {new Date(a.triggeredAt).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <button className="al-card-del" onClick={() => onRemove(a.id)} title="Eliminar">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}