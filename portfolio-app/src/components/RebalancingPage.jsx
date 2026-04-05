import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'


const CATEGORIES = [
  { id:'etf',     label:'ETF / Renda variable', color:COLORS.neonCyan,   types:['etf','stock']       },
  { id:'estalvi', label:'Estalvi / Liquiditat',  color:COLORS.neonGreen,  types:['estalvi','efectiu'] },
  { id:'crypto',  label:'Crypto',                color:COLORS.neonAmber,  types:['crypto']            },
  { id:'robo',    label:'Robo Advisor',           color:COLORS.neonPurple, types:['robo']              },
]

const DEFAULT_GOALS   = { etf:50, estalvi:20, crypto:20, robo:10 }
const DRIFT_THRESHOLD = 5

const styles = `
  .rb { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .rb-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .rb-hero::before { content:''; position:absolute; top:-60px; right:-60px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle,rgba(0,255,136,0.06) 0%,transparent 70%); pointer-events:none; }
  .rb-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.28); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .rb-hero-row { display:flex; align-items:center; gap:16px; margin-bottom:14px; }
  .rb-hero-score-wrap { flex-shrink:0; }
  .rb-hero-info { flex:1; min-width:0; }
  .rb-hero-score-label { font-size:15px; font-weight:600; color:#fff; margin-bottom:3px; }
  .rb-hero-score-sub { font-size:12px; color:rgba(255,255,255,0.30); }
  .rb-hero-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.05); }
  .rb-hero-m-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.25); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .rb-hero-m-v { font-size:16px; font-weight:300; color:#fff; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .rb-hero-m-v.g { color:${COLORS.neonGreen}; }
  .rb-hero-m-v.r { color:${COLORS.neonRed}; }
  .rb-hero-m-v.a { color:${COLORS.neonAmber}; }

  /* ── Panel ── */
  .rb-panel { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:16px; }
  .rb-panel-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .rb-panel-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  .rb-edit-btn { padding:5px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.09); background:transparent; font-family:${FONTS.sans}; font-size:11px; font-weight:500; color:rgba(255,255,255,0.40); cursor:pointer; transition:all 100ms; }
  .rb-edit-btn:hover { border-color:rgba(255,255,255,0.20); color:rgba(255,255,255,0.70); }

  /* Category row */
  .rb-cat { padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .rb-cat:last-child { border-bottom:none; }
  .rb-cat-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .rb-cat-name { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:500; color:rgba(255,255,255,0.65); }
  .rb-cat-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .rb-cat-val { font-size:11px; color:rgba(255,255,255,0.28); font-family:${FONTS.num}; }
  .rb-cat-pcts { display:flex; align-items:center; gap:8px; }
  .rb-cat-actual { font-size:14px; font-weight:400; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; }
  .rb-cat-sep { font-size:11px; color:rgba(255,255,255,0.15); }
  .rb-cat-goal { font-size:12px; font-family:${FONTS.num}; color:rgba(255,255,255,0.30); font-variant-numeric:tabular-nums; }
  .rb-cat-diff { font-size:10px; font-weight:700; font-family:${FONTS.num}; padding:2px 8px; border-radius:10px; }

  /* Doble barra */
  .rb-bars { display:flex; flex-direction:column; gap:4px; }
  .rb-bar-row { display:flex; align-items:center; gap:6px; }
  .rb-bar-lbl { font-size:9px; color:rgba(255,255,255,0.22); width:24px; text-align:right; flex-shrink:0; }
  .rb-bar-track { flex:1; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; }
  .rb-bar-fill { height:100%; border-radius:2px; transition:width 600ms cubic-bezier(0.4,0,0.2,1); }

  /* Edit form */
  .rb-edit-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .rb-edit-row:last-of-type { border-bottom:none; }
  .rb-edit-label { flex:1; font-size:13px; font-weight:500; color:rgba(255,255,255,0.55); display:flex; align-items:center; gap:7px; }
  .rb-edit-inp { width:60px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:8px 10px; font-family:${FONTS.num}; font-size:14px; color:#fff; outline:none; text-align:right; transition:border-color 120ms; -webkit-appearance:none; }
  .rb-edit-inp:focus { border-color:rgba(0,255,136,0.35); }
  .rb-edit-pct { font-size:12px; color:rgba(255,255,255,0.30); }
  .rb-total-row { display:flex; justify-content:flex-end; margin-top:8px; }
  .rb-total-ok  { font-size:11px; font-family:${FONTS.num}; color:${COLORS.neonGreen}; }
  .rb-total-err { font-size:11px; font-family:${FONTS.num}; color:${COLORS.neonRed}; }
  .rb-edit-footer { display:flex; gap:8px; margin-top:14px; }
  .rb-btn-cancel { flex:1; padding:12px; border:1px solid rgba(255,255,255,0.09); background:transparent; border-radius:10px; font-family:${FONTS.sans}; font-size:13px; color:rgba(255,255,255,0.40); cursor:pointer; }
  .rb-btn-save { flex:1; padding:12px; border:none; border-radius:10px; font-family:${FONTS.sans}; font-size:13px; font-weight:700; background:${COLORS.neonGreen}; color:#000; cursor:pointer; }
  .rb-btn-save:disabled { opacity:0.25; cursor:not-allowed; }

  /* Suggestions */
  .rb-suggestion { display:flex; align-items:flex-start; gap:10px; padding:12px; border-radius:8px; margin-bottom:6px; }
  .rb-suggestion:last-child { margin-bottom:0; }
  .rb-suggestion.ok   { background:rgba(0,255,136,0.06); border:1px solid rgba(0,255,136,0.15); }
  .rb-suggestion.warn { background:rgba(255,149,0,0.06); border:1px solid rgba(255,149,0,0.15); }
  .rb-suggestion.info { background:rgba(0,212,255,0.06); border:1px solid rgba(0,212,255,0.15); }
  .rb-sug-icon { font-size:16px; flex-shrink:0; margin-top:1px; }
  .rb-sug-title { font-size:13px; font-weight:600; color:#fff; margin-bottom:3px; }
  .rb-sug-desc  { font-size:11px; color:rgba(255,255,255,0.40); line-height:1.65; }
  .rb-sug-action { font-size:11px; font-family:${FONTS.num}; color:rgba(255,255,255,0.55); margin-top:5px; font-weight:500; }
`

