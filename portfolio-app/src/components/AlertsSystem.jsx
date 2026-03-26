import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'

// ─── Notificació del navegador ────────────────────────────────────────────────

async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

function sendBrowserNotification(title, body, icon = '/favicon.ico') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, {
      body,
      icon,
      badge: '/favicon.ico',
      tag: 'cartera-alert', // evita duplicats
      renotify: true,
    })
    // Tanca automàticament als 8 segons
    setTimeout(() => n.close(), 8000)
    // Porta al focus quan es clica
    n.onclick = () => { window.focus(); n.close() }
  } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlerts(uid) {
  const [alerts, setAlerts] = useState([])
  // Guarda els ids ja disparats en aquesta sessió per no repetir notificació
  const notifiedRef = useRef(new Set())

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
      ...alert, triggered: false, createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeAlert = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'alerts', id))
  }, [uid])

  const markTriggered = useCallback(async (id, label) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'alerts', id), {
      triggered: true, triggeredAt: new Date().toISOString(),
    })
    // Notificació del navegador
    if (!notifiedRef.current.has(id)) {
      notifiedRef.current.add(id)
      sendBrowserNotification(
        '🔔 Alerta de Cartera',
        label || 'Una alerta s\'ha activat',
      )
    }
  }, [uid])

  const checkAlerts = useCallback((investments, cryptos, totalPortfolio, goals, currentPcts) => {
    alerts.forEach(alert => {
      if (alert.triggered) return
      let shouldTrigger = false
      let notifLabel = alert.label || ''

      if (alert.type === 'price_above' || alert.type === 'price_below') {
        const assets = [...investments, ...cryptos]
        const asset  = assets.find(a => a.id === alert.assetId || a.ticker === alert.ticker)
        if (!asset?.currentPrice) return
        if (alert.type === 'price_above' && asset.currentPrice >= alert.targetPrice) {
          shouldTrigger = true
          notifLabel = notifLabel || `${asset.name} ha superat ${fmtEur(alert.targetPrice)}`
        }
        if (alert.type === 'price_below' && asset.currentPrice <= alert.targetPrice) {
          shouldTrigger = true
          notifLabel = notifLabel || `${asset.name} ha caigut per sota ${fmtEur(alert.targetPrice)}`
        }
      }

      if (alert.type === 'milestone' && totalPortfolio >= alert.targetValue) {
        shouldTrigger = true
        notifLabel = notifLabel || `El portfoli ha superat ${fmtEur(alert.targetValue)}`
      }

      if (alert.type === 'drift') {
        const actual = currentPcts[alert.categoryId] || 0
        const goal   = goals[alert.categoryId] || 0
        if (Math.abs(actual - goal) >= alert.threshold) {
          shouldTrigger = true
          notifLabel = notifLabel || `Desviació de ${alert.categoryId} supera ${alert.threshold}pp`
        }
      }

      if (shouldTrigger) markTriggered(alert.id, notifLabel)
    })
  }, [alerts, markTriggered])

  return { alerts, addAlert, removeAlert, checkAlerts }
}

// ─── Component ────────────────────────────────────────────────────────────────

const ALERT_TYPES = [
  { id: 'price_above', label: 'Preu per sobre de', icon: '↑' },
  { id: 'price_below', label: 'Preu per sota de',  icon: '↓' },
  { id: 'milestone',   label: 'Portfoli supera',   icon: '★' },
  { id: 'drift',       label: 'Desviació objectiu',icon: '⚡' },
]

