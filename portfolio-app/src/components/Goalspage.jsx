import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { GOAL_TYPES } from '../hooks/Usegoals.js'

function fv(pv, pmt, rAnnual, months) {
  if (rAnnual === 0) return pv + pmt * months
  const m = rAnnual / 100 / 12
  return pv * Math.pow(1+m, months) + pmt * (Math.pow(1+m, months)-1) / m
}
function monthsToTarget(pv, pmt, rAnnual, target) {
  if (pv >= target) return 0
  let m = 0
  while (m < 600) { if (fv(pv, pmt, rAnnual, m) >= target) return m; m++ }
  return null
}
function addMonths(date, months) {
  const d = new Date(date); d.setMonth(d.getMonth()+months); return d
}

const TrashIcon = ({size=12}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const SimTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{background:'var(--c-elevated)',border:`1px solid var(--c-border)`,borderRadius:8,padding:'8px 12px',fontFamily:FONTS.sans}}>
      <p style={{fontSize:10,color:'var(--c-text-muted)',marginBottom:4}}>{label}</p>
      <p style={{fontSize:15,fontWeight:300,fontFamily:FONTS.num,color:'var(--c-text-primary)',fontVariantNumeric:'tabular-nums'}}>{fmtEur(payload[0]?.value)}</p>
    </div>
  )
}

