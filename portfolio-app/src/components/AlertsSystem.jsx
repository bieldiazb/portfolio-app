import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore'

async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

function sendBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, icon: '/favicon.ico', tag: 'cartera-alert', renotify: true })
    setTimeout(() => n.close(), 8000)
    n.onclick = () => { window.focus(); n.close() }
  } catch {}
}

export function useAlerts(uid) {
  const [alerts, setAlerts] = useState([])
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'alerts'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [uid])

  const addAlert = useCallback(async (alert) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'alerts'), { ...alert, triggered: false, createdAt: serverTimestamp() })
  }, [uid])

  const removeAlert = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'alerts', id))
  }, [uid])

  const markTriggered = useCallback(async (id, label) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'alerts', id), { triggered: true, triggeredAt: new Date().toISOString() })
    if (!notifiedRef.current.has(id)) {
      notifiedRef.current.add(id)
      sendBrowserNotification('🔔 Alerta de Cartera', label || "Una alerta s'ha activat")
    }
  }, [uid])

  const checkAlerts = useCallback((investments, cryptos, totalPortfolio, goals, currentPcts) => {
    alerts.forEach(alert => {
      if (alert.triggered) return
      let shouldTrigger = false, notifLabel = alert.label || ''
      if (alert.type === 'price_above' || alert.type === 'price_below') {
        const asset = [...investments, ...cryptos].find(a => a.id === alert.assetId || a.ticker === alert.ticker)
        if (!asset?.currentPrice) return
        if (alert.type === 'price_above' && asset.currentPrice >= alert.targetPrice) { shouldTrigger = true; notifLabel = notifLabel || `${asset.name} ha superat ${fmtEur(alert.targetPrice)}` }
        if (alert.type === 'price_below' && asset.currentPrice <= alert.targetPrice) { shouldTrigger = true; notifLabel = notifLabel || `${asset.name} ha caigut per sota ${fmtEur(alert.targetPrice)}` }
      }
      if (alert.type === 'milestone' && totalPortfolio >= alert.targetValue) { shouldTrigger = true; notifLabel = notifLabel || `El portfoli ha superat ${fmtEur(alert.targetValue)}` }
      if (alert.type === 'drift') {
        const actual = currentPcts[alert.categoryId] || 0, goal = goals[alert.categoryId] || 0
        if (Math.abs(actual - goal) >= alert.threshold) { shouldTrigger = true; notifLabel = notifLabel || `Desviació de ${alert.categoryId} supera ${alert.threshold}pp` }
      }
      if (shouldTrigger) markTriggered(alert.id, notifLabel)
    })
  }, [alerts, markTriggered])

  return { alerts, addAlert, removeAlert, checkAlerts }
}

const ALERT_TYPES = [
  { id: 'price_above', label: 'Preu per sobre de', icon: '↑' },
  { id: 'price_below', label: 'Preu per sota de',  icon: '↓' },
  { id: 'milestone',   label: 'Portfoli supera',   icon: '★' },
  { id: 'drift',       label: 'Desviació objectiu', icon: '⚡' },
]