const styles = `
  .al-sys { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .al-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }
  .al-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.48); margin-bottom: 14px; }

  /* Notif banner */
  .al-notif-banner { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 7px; border: 1px solid; margin-bottom: 0; font-size: 12px; line-height: 1.5; cursor: pointer; transition: opacity 100ms; }
  .al-notif-banner:active { opacity: 0.7; }
  .al-notif-banner.granted { background: rgba(80,210,110,0.06); border-color: rgba(80,210,110,0.18); color: rgba(80,210,110,0.80); }
  .al-notif-banner.default { background: rgba(255,170,50,0.06); border-color: rgba(255,170,50,0.18); color: rgba(255,170,50,0.80); }
  .al-notif-banner.denied  { background: rgba(255,90,70,0.06);  border-color: rgba(255,90,70,0.18);  color: rgba(255,90,70,0.80); }
  .al-notif-text { flex: 1; color: rgba(255,255,255,0.55); }
  .al-notif-text strong { font-weight: 500; }

  .al-card { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .al-card:last-child { border-bottom: none; }
  .al-card-icon { width: 28px; height: 28px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
  .al-card-body { flex: 1; min-width: 0; }
  .al-card-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.72); }
  .al-card-sub { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 2px; font-family: 'Geist Mono', monospace; }
  .al-card-status { font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-top: 2px; }
  .al-card-status.active    { background: rgba(100,155,255,0.12); color: rgba(100,155,255,0.80); }
  .al-card-status.triggered { background: rgba(80,210,110,0.10);  color: rgba(80,210,110,0.80); }
  .al-card-del { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: 4px; cursor: pointer; color: rgba(255,255,255,0.18); transition: all 100ms; flex-shrink: 0; }
  .al-card-del:hover { color: rgba(255,90,70,0.65); background: rgba(255,50,30,0.06); }
  .al-triggered-badge { font-size: 9px; color: rgba(255,255,255,0.22); font-style: italic; margin-top: 2px; display: block; }

  .al-form { display: flex; flex-direction: column; gap: 11px; }
  .al-form-lbl { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: block; }
  .al-form-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 16px; color: rgba(255,255,255,0.80); outline: none; transition: border-color 100ms; box-sizing: border-box; touch-action: manipulation; }
  .al-form-inp:focus { border-color: rgba(255,255,255,0.20); }
  .al-form-inp::placeholder { color: rgba(255,255,255,0.18); }
  .al-form-select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 16px; color: rgba(255,255,255,0.80); outline: none; cursor: pointer; touch-action: manipulation; }
  .al-form-select option { background: #111; }
  .al-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .al-form-footer { display: flex; gap: 8px; margin-top: 4px; }
  .al-type-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; }
  .al-type-btn { padding: 8px 10px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); cursor: pointer; font-family: 'Geist', sans-serif; font-size: 11px; color: rgba(255,255,255,0.36); transition: all 100ms; display: flex; align-items: center; gap: 7px; -webkit-tap-highlight-color: transparent; }
  .al-type-btn.on { border-color: rgba(255,255,255,0.20); color: rgba(255,255,255,0.80); background: rgba(255,255,255,0.07); }

  .al-empty { padding: 36px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
  .al-empty-sub { font-size: 10px; color: rgba(255,255,255,0.14); margin-top: 4px; }

  .al-btn-cancel { flex: 1; padding: 10px; border: 1px solid rgba(255,255,255,0.07); background: transparent; color: rgba(255,255,255,0.34); border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 13px; cursor: pointer; }
  .al-btn-submit { flex: 1; padding: 10px; background: rgba(255,255,255,0.92); border: none; color: #080808; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
  .al-btn-submit:hover { background: #fff; }
`

const alertIconBg = (type) => {
  if (type === 'price_above') return { bg: 'rgba(80,210,110,0.10)',  color: 'rgba(80,210,110,0.80)' }
  if (type === 'price_below') return { bg: 'rgba(255,90,70,0.10)',   color: 'rgba(255,90,70,0.80)' }
  if (type === 'milestone')   return { bg: 'rgba(255,170,70,0.10)',  color: 'rgba(255,170,70,0.80)' }
  return { bg: 'rgba(100,155,255,0.10)', color: 'rgba(100,155,255,0.80)' }
}

