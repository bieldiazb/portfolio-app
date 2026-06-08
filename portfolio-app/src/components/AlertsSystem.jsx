import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore'

// ── Detecció iOS standalone ────────────────────────────────────────────────────
// iOS Safari en mode "Afegit a pantalla d'inici" NO suporta l'API Notification.
// Fem servir notificacions in-app + vibració + badge visual com a fallback complet.
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}
function isIOSStandalone() {
  return isIOS() && isStandalone()
}

// Cua global de toasts in-app
const toastListeners = new Set()
function emitToast(toast) {
  toastListeners.forEach(fn => fn(toast))
}

async function requestNotificationPermission() {
  // iOS standalone: l'API no funciona — indiquem que hem de fer servir in-app
  if (isIOSStandalone()) return 'ios-standalone'
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

function sendBrowserNotification(title, body) {
  // Sempre emetem toast in-app (funciona a iOS standalone i arreu)
  emitToast({ title, body, id: Date.now() })

  // Vibració en mòbil si disponible
  if (navigator.vibrate) navigator.vibrate([100, 50, 100])

  // Notificació nativa si disponible (desktop / Android Chrome)
  if (isIOSStandalone()) return  // iOS standalone: no es pot
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, icon:'/favicon.ico', tag:'cartera-alert', renotify:true })
    setTimeout(() => n.close(), 8000)
    n.onclick = () => { window.focus(); n.close() }
  } catch {}
}