const alertIconStyle = (type) => {
  if (type === 'price_above') return { bg:'rgba(80,210,110,0.10)',  color:'rgba(80,210,110,0.85)'  }
  if (type === 'price_below') return { bg:'rgba(255,90,70,0.10)',   color:'rgba(255,90,70,0.85)'   }
  if (type === 'milestone')   return { bg:'rgba(255,170,70,0.10)',  color:'rgba(255,170,70,0.85)'  }
  return                             { bg:'rgba(100,155,255,0.10)', color:'rgba(100,155,255,0.85)' }
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

  .als { font-family:'Geist',sans-serif; display:flex; flex-direction:column; gap:12px; }
  .als-title { font-size:18px; font-weight:600; color:rgba(255,255,255,0.90); letter-spacing:-0.3px; margin-bottom:4px; }
  .als-sub { font-size:13px; color:rgba(255,255,255,0.35); }
  .als-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:0; }

  .als-panel { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:20px; }
  .als-panel-title { font-size:13px; font-weight:600; color:rgba(255,255,255,0.65); margin-bottom:14px; }

  /* Notif banner */
  .als-banner { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:12px; border:1px solid; font-size:12px; line-height:1.5; cursor:pointer; transition:opacity 100ms; }
  .als-banner:active { opacity:0.75; }
  .als-banner.granted { background:rgba(80,210,110,0.06); border-color:rgba(80,210,110,0.18); }
  .als-banner.default { background:rgba(255,170,50,0.06); border-color:rgba(255,170,50,0.18); }
  .als-banner.denied  { background:rgba(255,90,70,0.06);  border-color:rgba(255,90,70,0.18); }
  .als-banner-text { flex:1; color:rgba(255,255,255,0.55); }
  .als-banner-text strong { font-weight:600; color:rgba(255,255,255,0.80); }

  /* Alert card */
  .als-card { display:flex; align-items:flex-start; gap:12px; padding:11px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .als-card:last-child { border-bottom:none; }
  .als-card-ico { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
  .als-card-body { flex:1; min-width:0; }
  .als-card-title { font-size:13px; font-weight:500; color:rgba(255,255,255,0.78); margin-bottom:3px; }
  .als-card-sub { font-size:11px; color:rgba(255,255,255,0.28); font-family:'Geist Mono',monospace; margin-bottom:4px; }
  .als-status { display:inline-flex; align-items:center; font-size:10px; font-weight:600; padding:2px 8px; border-radius:10px; }
  .als-status.active    { background:rgba(100,155,255,0.12); color:rgba(100,155,255,0.85); }
  .als-status.triggered { background:rgba(80,210,110,0.10);  color:rgba(80,210,110,0.85); }
  .als-card-del { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:50%; cursor:pointer; color:rgba(255,255,255,0.18); transition:all 100ms; flex-shrink:0; margin-top:2px; }
  .als-card-del:hover { color:rgba(255,90,70,0.75); background:rgba(255,50,30,0.08); }
  .als-triggered-at { font-size:10px; color:rgba(255,255,255,0.20); font-style:italic; margin-top:3px; display:block; }

  /* Boto nova alerta */
  .als-add-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 16px; border-radius:20px; background:rgba(255,255,255,0.92); border:none; font-family:'Geist',sans-serif; font-size:13px; font-weight:700; color:#000; cursor:pointer; transition:background 100ms; }
  .als-add-btn:hover { background:#fff; }
  .als-add-btn.cancel { background:transparent; border:1px solid rgba(255,255,255,0.09); color:rgba(255,255,255,0.45); font-weight:600; }
  .als-add-btn.cancel:hover { background:rgba(255,255,255,0.05); }

  /* Form */
  .als-form { display:flex; flex-direction:column; gap:14px; }
  .als-lbl { display:block; font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
  .als-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 13px; font-family:'Geist',sans-serif; font-size:15px; color:rgba(255,255,255,0.85); outline:none; transition:border-color 100ms; box-sizing:border-box; touch-action:manipulation; }
  .als-inp:focus { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.07); }
  .als-inp::placeholder { color:rgba(255,255,255,0.18); }
  .als-inp.mono { font-family:'Geist Mono',monospace; text-align:right; }
  .als-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:11px 13px; font-family:'Geist',sans-serif; font-size:15px; color:rgba(255,255,255,0.85); outline:none; cursor:pointer; touch-action:manipulation; }
  .als-select option { background:#111; }
  .als-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

  .als-type-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .als-type-btn { padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03); cursor:pointer; font-family:'Geist',sans-serif; font-size:12px; font-weight:500; color:rgba(255,255,255,0.38); transition:all 100ms; display:flex; align-items:center; gap:8px; -webkit-tap-highlight-color:transparent; }
  .als-type-btn:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.60); }
  .als-type-btn.on { border-color:rgba(255,255,255,0.20); color:rgba(255,255,255,0.85); background:rgba(255,255,255,0.08); }

  .als-form-footer { display:flex; gap:10px; margin-top:4px; }
  .als-btn-cancel { flex:1; padding:12px; border:1px solid rgba(255,255,255,0.09); background:transparent; border-radius:20px; font-family:'Geist',sans-serif; font-size:14px; font-weight:500; color:rgba(255,255,255,0.40); cursor:pointer; }
  .als-btn-ok { flex:1; padding:12px; border:none; border-radius:20px; font-family:'Geist',sans-serif; font-size:14px; font-weight:700; background:#fff; color:#000; cursor:pointer; transition:background 100ms; }
  .als-btn-ok:hover { background:rgba(255,255,255,0.90); }

  .als-empty { padding:36px 0; text-align:center; }
  .als-empty-main { font-size:14px; color:rgba(255,255,255,0.30); font-weight:500; margin-bottom:4px; }
  .als-empty-sub { font-size:11px; color:rgba(255,255,255,0.18); }
`

export default function AlertsPage({ investments=[], cryptos=[], alerts, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false)
  const [notifPerm, setNotifPerm] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported')
  const [form, setForm] = useState({ type:'price_above', assetId:'', targetPrice:'', targetValue:'', categoryId:'etf', threshold:'5', label:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const allAssets = useMemo(() => [
    ...investments.map(i => ({ id:i.id, name:i.name, ticker:i.ticker, currentPrice:i.currentPrice })),
    ...cryptos.map(c => ({ id:c.id, name:c.name, ticker:c.symbol, currentPrice:c.currentPrice })),
  ], [investments, cryptos])

  const handleRequestPerm = async () => setNotifPerm(await requestNotificationPermission())

  const handleSubmit = () => {
    const base = { type: form.type, label: form.label }
    if (form.type === 'price_above' || form.type === 'price_below') {
      const asset = allAssets.find(a => a.id === form.assetId)
      if (!asset || !form.targetPrice) return
      onAdd({ ...base, assetId:form.assetId, ticker:asset.ticker, assetName:asset.name, targetPrice:parseFloat(form.targetPrice) })
    } else if (form.type === 'milestone') {
      if (!form.targetValue) return
      onAdd({ ...base, targetValue: parseFloat(form.targetValue) })
    } else if (form.type === 'drift') {
      onAdd({ ...base, categoryId:form.categoryId, threshold:parseInt(form.threshold)||5 })
    }
    setShowForm(false)
    setForm({ type:'price_above', assetId:'', targetPrice:'', targetValue:'', categoryId:'etf', threshold:'5', label:'' })
  }

  const alertLabel = (a) => {
    if (a.label) return a.label
    if (a.type === 'price_above') return `${a.assetName||a.ticker} supera ${fmtEur(a.targetPrice)}`
    if (a.type === 'price_below') return `${a.assetName||a.ticker} cau per sota ${fmtEur(a.targetPrice)}`
    if (a.type === 'milestone')   return `Portfoli supera ${fmtEur(a.targetValue)}`
    if (a.type === 'drift')       return `Desviació ${a.categoryId} > ${a.threshold}pp`
    return 'Alerta'
  }

  const active    = alerts.filter(a => !a.triggered)
  const triggered = alerts.filter(a =>  a.triggered)

  const AlertCard = ({ a, dim }) => {
    const { bg, color } = alertIconStyle(a.type)
    return (
      <div className="als-card" style={dim ? { opacity:0.50 } : {}}>
        <div className="als-card-ico" style={{ background:bg, color }}>{ALERT_TYPES.find(t=>t.id===a.type)?.icon||'!'}</div>
        <div className="als-card-body">
          <p className="als-card-title">{alertLabel(a)}</p>
          <p className="als-card-sub">
            {a.type==='price_above'||a.type==='price_below' ? `${a.assetName||a.ticker}` : a.type==='milestone' ? 'Portfoli total' : `Desviació > ${a.threshold}pp`}
          </p>
          <span className={`als-status ${dim?'triggered':'active'}`}>{dim?'Disparada':'Activa'}</span>
          {dim && a.triggeredAt && (
            <span className="als-triggered-at">{new Date(a.triggeredAt).toLocaleDateString('ca-ES',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
          )}
        </div>
        <button className="als-card-del" onClick={()=>onRemove(a.id)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    )
  }

  return (
    <div className="als">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div className="als-top">
        <div>
          <h2 className="als-title">Alertes</h2>
          <p className="als-sub">{active.length} alerta{active.length!==1?'es':''} activa{active.length!==1?'es':''}</p>
        </div>
        <button className={`als-add-btn${showForm?' cancel':''}`} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel·lar' : '+ Nova alerta'}
        </button>
      </div>

      {/* Banner notificacions */}
      {notifPerm !== 'unsupported' && (
        notifPerm === 'granted' ? (
          <div className="als-banner granted" style={{cursor:'default'}}>
            <span>🔔</span>
            <span className="als-banner-text"><strong>Notificacions actives.</strong> T'avisarem quan una alerta es dispari.</span>
          </div>
        ) : notifPerm === 'denied' ? (
          <div className="als-banner denied" style={{cursor:'default'}}>
            <span>🔕</span>
            <span className="als-banner-text"><strong>Notificacions bloquejades.</strong> Activa-les manualment des del navegador.</span>
          </div>
        ) : (
          <div className="als-banner default" onClick={handleRequestPerm}>
            <span>🔔</span>
            <span className="als-banner-text"><strong>Activa les notificacions</strong> per rebre avisos en temps real.</span>
            <span style={{fontSize:11,fontWeight:600,color:'rgba(255,170,50,0.85)',whiteSpace:'nowrap'}}>Activar →</span>
          </div>
        )
      )}

      {/* Formulari */}
      {showForm && (
        <div className="als-panel">
          <p className="als-panel-title">Nova alerta</p>
          <div className="als-form">
            <div>
              <label className="als-lbl">Tipus</label>
              <div className="als-type-grid">
                {ALERT_TYPES.map(t => (
                  <button key={t.id} className={`als-type-btn${form.type===t.id?' on':''}`} onClick={()=>set('type',t.id)}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="als-lbl">Nom (opcional)</label>
              <input className="als-inp" placeholder="ex: Bitcoin ATH propera" value={form.label} onChange={e=>set('label',e.target.value)} />
            </div>
            {(form.type==='price_above'||form.type==='price_below') && (
              <div className="als-grid2">
                <div>
                  <label className="als-lbl">Actiu</label>
                  <select className="als-select" value={form.assetId} onChange={e=>set('assetId',e.target.value)}>
                    <option value="">Selecciona...</option>
                    {allAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.ticker||'—'})</option>)}
                  </select>
                </div>
                <div>
                  <label className="als-lbl">Preu objectiu (€)</label>
                  <input type="number" inputMode="decimal" step="any" className="als-inp mono" placeholder="0.00" value={form.targetPrice} onChange={e=>set('targetPrice',e.target.value)} />
                </div>
              </div>
            )}
            {form.type==='milestone' && (
              <div>
                <label className="als-lbl">Valor total objectiu (€)</label>
                <input type="number" inputMode="decimal" step="1000" className="als-inp mono" placeholder="25000" value={form.targetValue} onChange={e=>set('targetValue',e.target.value)} />
              </div>
            )}
            {form.type==='drift' && (
              <div className="als-grid2">
                <div>
                  <label className="als-lbl">Categoria</label>
                  <select className="als-select" value={form.categoryId} onChange={e=>set('categoryId',e.target.value)}>
                    <option value="etf">ETF / Renda variable</option>
                    <option value="estalvi">Estalvi / Liquiditat</option>
                    <option value="crypto">Crypto</option>
                    <option value="robo">Robo Advisor</option>
                  </select>
                </div>
                <div>
                  <label className="als-lbl">Llindar (pp)</label>
                  <input type="number" inputMode="decimal" min="1" max="50" className="als-inp mono" placeholder="5" value={form.threshold} onChange={e=>set('threshold',e.target.value)} />
                </div>
              </div>
            )}
            <div className="als-form-footer">
              <button className="als-btn-cancel" onClick={()=>setShowForm(false)}>Cancel·lar</button>
              <button className="als-btn-ok" onClick={handleSubmit}>Crear alerta</button>
            </div>
          </div>
        </div>
      )}

      {/* Alertes actives */}
      <div className="als-panel">
        <p className="als-panel-title">Actives</p>
        {active.length === 0 ? (
          <div className="als-empty">
            <p className="als-empty-main">Cap alerta activa</p>
            <p className="als-empty-sub">Crea la primera alerta per rebre notificacions</p>
          </div>
        ) : active.map(a => <AlertCard key={a.id} a={a} dim={false} />)}
      </div>

      {/* Historial */}
      {triggered.length > 0 && (
        <div className="als-panel">
          <p className="als-panel-title">Historial</p>
          {triggered.map(a => <AlertCard key={a.id} a={a} dim={true} />)}
        </div>
      )}
    </div>
  )
}