export default function AlertsPage({ investments = [], cryptos = [], alerts, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false)
  const [notifPerm, setNotifPerm] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  const [form, setForm] = useState({
    type: 'price_above', assetId: '', targetPrice: '',
    targetValue: '', categoryId: 'etf', threshold: '5', label: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const allAssets = useMemo(() => [
    ...investments.map(i => ({ id: i.id, name: i.name, ticker: i.ticker, currentPrice: i.currentPrice })),
    ...cryptos.map(c => ({ id: c.id, name: c.name, ticker: c.symbol, currentPrice: c.currentPrice })),
  ], [investments, cryptos])

  const handleRequestPerm = async () => {
    const result = await requestNotificationPermission()
    setNotifPerm(result)
  }

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
    setForm({ type: 'price_above', assetId: '', targetPrice: '', targetValue: '', categoryId: 'etf', threshold: '5', label: '' })
  }

  const alertLabel = (a) => {
    if (a.label) return a.label
    if (a.type === 'price_above') return `${a.assetName || a.ticker} supera ${fmtEur(a.targetPrice)}`
    if (a.type === 'price_below') return `${a.assetName || a.ticker} cau per sota ${fmtEur(a.targetPrice)}`
    if (a.type === 'milestone')   return `Portfoli supera ${fmtEur(a.targetValue)}`
    if (a.type === 'drift')       return `Desviació ${a.categoryId} > ${a.threshold}pp`
    return 'Alerta'
  }

  const activeAlerts    = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a =>  a.triggered)

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

      {/* Banner de permisos de notificació */}
      {notifPerm === 'unsupported' ? null : notifPerm === 'granted' ? (
        <div className="al-notif-banner granted" style={{ cursor: 'default' }}>
          <span>🔔</span>
          <span className="al-notif-text"><strong>Notificacions actives.</strong> T'avisarem quan una alerta es dispari.</span>
        </div>
      ) : notifPerm === 'denied' ? (
        <div className="al-notif-banner denied" style={{ cursor: 'default' }}>
          <span>🔕</span>
          <span className="al-notif-text"><strong>Notificacions bloquejades.</strong> Activa-les manualment des de la configuració del navegador.</span>
        </div>
      ) : (
        <div className="al-notif-banner default" onClick={handleRequestPerm}>
          <span>🔔</span>
          <span className="al-notif-text"><strong>Activa les notificacions</strong> per rebre un avís quan una alerta es dispari, fins i tot en segon pla.</span>
          <span style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>Activar →</span>
        </div>
      )}

      {/* Formulari nova alerta */}
      {showForm && (
        <div className="al-panel">
          <p className="al-panel-title">Nova alerta</p>
          <div className="al-form">
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

            <div>
              <label className="al-form-lbl">Nom (opcional)</label>
              <input className="al-form-inp" placeholder="ex: Bitcoin ATH propera" value={form.label} onChange={e => set('label', e.target.value)} />
            </div>

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
                  <input type="number" inputMode="decimal" step="any" className="al-form-inp"
                    style={{ fontFamily: "'Geist Mono',monospace", textAlign: 'right' }}
                    placeholder="0.00" value={form.targetPrice} onChange={e => set('targetPrice', e.target.value)} />
                </div>
              </div>
            )}

            {form.type === 'milestone' && (
              <div>
                <label className="al-form-lbl">Valor total objectiu (€)</label>
                <input type="number" inputMode="decimal" step="1000" className="al-form-inp"
                  style={{ fontFamily: "'Geist Mono',monospace", textAlign: 'right' }}
                  placeholder="25000" value={form.targetValue} onChange={e => set('targetValue', e.target.value)} />
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
                  <input type="number" inputMode="decimal" min="1" max="50" className="al-form-inp"
                    style={{ fontFamily: "'Geist Mono',monospace", textAlign: 'right' }}
                    placeholder="5" value={form.threshold} onChange={e => set('threshold', e.target.value)} />
                </div>
              </div>
            )}

            <div className="al-form-footer">
              <button className="al-btn-cancel" onClick={() => setShowForm(false)}>Cancel·lar</button>
              <button className="al-btn-submit" onClick={handleSubmit}>Crear alerta</button>
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
              <div className="al-card-icon" style={{ background: bg, color }}>{ALERT_TYPES.find(t => t.id === a.type)?.icon || '!'}</div>
              <div className="al-card-body">
                <p className="al-card-title">{alertLabel(a)}</p>
                <p className="al-card-sub">
                  {a.type === 'price_above' || a.type === 'price_below'
                    ? `${a.assetName || a.ticker}${a.currentPrice ? ` · ara ${fmtEur(a.currentPrice)}` : ''}`
                    : a.type === 'milestone' ? 'Portfoli total'
                    : `Desviació > ${a.threshold}pp`}
                </p>
                <span className="al-card-status active">Activa</span>
              </div>
              <button className="al-card-del" onClick={() => onRemove(a.id)}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      {/* Historial */}
      {triggeredAlerts.length > 0 && (
        <div className="al-panel">
          <p className="al-panel-title">Historial</p>
          {triggeredAlerts.map(a => {
            const { bg, color } = alertIconBg(a.type)
            return (
              <div key={a.id} className="al-card" style={{ opacity: 0.55 }}>
                <div className="al-card-icon" style={{ background: bg, color }}>{ALERT_TYPES.find(t => t.id === a.type)?.icon || '!'}</div>
                <div className="al-card-body">
                  <p className="al-card-title">{alertLabel(a)}</p>
                  <span className="al-card-status triggered">Disparada</span>
                  {a.triggeredAt && (
                    <span className="al-triggered-badge">
                      {new Date(a.triggeredAt).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <button className="al-card-del" onClick={() => onRemove(a.id)}>
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