const styles = `
  .gl { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .gl-hero { background:linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%); border:1px solid var(--c-border); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .gl-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,var(--c-bg-purple) 0%,transparent 70%); pointer-events:none; }
  .gl-hero-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; }
  .gl-hero-label { font-size:11px; font-weight:500; color:var(--c-text-muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .gl-hero-count { font-size:36px; font-weight:600; color:var(--c-text-primary); letter-spacing:0.5px; font-family:${FONTS.num}; line-height:1; }
  .gl-hero-sub { font-size:12px; color:var(--c-text-secondary); margin-top:4px; }
  .gl-btn-add { display:flex; align-items:center; gap:5px; padding:8px 14px; background:${COLORS.neonGreen}; color:#000; border:none; border-radius:8px; font-family:${FONTS.sans}; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; flex-shrink:0; transition:opacity 100ms; }
  .gl-btn-add:hover { opacity:0.85; }
  .gl-hero-pills { display:flex; gap:6px; flex-wrap:wrap; }
  .gl-hero-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; padding:4px 10px; border-radius:20px; }
  .gl-hero-pill.done { color:${COLORS.neonGreen}; background:var(--c-bg-green); border:1px solid var(--c-border-green); }
  .gl-hero-pill.pend { color:var(--c-text-secondary); background:var(--c-elevated); border:1px solid var(--c-border); }

  /* ── Card objectiu ── */
  .gl-card { background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; overflow:hidden; transition:border-color 150ms; }
  .gl-card:hover { border-color:var(--c-border-mid); }

  .gl-card-hdr { display:flex; align-items:center; gap:12px; padding:16px 16px 0; }
  .gl-card-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .gl-card-info { flex:1; min-width:0; }
  .gl-card-name { font-size:15px; font-weight:600; color:var(--c-text-primary); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .gl-card-type { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:var(--c-text-muted); }
  .gl-card-del { width:28px; height:28px; background:transparent; border:none; color:var(--c-text-disabled); cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:6px; transition:all 80ms; flex-shrink:0; }
  .gl-card-del:hover { color:${COLORS.neonRed}; background:var(--c-bg-red); }

  .gl-card-body { padding:14px 16px 16px; }

  /* Progress gran */
  .gl-prog-nums { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:10px; }
  .gl-prog-cur { font-size:28px; font-weight:200; font-family:${FONTS.num}; color:var(--c-text-primary); letter-spacing:-1px; font-variant-numeric:tabular-nums; line-height:1; }
  .gl-prog-cur .unit { font-size:14px; color:var(--c-text-muted); font-weight:300; margin-left:2px; }
  .gl-prog-meta { text-align:right; }
  .gl-prog-pct { font-size:20px; font-weight:300; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:2px; }
  .gl-prog-target { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.num}; }

  /* Barra de progrés */
  .gl-bar-wrap { margin-bottom:14px; }
  .gl-bar-track { height:6px; background:var(--c-border); border-radius:3px; overflow:visible; position:relative; }
  .gl-bar-fill { height:100%; border-radius:3px; transition:width 700ms cubic-bezier(0.4,0,0.2,1); position:relative; }
  .gl-bar-fill::after { content:''; position:absolute; right:-1px; top:-3px; width:12px; height:12px; border-radius:50%; background:inherit; border:2px solid var(--c-bg); }
  .gl-bar-fill.done::after { display:none; }
  .gl-bar-label { display:flex; justify-content:space-between; margin-top:6px; font-size:9px; color:var(--c-text-disabled); font-family:${FONTS.num}; }

  /* Stats grid */
  .gl-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
  .gl-stat { background:var(--c-elevated); border:1px solid var(--c-border); border-radius:8px; padding:10px 12px; }
  .gl-stat-l { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .gl-stat-v { font-size:14px; font-weight:300; font-family:${FONTS.num}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; }
  .gl-stat-v.g { color:${COLORS.neonGreen}; }
  .gl-stat-v.p { color:${COLORS.neonPurple}; }
  .gl-stat-v.c { color:${COLORS.neonCyan}; }
  .gl-stat-v.sm { font-size:12px; }

  /* Done banner */
  .gl-done-banner { display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--c-bg-green); border:1px solid var(--c-border-green); border-radius:8px; font-size:13px; font-weight:600; color:${COLORS.neonGreen}; margin-bottom:14px; }

  /* Alert preu */
  .gl-price-alert { display:flex; align-items:center; gap:8px; padding:11px 14px; border-radius:8px; font-size:12px; font-weight:500; }
  .gl-price-alert.ok   { background:var(--c-bg-green); border:1px solid var(--c-border-green); color:${COLORS.neonGreen}; }
  .gl-price-alert.wait { background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-secondary); }

  /* Gràfic simulació */
  .gl-sim-label { font-size:9px; font-weight:600; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:10px; }

  /* Empty */
  .gl-empty { padding:56px 0; text-align:center; }
  .gl-empty-icon { font-size:40px; margin-bottom:12px; }
  .gl-empty-main { font-size:14px; color:var(--c-text-secondary); font-weight:500; margin-bottom:6px; }
  .gl-empty-sub  { font-size:12px; color:var(--c-text-disabled); line-height:1.65; }

  /* ── Modal ── */
  .gl-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; backdrop-filter:blur(6px); }
  @media (min-width:640px) { .gl-overlay { align-items:center; padding:16px; } }
  .gl-modal { background:var(--c-bg); border:1px solid var(--c-border); border-radius:16px 16px 0 0; width:100%; padding:20px 16px 100px; max-height:92dvh; overflow-y:auto; box-shadow:0 -20px 60px rgba(0,0,0,0.40); animation:glSlide 220ms cubic-bezier(0.34,1.2,0.64,1); transition:background-color 220ms ease; }
  @keyframes glSlide { from { transform:translateY(24px); opacity:0 } to { transform:translateY(0); opacity:1 } }
  @media (min-width:640px) { .gl-modal { border-radius:14px; max-width:460px; padding:24px 22px 28px; } }
  .gl-modal-drag { width:36px; height:4px; border-radius:2px; background:var(--c-border); margin:0 auto 18px; display:block; }
  @media (min-width:640px) { .gl-modal-drag { display:none; } }
  .gl-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .gl-modal-title { font-size:16px; font-weight:600; color:var(--c-text-primary); letter-spacing:-0.3px; }
  .gl-modal-x { width:28px; height:28px; border-radius:8px; background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-secondary); font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .gl-lbl { display:block; font-size:10px; font-weight:600; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:7px; }
  .gl-inp { width:100%; background:var(--c-elevated); border:1px solid var(--c-border); border-radius:10px; padding:11px 13px; font-family:${FONTS.sans}; font-size:15px; color:var(--c-text-primary); outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .gl-inp:focus { border-color:rgba(0,255,136,0.35); }
  .gl-inp::placeholder { color:var(--c-text-disabled); }
  .gl-inp.mono { font-family:${FONTS.num}; }
  .gl-sel { width:100%; background:var(--c-elevated); border:1px solid var(--c-border); border-radius:10px; padding:11px 13px; font-family:${FONTS.sans}; font-size:15px; color:var(--c-text-primary); outline:none; cursor:pointer; -webkit-appearance:none; }
  .gl-sel option { background:var(--c-elevated); }
  .gl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .gl-fgroup { display:flex; flex-direction:column; gap:14px; }
  .gl-mfooter { display:flex; gap:8px; margin-top:20px; }
  .gl-btn-cancel { flex:1; padding:13px; border:1px solid var(--c-border); background:transparent; border-radius:10px; font-family:${FONTS.sans}; font-size:14px; color:var(--c-text-secondary); cursor:pointer; }
  .gl-btn-ok { flex:1; padding:13px; border:none; border-radius:10px; font-family:${FONTS.sans}; font-size:14px; font-weight:700; background:${COLORS.neonGreen}; color:#000; cursor:pointer; }
  .gl-btn-ok:hover { opacity:0.85; }
  .gl-error { font-size:12px; color:${COLORS.neonRed}; background:var(--c-bg-red); border:1px solid var(--c-border-red); border-radius:8px; padding:9px 12px; }

  /* Type selector */
  .gl-type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
  .gl-type-btn { padding:14px 6px 12px; border-radius:10px; border:1px solid var(--c-border); background:var(--c-elevated); cursor:pointer; text-align:center; transition:all 100ms; font-family:${FONTS.sans}; -webkit-tap-highlight-color:transparent; }
  .gl-type-btn:hover { border-color:var(--c-border-mid); background:var(--c-border); }
  .gl-type-btn.sel { border-color:rgba(0,255,136,0.30); background:var(--c-bg-green); }
  .gl-type-emoji { font-size:22px; margin-bottom:6px; }
  .gl-type-lbl { font-size:11px; color:var(--c-text-secondary); font-weight:500; }
  .gl-type-btn.sel .gl-type-lbl { color:${COLORS.neonGreen}; font-weight:600; }
`