function ScoreGauge({ score }) {
  const r=32, cx=40, cy=40
  const circ  = 2*Math.PI*r
  const offset = circ*(1-score/100)
  const color = score>=80?COLORS.neonGreen:score>=50?COLORS.neonAmber:COLORS.neonRed
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:'stroke-dashoffset 700ms ease'}}/>
      <text x={cx} y={cy-5} textAnchor="middle" fontSize="22" fontFamily="DM Sans, system-ui" fontWeight="600" fill={color}>{score}</text>
      <text x={cx} y={cy+11} textAnchor="middle" fontSize="9" fontFamily="DM Sans, system-ui" fontWeight="500" fill="rgba(255,255,255,0.28)">/ 100</text>
    </svg>
  )
}

export default function RebalancingPage({ investments=[], savings=[], cryptos=[], goals:savedGoals, onSaveGoals }) {
  const [goals, setGoals]     = useState(savedGoals||DEFAULT_GOALS)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({...goals})

  const current = useMemo(() => {
    const vals={etf:0,estalvi:0,crypto:0,robo:0}
    investments.forEach(inv => {
      const val = (inv.totalQty||inv.qty)&&inv.currentPrice?(inv.totalQty||inv.qty)*inv.currentPrice:inv.totalCost||inv.initialValue||0
      if (['etf','stock'].includes(inv.type))     vals.etf+=val
      else if (inv.type==='robo')                  vals.robo+=val
      else if (['estalvi','efectiu'].includes(inv.type)) vals.estalvi+=val
    })
    savings.forEach(s => { vals.estalvi+=s.amount||0 })
    cryptos.forEach(c => {
      const qty=c.totalQty??c.qty??0
      vals.crypto+=qty&&c.currentPrice?qty*c.currentPrice:c.totalCost||c.initialValue||0
    })
    const total=Object.values(vals).reduce((a,b)=>a+b,0)
    const pcts={}
    Object.entries(vals).forEach(([k,v])=>{pcts[k]=total>0?(v/total)*100:0})
    return {vals,pcts,total}
  }, [investments,savings,cryptos])

  const score = useMemo(() => {
    const drift=CATEGORIES.reduce((s,cat)=>s+Math.abs((current.pcts[cat.id]||0)-(goals[cat.id]||0)),0)
    return Math.max(0,Math.round(100-drift*1.5))
  }, [current,goals])

  const scoreLabel = score>=85?'Excel·lent':score>=65?'Bé':score>=40?'Revisió recomanada':'Rebalanceig necessari'
  const scoreColor = score>=80?COLORS.neonGreen:score>=50?COLORS.neonAmber:COLORS.neonRed

  const alerts = useMemo(() => CATEGORIES.map(cat=>{
    const goal=goals[cat.id]||0, actual=current.pcts[cat.id]||0, diff=actual-goal
    const diffVal=(Math.abs(diff)/100)*current.total
    if (Math.abs(diff)<DRIFT_THRESHOLD) return null
    return {cat,diff,diffVal,type:diff>0?'warn':'info'}
  }).filter(Boolean).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff)), [goals,current])

  const draftTotal = Object.values(draft).reduce((a,b)=>a+(parseFloat(b)||0),0)
  const draftOk    = Math.abs(draftTotal-100)<0.5

  const handleSave = () => {
    if (!draftOk) return
    const ng=Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,parseFloat(v)||0]))
    setGoals(ng); onSaveGoals?.(ng); setEditing(false)
  }

  return (
    <div className="rb">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="rb-hero">
        <p className="rb-hero-label">Rebalanceig del portfoli</p>
        <div className="rb-hero-row">
          <div className="rb-hero-score-wrap">
            <ScoreGauge score={score}/>
          </div>
          <div className="rb-hero-info">
            <p className="rb-hero-score-label" style={{color:scoreColor}}>{scoreLabel}</p>
            <p className="rb-hero-score-sub">
              {alerts.length===0
                ? `Totes les categories dins el marge de ±${DRIFT_THRESHOLD}pp`
                : `${alerts.length} categoria${alerts.length>1?'es':''} fora del marge`}
            </p>
          </div>
        </div>
        <div className="rb-hero-metrics">
          <div>
            <p className="rb-hero-m-l">Total portfoli</p>
            <p className="rb-hero-m-v">{fmtEur(current.total)}</p>
          </div>
          <div>
            <p className="rb-hero-m-l">Categories OK</p>
            <p className="rb-hero-m-v g">{CATEGORIES.length-alerts.length}/{CATEGORIES.length}</p>
          </div>
          <div>
            <p className="rb-hero-m-l">Desviació màx.</p>
            <p className={`rb-hero-m-v ${alerts.length?'a':'g'}`}>
              {alerts.length?`${Math.abs(alerts[0].diff).toFixed(1)}pp`:'0pp'}
            </p>
          </div>
        </div>
      </div>

      {/* Distribució */}
      <div className="rb-panel">
        <div className="rb-panel-hdr">
          <p className="rb-panel-title">Distribució actual vs objectiu</p>
          <button className="rb-edit-btn" onClick={()=>{setEditing(!editing);setDraft({...goals})}}>
            {editing?'Cancel·lar':'⚙ Editar objectius'}
          </button>
        </div>

        {editing ? (<>
          {CATEGORIES.map(cat=>(
            <div key={cat.id} className="rb-edit-row">
              <div className="rb-edit-label">
                <div style={{width:8,height:8,borderRadius:'50%',background:cat.color,flexShrink:0}}/>
                {cat.label}
              </div>
              <input type="number" min="0" max="100" step="1" className="rb-edit-inp"
                value={draft[cat.id]??''} onChange={e=>setDraft(d=>({...d,[cat.id]:e.target.value}))}/>
              <span className="rb-edit-pct">%</span>
            </div>
          ))}
          <div className="rb-total-row">
            <span className={draftOk?'rb-total-ok':'rb-total-err'}>
              {draftTotal.toFixed(0)}% {draftOk?'✓':'— ha de sumar 100%'}
            </span>
          </div>
          <div className="rb-edit-footer">
            <button className="rb-btn-cancel" onClick={()=>setEditing(false)}>Cancel·lar</button>
            <button className="rb-btn-save" onClick={handleSave} disabled={!draftOk}>Guardar</button>
          </div>
        </>) : (
          CATEGORIES.map(cat=>{
            const goal=goals[cat.id]||0, actual=current.pcts[cat.id]||0, diff=actual-goal
            const isOut=Math.abs(diff)>=DRIFT_THRESHOLD
            const diffColor=diff>DRIFT_THRESHOLD?COLORS.neonAmber:diff<-DRIFT_THRESHOLD?COLORS.neonCyan:COLORS.neonGreen
            const diffBg=diff>DRIFT_THRESHOLD?'rgba(255,149,0,0.10)':diff<-DRIFT_THRESHOLD?'rgba(0,212,255,0.10)':'rgba(0,255,136,0.08)'
            return (
              <div key={cat.id} className="rb-cat">
                <div className="rb-cat-hdr">
                  <div className="rb-cat-name">
                    <div className="rb-cat-dot" style={{background:cat.color}}/>
                    {cat.label}
                    <span className="rb-cat-val">{fmtEur(current.vals[cat.id]||0)}</span>
                  </div>
                  <div className="rb-cat-pcts">
                    <span className="rb-cat-actual" style={{color:diffColor}}>{actual.toFixed(1)}%</span>
                    <span className="rb-cat-sep">vs</span>
                    <span className="rb-cat-goal">{goal}%</span>
                    <span className="rb-cat-diff" style={{color:diffColor,background:diffBg}}>
                      {diff>=0?'+':''}{diff.toFixed(1)}pp
                    </span>
                  </div>
                </div>
                <div className="rb-bars">
                  <div className="rb-bar-row">
                    <span className="rb-bar-lbl">obj</span>
                    <div className="rb-bar-track">
                      <div className="rb-bar-fill" style={{width:`${goal}%`,background:cat.color,opacity:0.25}}/>
                    </div>
                  </div>
                  <div className="rb-bar-row">
                    <span className="rb-bar-lbl" style={{color:cat.color}}>ara</span>
                    <div className="rb-bar-track">
                      <div className="rb-bar-fill" style={{width:`${Math.min(actual,100)}%`,background:cat.color,opacity:isOut?1:0.7}}/>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Suggeriments */}
      {!editing && (
        <div className="rb-panel">
          <p className="rb-panel-title" style={{marginBottom:12}}>Suggeriments d'acció</p>
          {alerts.length===0 ? (
            <div className="rb-suggestion ok">
              <span className="rb-sug-icon">🏆</span>
              <div>
                <p className="rb-sug-title">Portfoli ben equilibrat</p>
                <p className="rb-sug-desc">Totes les categories estan dins del marge de ±{DRIFT_THRESHOLD}pp respecte els teus objectius.</p>
              </div>
            </div>
          ) : alerts.map((a,i)=>(
            <div key={i} className={`rb-suggestion ${a.type}`}>
              <span className="rb-sug-icon">{a.type==='warn'?'⬆️':'⬇️'}</span>
              <div>
                <p className="rb-sug-title">
                  {a.cat.label} {a.type==='warn'?'sobrerepresentada':'infraponderada'}{' '}
                  <span style={{color:a.type==='warn'?COLORS.neonAmber:COLORS.neonCyan}}>
                    {a.diff>=0?'+':''}{a.diff.toFixed(1)}pp
                  </span>
                </p>
                <p className="rb-sug-desc">
                  {a.type==='warn'
                    ? `Tens ${fmtEur(a.diffVal)} més del compte en ${a.cat.label}. Considera no reinvertir dividends aquí fins que s'equilibri.`
                    : `Falta ${fmtEur(a.diffVal)} en ${a.cat.label} per assolir l'objectiu del ${goals[a.cat.id]}%.`}
                </p>
                <p className="rb-sug-action">
                  → {a.type==='warn'
                    ? `Redirigeix les properes aportacions a categories infraponderades`
                    : `Afegeix ~${fmtEur(a.diffVal)} a ${a.cat.label}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{height:16}}/>
    </div>
  )
}