// ── Toast in-app component (usat a App.jsx o aquí mateix) ───────────────────
export function AlertToastProvider() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = toast => {
      setToasts(prev => [...prev.slice(-2), toast]) // màx 3
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 6000)
    }
    toastListeners.add(handler)
    return () => toastListeners.delete(handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
      zIndex:9999, display:'flex', flexDirection:'column', gap:8,
      width:'calc(100% - 32px)', maxWidth:360, pointerEvents:'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:'var(--c-elevated)', border:'1px solid var(--c-border-green)',
          borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.35)',
          display:'flex', gap:10, alignItems:'flex-start',
          animation:'toastIn 300ms cubic-bezier(0.32,1.1,0.60,1)',
          fontFamily:'var(--font-sans)',
        }}>
          <span style={{fontSize:18,flexShrink:0}}>🔔</span>
          <div style={{minWidth:0}}>
            <p style={{fontSize:13,fontWeight:600,color:'var(--c-text-primary)',marginBottom:3}}>{t.title}</p>
            <p style={{fontSize:12,color:'var(--c-text-secondary)',lineHeight:1.5}}>{t.body}</p>
          </div>
        </div>
      ))}
      <style>{`@keyframes toastIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}

// ── Hook useAlerts ────────────────────────────────────────────────────────────
export function useAlerts(uid) {
  const [alerts, setAlerts] = useState([])
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db,'users',uid,'alerts'), orderBy('createdAt','desc'))
    return onSnapshot(q, snap => setAlerts(snap.docs.map(d=>({id:d.id,...d.data()}))))
  }, [uid])

  const addAlert = useCallback(async (alert) => {
    if (!uid) return
    await addDoc(collection(db,'users',uid,'alerts'), {...alert, triggered:false, createdAt:serverTimestamp()})
  }, [uid])

  const removeAlert = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db,'users',uid,'alerts',id))
  }, [uid])

  const markTriggered = useCallback(async (id, label) => {
    if (!uid) return
    await updateDoc(doc(db,'users',uid,'alerts',id), {triggered:true, triggeredAt:new Date().toISOString()})
    if (!notifiedRef.current.has(id)) {
      notifiedRef.current.add(id)
      sendBrowserNotification('🔔 Alerta de Cartera', label || "Una alerta s'ha activat")
    }
  }, [uid])

  const checkAlerts = useCallback((investments, cryptos, totalPortfolio, goals, currentPcts) => {
    alerts.forEach(alert => {
      if (alert.triggered) return
      let shouldTrigger = false, notifLabel = alert.label || ''
      if (alert.type==='price_above'||alert.type==='price_below') {
        const asset = [...investments,...cryptos].find(a=>a.id===alert.assetId||a.ticker===alert.ticker)
        if (!asset?.currentPrice) return
        if (alert.type==='price_above'&&asset.currentPrice>=alert.targetPrice) { shouldTrigger=true; notifLabel=notifLabel||`${asset.name} ha superat ${fmtEur(alert.targetPrice)}` }
        if (alert.type==='price_below'&&asset.currentPrice<=alert.targetPrice) { shouldTrigger=true; notifLabel=notifLabel||`${asset.name} ha caigut per sota ${fmtEur(alert.targetPrice)}` }
      }
      if (alert.type==='milestone'&&totalPortfolio>=alert.targetValue) { shouldTrigger=true; notifLabel=notifLabel||`El portfoli ha superat ${fmtEur(alert.targetValue)}` }
      if (alert.type==='drift') {
        const actual=currentPcts[alert.categoryId]||0, goal=goals[alert.categoryId]||0
        if (Math.abs(actual-goal)>=alert.threshold) { shouldTrigger=true; notifLabel=notifLabel||`Desviació de ${alert.categoryId} supera ${alert.threshold}pp` }
      }
      if (shouldTrigger) markTriggered(alert.id, notifLabel)
    })
  }, [alerts, markTriggered])

  return { alerts, addAlert, removeAlert, checkAlerts }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ALERT_TYPES = [
  { id:'price_above', label:'Preu per sobre de', icon:'↑', color:COLORS.neonGreen,  bg:'var(--c-bg-green)',  border:'var(--c-border-green)'  },
  { id:'price_below', label:'Preu per sota de',  icon:'↓', color:COLORS.neonRed,    bg:'var(--c-bg-red)',    border:'var(--c-border-red)'    },
  { id:'milestone',   label:'Portfoli supera',   icon:'★', color:COLORS.neonAmber,  bg:'var(--c-bg-amber)', border:'var(--c-border-amber)'  },
  { id:'drift',       label:'Desviació objectiu', icon:'⚡', color:COLORS.neonPurple, bg:'var(--c-bg-purple)',border:'var(--c-border-purple)' },
]

function getTypeMeta(type) {
  return ALERT_TYPES.find(t=>t.id===type) || { icon:'!', color:'var(--c-text-muted)', bg:'var(--c-elevated)', border:'var(--c-border)' }
}

const styles = `
  .als { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero centrat ── */
  .als-hero { text-align:center; padding:28px 20px 20px; }
  .als-hero-label { font-size:11px; font-weight:400; color:var(--c-text-muted); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:8px; }
  .als-hero-count { font-size:44px; font-weight:600; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; letter-spacing:1px; margin-bottom:6px; }
  .als-hero-sub { font-size:12px; color:var(--c-text-muted); margin-bottom:12px; }
  .als-hero-top { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
  .als-hero-pills { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }
  .als-hero-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; padding:4px 10px; border-radius:20px; }
  .als-hero-pill.activa    { color:var(--c-green); background:var(--c-bg-green); border:1px solid var(--c-border-green); }
  .als-hero-pill.disparada { color:var(--c-text-secondary); background:var(--c-elevated); border:1px solid var(--c-border); }
  .als-btn-add { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; background:var(--c-green); color:#000; border:none; border-radius:20px; font-family:${FONTS.sans}; font-size:12px; font-weight:700; cursor:pointer; transition:opacity 100ms; }
  .als-btn-add:hover { opacity:0.85; }

  /* Banner notificacions */
  .als-banner { display:flex; align-items:center; gap:10px; padding:13px 14px; border-radius:10px; font-size:12px; cursor:pointer; transition:opacity 100ms; -webkit-tap-highlight-color:transparent; }
  .als-banner-text { flex:1; line-height:1.55; }
  .als-banner-text strong { font-weight:600; }
  .als-banner.granted  { background:var(--c-bg-green); border:1px solid var(--c-border-green); color:var(--c-text-secondary); }
  .als-banner.granted strong { color:${COLORS.neonGreen}; }
  .als-banner.default  { background:var(--c-bg-amber); border:1px solid var(--c-border-amber); color:var(--c-text-secondary); }
  .als-banner.default strong { color:${COLORS.neonAmber}; }
  .als-banner.denied   { background:var(--c-bg-red); border:1px solid var(--c-border-red); color:var(--c-text-secondary); cursor:default; }

  /* Panel genèric */
  .als-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; overflow:hidden; }
  .als-panel-hdr { padding:13px 16px; border-bottom:1px solid var(--c-border); display:flex; align-items:center; justify-content:space-between; }
  .als-panel-title { font-size:10px; font-weight:600; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.14em; }
  .als-panel-count { font-size:10px; font-family:${FONTS.num}; color:var(--c-text-muted); }
  .als-panel-body { padding:0; }

  /* Card d'alerta */
  .als-card { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-bottom:1px solid var(--c-border); transition:background 80ms; }
  .als-card:last-child { border-bottom:none; }
  .als-card:hover { background:var(--c-elevated); }
  .als-card-ico { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .als-card-body { flex:1; min-width:0; }
  .als-card-title { font-size:13px; font-weight:500; color:var(--c-text-secondary); margin-bottom:3px; }
  .als-card-sub { font-size:11px; color:var(--c-text-muted); font-family:${FONTS.mono}; margin-bottom:6px; }
  .als-card-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .als-status { display:inline-flex; align-items:center; gap:4px; font-size:9px; font-weight:700; padding:3px 8px; border-radius:10px; text-transform:uppercase; letter-spacing:0.08em; }
  .als-status-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
  .als-status.activa    { color:${COLORS.neonGreen}; background:var(--c-bg-green); border:1px solid var(--c-border-green); }
  .als-status.activa .als-status-dot { background:${COLORS.neonGreen}; animation:alspulse 1.5s ease-in-out infinite; }
  .als-status.disparada { color:var(--c-text-muted); background:var(--c-elevated); border:1px solid var(--c-border); }
  @keyframes alspulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .als-triggered-at { font-size:10px; color:var(--c-text-disabled); font-style:italic; }
  .als-card-del { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:6px; cursor:pointer; color:var(--c-text-disabled); flex-shrink:0; margin-top:2px; transition:all 80ms; }
  .als-card-del:hover { color:${COLORS.neonRed}; background:var(--c-bg-red); }

  /* Empty */
  .als-empty { padding:40px 16px; text-align:center; }
  .als-empty-icon { font-size:32px; margin-bottom:10px; }
  .als-empty-main { font-size:13px; color:var(--c-text-muted); font-weight:500; margin-bottom:5px; }
  .als-empty-sub { font-size:11px; color:var(--c-text-disabled); }

  /* ── Modal formulari ── */
  .als-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); display:flex; align-items:center; justify-content:center; padding:16px; z-index:50; backdrop-filter:blur(8px); animation:alsFadeIn 150ms ease; }
  @keyframes alsFadeIn { from{opacity:0} to{opacity:1} }
  .als-modal { background:var(--c-bg); border:1px solid var(--c-border); border-radius:14px; width:100%; max-width:460px; padding:24px 22px 28px; max-height:90dvh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.35); animation:alsScaleIn 200ms cubic-bezier(0.32,1.1,0.60,1); transition:background-color 220ms ease; }
  @keyframes alsScaleIn { from{transform:scale(0.95) translateY(6px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  .als-modal-drag { display:none; }
  .als-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .als-modal-title { font-size:16px; font-weight:600; color:var(--c-text-primary); letter-spacing:-0.3px; }
  .als-modal-x { width:28px; height:28px; border-radius:8px; background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-secondary); font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; }

  .als-fgroup { display:flex; flex-direction:column; gap:14px; }
  .als-lbl { display:block; font-size:10px; font-weight:600; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:7px; }
  .als-inp { width:100%; background:var(--c-elevated); border:1px solid var(--c-border); border-radius:10px; padding:11px 13px; font-family:${FONTS.sans}; font-size:15px; color:var(--c-text-primary); outline:none; box-sizing:border-box; -webkit-appearance:none; transition:border-color 120ms; }
  .als-inp:focus { border-color:rgba(0,255,136,0.35); }
  .als-inp::placeholder { color:var(--c-text-disabled); }
  .als-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .als-sel { width:100%; background:var(--c-elevated); border:1px solid var(--c-border); border-radius:10px; padding:11px 13px; font-family:${FONTS.sans}; font-size:15px; color:var(--c-text-primary); outline:none; cursor:pointer; -webkit-appearance:none; }
  .als-sel option { background:var(--c-elevated); }
  .als-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

  .als-type-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  .als-type-btn { padding:11px 12px; border-radius:10px; border:1px solid var(--c-border); background:var(--c-elevated); cursor:pointer; font-family:${FONTS.sans}; font-size:12px; font-weight:500; color:var(--c-text-secondary); transition:all 100ms; display:flex; align-items:center; gap:7px; -webkit-tap-highlight-color:transparent; }
  .als-type-btn:hover { background:var(--c-border); }
  .als-type-btn.on { border-color:rgba(0,255,136,0.30); background:var(--c-bg-green); color:${COLORS.neonGreen}; }

  .als-modal-footer { display:flex; gap:8px; margin-top:20px; }
  .als-btn-cancel { flex:1; padding:13px; border:1px solid var(--c-border); background:transparent; border-radius:10px; font-family:${FONTS.sans}; font-size:14px; color:var(--c-text-secondary); cursor:pointer; }
  .als-btn-ok { flex:1; padding:13px; border:none; border-radius:10px; font-family:${FONTS.sans}; font-size:14px; font-weight:700; background:${COLORS.neonGreen}; color:#000; cursor:pointer; transition:opacity 100ms; }
  .als-btn-ok:hover { opacity:0.85; }
`

function alertLabel(a) {
  if (a.label) return a.label
  if (a.type==='price_above') return `${a.assetName||a.ticker} supera ${fmtEur(a.targetPrice)}`
  if (a.type==='price_below') return `${a.assetName||a.ticker} cau per sota ${fmtEur(a.targetPrice)}`
  if (a.type==='milestone')   return `Portfoli supera ${fmtEur(a.targetValue)}`
  if (a.type==='drift')       return `Desviació ${a.categoryId} > ${a.threshold}pp`
  return 'Alerta'
}

function AlertCard({ a, dim, onRemove }) {
  const meta = getTypeMeta(a.type)
  return (
    <div className="als-card">
      <div className="als-card-ico" style={{background:meta.bg}}>
        <span style={{fontSize:14}}>{meta.icon}</span>
      </div>
      <div className="als-card-body">
        <p className="als-card-title" style={{opacity:dim?0.55:1}}>{alertLabel(a)}</p>
        <p className="als-card-sub">
          {a.type==='price_above'||a.type==='price_below'
            ? `${a.assetName||a.ticker}${a.targetPrice?` · objectiu ${fmtEur(a.targetPrice)}`:''}`
            : a.type==='milestone' ? `Portfoli total · objectiu ${fmtEur(a.targetValue)}`
            : `Desviació > ${a.threshold}pp`}
        </p>
        <div className="als-card-row">
          <span className={`als-status ${dim?'disparada':'activa'}`}>
            <span className="als-status-dot"/>
            {dim ? 'Disparada' : 'Activa'}
          </span>
          {dim && a.triggeredAt && (
            <span className="als-triggered-at">
              {new Date(a.triggeredAt).toLocaleDateString('ca-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
            </span>
          )}
        </div>
      </div>
      <button className="als-card-del" onClick={()=>onRemove(a.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>
  )
}

export default function AlertsPage({ investments=[], cryptos=[], alerts, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false)
  const [notifPerm, setNotifPerm] = useState(() => {
    if (isIOSStandalone()) return 'ios-standalone'
    return 'Notification' in window ? Notification.permission : 'unsupported'
  })
  const [form, setForm] = useState({
    type:'price_above', assetId:'', targetPrice:'', targetValue:'',
    categoryId:'etf', threshold:'5', label:'',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const allAssets = useMemo(() => [
    ...investments.map(i=>({id:i.id,name:i.name,ticker:i.ticker,currentPrice:i.currentPrice})),
    ...cryptos.map(c=>({id:c.id,name:c.name,ticker:c.symbol,currentPrice:c.currentPrice})),
  ], [investments, cryptos])

  const handleRequestPerm = async () => {
    const perm = await requestNotificationPermission()
    setNotifPerm(perm)
  }

  const handleSubmit = () => {
    const base = { type:form.type, label:form.label }
    if (form.type==='price_above'||form.type==='price_below') {
      const asset = allAssets.find(a=>a.id===form.assetId)
      if (!asset||!form.targetPrice) return
      onAdd({...base, assetId:form.assetId, ticker:asset.ticker, assetName:asset.name, targetPrice:parseFloat(form.targetPrice)})
    } else if (form.type==='milestone') {
      if (!form.targetValue) return
      onAdd({...base, targetValue:parseFloat(form.targetValue)})
    } else if (form.type==='drift') {
      onAdd({...base, categoryId:form.categoryId, threshold:parseInt(form.threshold)||5})
    }
    setShowForm(false)
    setForm({type:'price_above',assetId:'',targetPrice:'',targetValue:'',categoryId:'etf',threshold:'5',label:''})
  }

  const active    = alerts.filter(a=>!a.triggered)
  const triggered = alerts.filter(a=> a.triggered)

  return (
    <div className="als">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div className="als-hero">
        <p className="als-hero-label">Alertes de preu</p>
        <p className="als-hero-count">{active.length}</p>
        <p className="als-hero-sub">alerta{active.length!==1?'es':''} activa{active.length!==1?'es':''}</p>
        <div className="als-hero-top">
          <div className="als-hero-pills">
            {active.length>0 && <span className="als-hero-pill activa">🟢 {active.length} activa{active.length!==1?'es':''}</span>}
            {triggered.length>0 && <span className="als-hero-pill disparada">✓ {triggered.length} disparada{triggered.length!==1?'es':''}</span>}
            {alerts.length===0 && <span className="als-hero-pill disparada">Cap alerta creada</span>}
          </div>
          <button className="als-btn-add" onClick={()=>setShowForm(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova alerta
          </button>
        </div>
      </div>
      <div style={{height:'1px',background:'var(--c-border)'}}/>

      {notifPerm!=='unsupported' && (
        notifPerm==='granted' ? (
          <div className="als-banner granted" style={{cursor:'default'}}>
            <span>🔔</span>
            <div className="als-banner-text">
              <strong>Notificacions actives</strong> — T'avisarem quan una alerta es dispari.
              {isIOSStandalone() && <span style={{display:'block',marginTop:4,fontSize:10,opacity:0.7}}>iOS: notificació visual in-app (Apple no permet push en web apps)</span>}
            </div>
          </div>
        ) : notifPerm==='denied' ? (
          <div className="als-banner denied">
            <span>🔕</span>
            <div className="als-banner-text">Notificacions bloquejades. Activa-les des de la configuració del navegador.</div>
          </div>
        ) : notifPerm==='ios-standalone' ? (
          <div className="als-banner granted" style={{cursor:'default'}}>
            <span>🔔</span>
            <div className="als-banner-text">
              <strong>Notificacions in-app actives</strong> — Apple no permet push en web apps guardades. Les alertes apareixeran com a missatges visuals dins l'app.
            </div>
          </div>
        ) : (
          <div className="als-banner default" onClick={handleRequestPerm}>
            <span>🔔</span>
            <div className="als-banner-text"><strong>Activa les notificacions</strong> per rebre avisos en temps real quan s'activin les alertes.</div>
            <span style={{fontSize:11,fontWeight:700,color:COLORS.neonAmber,whiteSpace:'nowrap',flexShrink:0}}>Activar →</span>
          </div>
        )
      )}

      <div className="als-panel">
        <div className="als-panel-hdr">
          <span className="als-panel-title">Alertes actives</span>
          <span className="als-panel-count">{active.length}</span>
        </div>
        <div className="als-panel-body">
          {active.length===0 ? (
            <div className="als-empty">
              <div className="als-empty-icon">🔔</div>
              <p className="als-empty-main">Cap alerta activa</p>
              <p className="als-empty-sub">Crea alertes de preu, fites de portfoli o desviacions d'objectiu</p>
            </div>
          ) : active.map(a=><AlertCard key={a.id} a={a} dim={false} onRemove={onRemove}/>)}
        </div>
      </div>

      {triggered.length>0 && (
        <div className="als-panel">
          <div className="als-panel-hdr">
            <span className="als-panel-title">Historial de disparades</span>
            <span className="als-panel-count">{triggered.length}</span>
          </div>
          <div className="als-panel-body">
            {triggered.map(a=><AlertCard key={a.id} a={a} dim={true} onRemove={onRemove}/>)}
          </div>
        </div>
      )}

      <div style={{height:16}}/>

      {showForm && (
        <div className="als-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="als-modal">
            <div className="als-modal-drag"/>
            <div className="als-modal-hdr">
              <h3 className="als-modal-title">Nova alerta</h3>
              <button className="als-modal-x" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <div className="als-fgroup">
              <div>
                <label className="als-lbl">Tipus d'alerta</label>
                <div className="als-type-grid">
                  {ALERT_TYPES.map(t=>(
                    <button key={t.id} className={`als-type-btn${form.type===t.id?' on':''}`} onClick={()=>set('type',t.id)}
                      style={form.type===t.id?{borderColor:t.border,background:t.bg,color:t.color}:{}}
                    >
                      <span>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="als-lbl">Nom (opcional)</label>
                <input className="als-inp" placeholder="ex: Bitcoin per sota de 50k" value={form.label} onChange={e=>set('label',e.target.value)}/>
              </div>
              {(form.type==='price_above'||form.type==='price_below') && (
                <div className="als-grid2">
                  <div>
                    <label className="als-lbl">Actiu</label>
                    <select className="als-sel" value={form.assetId} onChange={e=>set('assetId',e.target.value)}>
                      <option value="">Selecciona...</option>
                      {allAssets.map(a=><option key={a.id} value={a.id}>{a.name} ({a.ticker||'—'})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="als-lbl">Preu objectiu (€)</label>
                    <input type="number" inputMode="decimal" step="any" className="als-inp mono" placeholder="0.00" value={form.targetPrice} onChange={e=>set('targetPrice',e.target.value)}/>
                  </div>
                </div>
              )}
              {form.type==='milestone' && (
                <div>
                  <label className="als-lbl">Valor total objectiu (€)</label>
                  <input type="number" inputMode="decimal" step="1000" className="als-inp mono" placeholder="50000" value={form.targetValue} onChange={e=>set('targetValue',e.target.value)}/>
                </div>
              )}
              {form.type==='drift' && (
                <div className="als-grid2">
                  <div>
                    <label className="als-lbl">Categoria</label>
                    <select className="als-sel" value={form.categoryId} onChange={e=>set('categoryId',e.target.value)}>
                      <option value="etf">ETF / Renda variable</option>
                      <option value="estalvi">Estalvi / Liquiditat</option>
                      <option value="crypto">Crypto</option>
                      <option value="robo">Robo Advisor</option>
                    </select>
                  </div>
                  <div>
                    <label className="als-lbl">Llindar (pp)</label>
                    <input type="number" inputMode="decimal" min="1" max="50" className="als-inp mono" placeholder="5" value={form.threshold} onChange={e=>set('threshold',e.target.value)}/>
                  </div>
                </div>
              )}
            </div>
            <div className="als-modal-footer">
              <button className="als-btn-cancel" onClick={()=>setShowForm(false)}>Cancel·lar</button>
              <button className="als-btn-ok" onClick={handleSubmit}>Crear alerta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}