function GoalCard({ goal, currentTotal, totalDividends, investments, onRemove }) {
  const meta  = GOAL_TYPES[goal.type] || { icon:'🎯', label:'Objectiu', color:COLORS.neonPurple }
  const color = meta.color || COLORS.neonPurple

  const currentValue = useMemo(() => {
    if (goal.type==='savings') return currentTotal||0
    if (goal.type==='passive') return totalDividends||0
    if (goal.type==='asset') {
      const inv = investments.find(i=>i.id===goal.assetId)
      return inv?.currentPrice||inv?.avgCost||0
    }
    return 0
  }, [goal, currentTotal, totalDividends, investments])

  const target = goal.target||0
  const pct    = target>0 ? Math.min((currentValue/target)*100, 100) : 0
  const done   = pct>=100

  const simData = useMemo(() => {
    if (goal.type!=='savings') return []
    const pv=currentTotal||0, pmt=goal.monthlyContrib||0, rate=goal.expectedReturn||7
    const pts=[], now=new Date()
    for (let m=0; m<=120; m+=3) {
      const val=fv(pv,pmt,rate,m)
      pts.push({ label:m===0?'Avui':`${m}m`, value:Math.round(val) })
      if (val>=target&&target>0) break
    }
    return pts
  }, [goal, currentTotal])

  const monthsNeeded = useMemo(() => {
    if (goal.type!=='savings'||!target) return null
    return monthsToTarget(currentTotal||0, goal.monthlyContrib||0, goal.expectedReturn||7, target)
  }, [goal, currentTotal, target])

  const targetDate = monthsNeeded!=null
    ? addMonths(new Date(), monthsNeeded).toLocaleDateString('ca-ES',{month:'long',year:'numeric'})
    : null

  const monthlyPassive = totalDividends ? totalDividends/12 : 0
  const inv = goal.type==='asset' ? investments.find(i=>i.id===goal.assetId) : null
  const currentPrice = inv?.currentPrice||0
  const targetPrice  = goal.targetPrice||0
  const priceReached = goal.direction==='below' ? currentPrice<=targetPrice&&currentPrice>0 : currentPrice>=targetPrice&&currentPrice>0

  return (
    <div className="gl-card">
      <div className="gl-card-hdr">
        <div className="gl-card-icon" style={{background:`${color}15`,border:`1px solid ${color}30`}}>
          {meta.icon}
        </div>
        <div className="gl-card-info">
          <p className="gl-card-name">{goal.name}</p>
          <p className="gl-card-type" style={{color}}>{meta.label}</p>
        </div>
        <button className="gl-card-del" onClick={onRemove}><TrashIcon size={12}/></button>
      </div>

      <div className="gl-card-body">
        {/* ── SAVINGS ── */}
        {goal.type==='savings' && (<>
          {done && <div className="gl-done-banner"><span>🏆</span> Objectiu assolit!</div>}
          <div className="gl-prog-nums">
            <div className="gl-prog-cur">
              {fmtEur(currentValue).replace('€','')}<span className="unit">€</span>
            </div>
            <div className="gl-prog-meta">
              <p className="gl-prog-pct" style={{color:done?COLORS.neonGreen:color}}>{pct.toFixed(1)}%</p>
              <p className="gl-prog-target">de {fmtEur(target)}</p>
            </div>
          </div>
          <div className="gl-bar-wrap">
            <div className="gl-bar-track">
              <div className={`gl-bar-fill${done?' done':''}`} style={{width:`${pct}%`,background:done?COLORS.neonGreen:color}}/>
            </div>
            <div className="gl-bar-label">
              <span>0</span><span>{fmtEur(target/2)}</span><span>{fmtEur(target)}</span>
            </div>
          </div>
          <div className="gl-stats">
            <div className="gl-stat">
              <p className="gl-stat-l">Falta</p>
              <p className="gl-stat-v">{done?'✓':fmtEur(Math.max(0,target-currentValue))}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Aportació/mes</p>
              <p className="gl-stat-v p">{fmtEur(goal.monthlyContrib||0)}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Assolit cap a</p>
              <p className="gl-stat-v sm c">{done?'Fet ✓':targetDate||'—'}</p>
            </div>
          </div>
          {simData.length>1&&!done&&(
            <>
              <p className="gl-sim-label">Simulació · {goal.expectedReturn||7}% anual estimat</p>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={simData} margin={{top:4,right:0,left:0,bottom:0}}>
                  <XAxis dataKey="label" tick={{fontSize:9,fontFamily:FONTS.num,fill:'var(--c-text-muted)'}} axisLine={false} tickLine={false} interval={Math.floor(simData.length/4)}/>
                  <YAxis tick={{fontSize:9,fontFamily:FONTS.num,fill:'var(--c-text-muted)'}} axisLine={false} tickLine={false} width={40} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <ReferenceLine y={target} stroke={color} strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.5}/>
                  <Tooltip content={<SimTooltip/>} cursor={{stroke:'var(--c-border)',strokeWidth:1}}/>
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.8} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </>)}

        {/* ── PASSIVE ── */}
        {goal.type==='passive' && (<>
          {done && <div className="gl-done-banner"><span>🏆</span> Renda passiva assolida!</div>}
          <div className="gl-prog-nums">
            <div className="gl-prog-cur">
              {fmtEur(monthlyPassive).replace('€','')}<span className="unit">€/mes</span>
            </div>
            <div className="gl-prog-meta">
              <p className="gl-prog-pct" style={{color:done?COLORS.neonGreen:color}}>{pct.toFixed(1)}%</p>
              <p className="gl-prog-target">de {fmtEur(goal.target||0)}/mes</p>
            </div>
          </div>
          <div className="gl-bar-wrap">
            <div className="gl-bar-track">
              <div className="gl-bar-fill" style={{width:`${pct}%`,background:done?COLORS.neonGreen:color}}/>
            </div>
            <div className="gl-bar-label">
              <span>0 €/mes</span><span>{fmtEur((goal.target||0)/2)}/mes</span><span>{fmtEur(goal.target||0)}/mes</span>
            </div>
          </div>
          <div className="gl-stats">
            <div className="gl-stat">
              <p className="gl-stat-l">Falta/mes</p>
              <p className="gl-stat-v">{done?'✓':fmtEur(Math.max(0,(goal.target||0)-monthlyPassive))}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Dividends any</p>
              <p className="gl-stat-v g">{fmtEur(totalDividends||0)}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Objectiu anual</p>
              <p className="gl-stat-v">{fmtEur((goal.target||0)*12)}</p>
            </div>
          </div>
          <p style={{fontSize:11,color:'var(--c-text-muted)',lineHeight:1.65}}>
            Basat en dividends registrats. Afegeix cobraments a <strong style={{color:'var(--c-text-secondary)'}}>Dividends</strong> per actualitzar el progrés.
          </p>
        </>)}

        {/* ── ASSET ── */}
        {goal.type==='asset' && (<>
          <p style={{fontSize:12,color:'var(--c-text-muted)',marginBottom:12}}>
            {inv?.name||goal.assetName||'—'}{inv?.ticker?` · ${inv.ticker}`:''}
          </p>
          <div className="gl-stats">
            <div className="gl-stat">
              <p className="gl-stat-l">Preu actual</p>
              <p className="gl-stat-v">{currentPrice>0?fmtEur(currentPrice):'—'}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Preu objectiu</p>
              <p className="gl-stat-v p">{fmtEur(targetPrice)}</p>
            </div>
            <div className="gl-stat">
              <p className="gl-stat-l">Diferència</p>
              <p className="gl-stat-v" style={{color:priceReached?COLORS.neonGreen:COLORS.neonRed}}>
                {currentPrice>0?`${((currentPrice-targetPrice)/targetPrice*100).toFixed(1)}%`:'—'}
              </p>
            </div>
          </div>
          <div className={`gl-price-alert ${priceReached?'ok':'wait'}`}>
            {priceReached
              ? `🏆 Assolit — preu ${goal.direction==='below'?'per sota':'per sobre'} de ${fmtEur(targetPrice)}`
              : goal.direction==='below'
                ? `⏳ Esperant que ${inv?.ticker||'l\'actiu'} baixi fins a ${fmtEur(targetPrice)}`
                : `⏳ Esperant que ${inv?.ticker||'l\'actiu'} pugi fins a ${fmtEur(targetPrice)}`
            }
          </div>
          {goal.note && (
            <p style={{fontSize:11,color:'var(--c-text-muted)',marginTop:10,fontStyle:'italic'}}>"{goal.note}"</p>
          )}
        </>)}
      </div>
    </div>
  )
}

function AddGoalModal({ investments, onAdd, onClose }) {
  const [type, setType] = useState('savings')
  const [form, setForm] = useState({
    name:'', target:'', monthlyContrib:'', expectedReturn:'7',
    assetId: investments[0]?.id||'', targetPrice:'', direction:'below', note:'',
  })
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    if (type==='savings'&&(!form.target||parseFloat(form.target)<=0)) return setError("L'import objectiu és obligatori")
    if (type==='passive'&&(!form.target||parseFloat(form.target)<=0)) return setError("L'import mensual objectiu és obligatori")
    if (type==='asset'&&(!form.targetPrice||parseFloat(form.targetPrice)<=0)) return setError('El preu objectiu és obligatori')
    setError('')
    const inv = investments.find(i=>i.id===form.assetId)
    await onAdd({
      type, name:form.name.trim(),
      target:type==='asset'?0:parseFloat(form.target)||0,
      monthlyContrib:parseFloat(form.monthlyContrib)||0,
      expectedReturn:parseFloat(form.expectedReturn)||7,
      assetId:form.assetId, assetName:inv?.name||'',
      targetPrice:parseFloat(form.targetPrice)||0,
      direction:form.direction, note:form.note,
    })
    onClose()
  }

  const eligibleInvs = investments.filter(i=>i.ticker&&!['efectiu','estalvi'].includes(i.type))

  return (
    <div className="gl-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="gl-modal">
        <div className="gl-modal-drag"/>
        <div className="gl-modal-hdr">
          <h3 className="gl-modal-title">Nou objectiu</h3>
          <button className="gl-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="gl-fgroup">
          <div>
            <label className="gl-lbl">Tipus d'objectiu</label>
            <div className="gl-type-grid">
              {Object.entries(GOAL_TYPES).map(([key,meta])=>(
                <button key={key} className={`gl-type-btn${type===key?' sel':''}`} onClick={()=>setType(key)}>
                  <div className="gl-type-emoji">{meta.icon}</div>
                  <div className="gl-type-lbl">{meta.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="gl-lbl">Nom de l'objectiu</label>
            <input className="gl-inp" autoFocus value={form.name} onChange={e=>set('name',e.target.value)}
              placeholder={type==='savings'?"Ex: Fons d'emergència, Pis...":type==='passive'?"Ex: Renda passiva mensual":"Ex: Comprar si baixa"}/>
          </div>
          {type==='savings' && (<>
            <div>
              <label className="gl-lbl">Import objectiu (€)</label>
              <input type="number" inputMode="decimal" className="gl-inp mono" value={form.target} onChange={e=>set('target',e.target.value)} placeholder="100000"/>
            </div>
            <div className="gl-grid2">
              <div>
                <label className="gl-lbl">Aportació/mes (€)</label>
                <input type="number" inputMode="decimal" className="gl-inp mono" value={form.monthlyContrib} onChange={e=>set('monthlyContrib',e.target.value)} placeholder="500"/>
              </div>
              <div>
                <label className="gl-lbl">Retorn anual (%)</label>
                <input type="number" inputMode="decimal" className="gl-inp mono" value={form.expectedReturn} onChange={e=>set('expectedReturn',e.target.value)} placeholder="7"/>
              </div>
            </div>
          </>)}
          {type==='passive' && (
            <div>
              <label className="gl-lbl">Objectiu mensual (€/mes)</label>
              <input type="number" inputMode="decimal" className="gl-inp mono" value={form.target} onChange={e=>set('target',e.target.value)} placeholder="500"/>
            </div>
          )}
          {type==='asset' && (<>
            <div>
              <label className="gl-lbl">Actiu</label>
              <select className="gl-sel" value={form.assetId} onChange={e=>set('assetId',e.target.value)}>
                {eligibleInvs.length===0?<option value="">Cap actiu elegible</option>:eligibleInvs.map(i=><option key={i.id} value={i.id}>{i.name}{i.ticker?` (${i.ticker})`:''}</option>)}
              </select>
            </div>
            <div className="gl-grid2">
              <div>
                <label className="gl-lbl">Preu objectiu (€)</label>
                <input type="number" inputMode="decimal" className="gl-inp mono" value={form.targetPrice} onChange={e=>set('targetPrice',e.target.value)} placeholder="0.00"/>
              </div>
              <div>
                <label className="gl-lbl">Direcció</label>
                <select className="gl-sel" value={form.direction} onChange={e=>set('direction',e.target.value)}>
                  <option value="below">Baixi per sota de</option>
                  <option value="above">Pugi per sobre de</option>
                </select>
              </div>
            </div>
            <div>
              <label className="gl-lbl">Nota (opcional)</label>
              <input className="gl-inp" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Ex: Comprar 10 participacions addicionals"/>
            </div>
          </>)}
          {error&&<p className="gl-error">{error}</p>}
        </div>
        <div className="gl-mfooter">
          <button className="gl-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="gl-btn-ok" onClick={submit}>Crear objectiu</button>
        </div>
      </div>
    </div>
  )
}

export default function GoalsPage({ goals, addGoal, removeGoal, currentTotal=0, totalDividendsYear=0, investments=[] }) {
  const [showModal, setShowModal] = useState(false)
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const doneCount = goals.filter(g => {
    if (g.type==='savings') return currentTotal>=(g.target||0)
    if (g.type==='passive') return (totalDividendsYear/12)>=(g.target||0)
    return false
  }).length

  return (
    <div className="gl">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm}/>

      <div className="gl-hero">
        <div className="gl-hero-top">
          <div>
            <p className="gl-hero-label">Objectius financers</p>
            <p className="gl-hero-count">{goals.length}</p>
            <p className="gl-hero-sub">objectiu{goals.length!==1?'s':''} definit{goals.length!==1?'s':''}</p>
          </div>
          <button className="gl-btn-add" onClick={()=>setShowModal(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nou objectiu
          </button>
        </div>
        <div className="gl-hero-pills">
          {doneCount>0 && <span className="gl-hero-pill done">🏆 {doneCount} assolit{doneCount!==1?'s':''}</span>}
          {goals.length-doneCount>0 && <span className="gl-hero-pill pend">⏳ {goals.length-doneCount} en progrés</span>}
          {goals.length===0 && <span className="gl-hero-pill pend">Crea el primer objectiu →</span>}
        </div>
      </div>

      {goals.length===0 ? (
        <div className="gl-empty">
          <div className="gl-empty-icon">🎯</div>
          <p className="gl-empty-main">Encara no tens objectius</p>
          <p className="gl-empty-sub">Crea el primer per veure la simulació<br/>de quan l'assoliràs</p>
        </div>
      ) : (
        goals.map(g=>(
          <GoalCard key={g.id} goal={g} currentTotal={currentTotal}
            totalDividends={totalDividendsYear} investments={investments}
            onRemove={()=>askConfirm({name:g.name,onConfirm:()=>removeGoal(g.id)})}/>
        ))
      )}

      <div style={{height:16}}/>

      {showModal && (
        <AddGoalModal investments={investments} onAdd={addGoal} onClose={()=>setShowModal(false)}/>
      )}
    </div>
  )
}