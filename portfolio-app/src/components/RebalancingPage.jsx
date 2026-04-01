import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const CATEGORIES = [
  { id:'etf',     label:'ETF / Renda variable', color:COLORS.neonCyan,   types:['etf','stock']          },
  { id:'estalvi', label:'Estalvi / Liquiditat',  color:COLORS.neonGreen,  types:['estalvi','efectiu']    },
  { id:'crypto',  label:'Crypto',                color:COLORS.neonAmber,  types:['crypto']               },
  { id:'robo',    label:'Robo Advisor',           color:COLORS.neonPurple, types:['robo']                 },
]

const DEFAULT_GOALS   = { etf:50, estalvi:20, crypto:20, robo:10 }
const DRIFT_THRESHOLD = 5

const styles = `
  .rb { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  .rb-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .rb-sub   { font-size:12px; color:${COLORS.textMuted}; }

  .rb-panel { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:18px; }
  .rb-panel-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .rb-panel-title { font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; }

  /* Score */
  .rb-score { display:flex; align-items:center; gap:14px; padding:14px; border:1px solid ${COLORS.border}; border-radius:5px; background:${COLORS.elevated}; margin-bottom:16px; }
  .rb-score-circle { width:48px; height:48px; flex-shrink:0; }
  .rb-score-l { font-size:9px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:3px; }
  .rb-score-v { font-size:18px; font-weight:500; font-family:${FONTS.mono}; letter-spacing:-0.5px; margin-bottom:2px; }
  .rb-score-s { font-size:10px; color:${COLORS.textMuted}; }

  /* Objectius */
  .rb-goal { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid ${COLORS.border}; }
  .rb-goal:last-child { border-bottom:none; }
  .rb-goal-left { width:120px; flex-shrink:0; }
  .rb-goal-name { font-size:12px; font-weight:500; color:${COLORS.textSecondary}; display:flex; align-items:center; gap:6px; margin-bottom:3px; }
  .rb-goal-dot  { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .rb-goal-val  { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }

  .rb-goal-bars { flex:1; display:flex; flex-direction:column; gap:5px; }
  .rb-bar-row   { display:flex; align-items:center; gap:6px; }
  .rb-bar-lbl   { font-size:9px; color:${COLORS.textMuted}; width:22px; text-align:right; font-family:${FONTS.mono}; flex-shrink:0; }
  .rb-bar-track { flex:1; height:3px; background:${COLORS.border}; border-radius:2px; overflow:hidden; }
  .rb-bar-fill  { height:100%; border-radius:2px; transition:width 500ms cubic-bezier(0.4,0,0.2,1); }
  .rb-bar-pct   { font-size:10px; font-family:${FONTS.mono}; width:34px; text-align:right; flex-shrink:0; font-variant-numeric:tabular-nums; }
  .rb-bar-diff  { font-size:9px; font-family:${FONTS.mono}; font-weight:600; width:44px; text-align:right; flex-shrink:0; padding:1px 5px; border-radius:2px; }

  /* Edit */
  .rb-edit-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .rb-edit-row:last-of-type { border-bottom:none; }
  .rb-edit-label { flex:1; font-size:12px; color:${COLORS.textSecondary}; display:flex; align-items:center; gap:7px; }
  .rb-edit-inp { width:52px; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:4px; padding:7px 9px; font-family:${FONTS.mono}; font-size:13px; color:${COLORS.textPrimary}; outline:none; text-align:right; transition:border-color 120ms; }
  .rb-edit-inp:focus { border-color:${COLORS.neonPurple}; }
  .rb-edit-pct { font-size:11px; color:${COLORS.textMuted}; }
  .rb-total-row { display:flex; justify-content:flex-end; font-size:10px; font-family:${FONTS.mono}; margin-top:6px; }
  .rb-total-ok  { color:${COLORS.neonGreen}; }
  .rb-total-err { color:${COLORS.neonRed}; }

  .rb-edit-btn { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border:1px solid ${COLORS.border}; border-radius:3px; background:transparent; font-family:${FONTS.sans}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; }
  .rb-edit-btn:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }

  .rb-footer { display:flex; gap:8px; margin-top:14px; }
  .rb-btn-cancel { flex:1; padding:10px; border:1px solid ${COLORS.border}; background:transparent; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .rb-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .rb-btn-save { flex:1; padding:10px; border:none; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; background:${COLORS.neonPurple}; color:#fff; cursor:pointer; transition:opacity 100ms; }
  .rb-btn-save:hover { opacity:0.85; }
  .rb-btn-save:disabled { opacity:0.30; cursor:not-allowed; }

  /* Alerts */
  .rb-alerts { display:flex; flex-direction:column; gap:6px; }
  .rb-alert { display:flex; align-items:flex-start; gap:9px; padding:10px 12px; border-radius:4px; }
  .rb-alert.warn { background:${COLORS.bgAmber}; border:1px solid ${COLORS.borderAmber}; }
  .rb-alert.info { background:${COLORS.bgCyan};  border:1px solid ${COLORS.borderCyan};  }
  .rb-alert.ok   { background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; }
  .rb-alert-body { font-size:11px; color:${COLORS.textSecondary}; line-height:1.6; }
  .rb-alert-body strong { font-weight:600; color:${COLORS.textPrimary}; }
  .rb-alert-action { font-size:10px; color:${COLORS.textMuted}; margin-top:3px; font-family:${FONTS.mono}; }
`

function ScoreGauge({ score }) {
  const r=20, cx=24, cy=24
  const circ  = 2*Math.PI*r
  const offset = circ*(1-score/100)
  const color = score>=80?COLORS.neonGreen:score>=50?COLORS.neonAmber:COLORS.neonRed
  return (
    <svg className="rb-score-circle" viewBox="0 0 48 48">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.border} strokeWidth="4"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:'stroke-dashoffset 600ms ease'}}
      />
      <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fontFamily="Geist Mono" fontWeight="500" fill={color}>{score}</text>
    </svg>
  )
}

export default function RebalancingPage({ investments=[], savings=[], cryptos=[], goals:savedGoals, onSaveGoals }) {
  const [goals, setGoals]   = useState(savedGoals||DEFAULT_GOALS)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]   = useState({...goals})

  const current = useMemo(() => {
    const vals={etf:0,estalvi:0,crypto:0,robo:0}
    investments.forEach(inv=>{
      const val=inv.qty&&inv.currentPrice?inv.qty*inv.currentPrice:inv.initialValue||0
      if (['etf','stock'].includes(inv.type)) vals.etf+=val
      else if (inv.type==='robo')             vals.robo+=val
      else if (['estalvi','efectiu'].includes(inv.type)) vals.estalvi+=val
    })
    savings.forEach(s=>{vals.estalvi+=s.amount})
    cryptos.forEach(c=>{vals.crypto+=(c.totalQty??c.qty??0)&&c.currentPrice?(c.totalQty??c.qty)*c.currentPrice:c.initialValue||0})
    const total=Object.values(vals).reduce((a,b)=>a+b,0)
    const pcts={}
    Object.entries(vals).forEach(([k,v])=>{pcts[k]=total>0?(v/total)*100:0})
    return {vals,pcts,total}
  }, [investments,savings,cryptos])

  const score = useMemo(() => {
    const totalDrift=CATEGORIES.reduce((sum,cat)=>sum+Math.abs((current.pcts[cat.id]||0)-(goals[cat.id]||0)),0)
    return Math.max(0,Math.round(100-totalDrift*1.5))
  }, [current,goals])

  const scoreLabel = score>=85?'Excel·lent':score>=65?'Bé':score>=40?'Atenció':'Rebalanceig necessari'
  const scoreColor = score>=80?COLORS.neonGreen:score>=50?COLORS.neonAmber:COLORS.neonRed

  const alerts = useMemo(() => {
    return CATEGORIES.map(cat=>{
      const goal=goals[cat.id]||0, actual=current.pcts[cat.id]||0, diff=actual-goal
      const diffVal=(Math.abs(diff)/100)*current.total
      if (Math.abs(diff)<DRIFT_THRESHOLD) return null
      return {cat,diff,diffVal,type:diff>0?'warn':'info'}
    }).filter(Boolean).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))
  }, [goals,current])

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

      <div>
        <h2 className="rb-title">Rebalanceig</h2>
        <p className="rb-sub">Compara la distribució actual amb els teus objectius</p>
      </div>

      {/* Score + distribució */}
      <div className="rb-panel">
        <div className="rb-score">
          <ScoreGauge score={score}/>
          <div>
            <p className="rb-score-l">Puntuació</p>
            <p className="rb-score-v" style={{color:scoreColor}}>{scoreLabel}</p>
            <p className="rb-score-s">
              {alerts.length===0?'Totes les categories dins del marge':`${alerts.length} categoria${alerts.length>1?'es':''} fora de marge (±${DRIFT_THRESHOLD}pp)`}
            </p>
          </div>
        </div>

        <div className="rb-panel-hdr">
          <p className="rb-panel-title">Assignació actual vs objectiu</p>
          <button className="rb-edit-btn" onClick={()=>{setEditing(!editing);setDraft({...goals})}}>
            {editing?'✕ Cancel·lar':'⚙ Editar'}
          </button>
        </div>

        {editing ? (
          <>
            {CATEGORIES.map(cat=>(
              <div key={cat.id} className="rb-edit-row">
                <div className="rb-edit-label">
                  <div style={{width:6,height:6,borderRadius:'50%',background:cat.color,flexShrink:0}}/>
                  {cat.label}
                </div>
                <input type="number" min="0" max="100" step="1" className="rb-edit-inp"
                  value={draft[cat.id]??''} onChange={e=>setDraft(d=>({...d,[cat.id]:e.target.value}))} />
                <span className="rb-edit-pct">%</span>
              </div>
            ))}
            <div className="rb-total-row">
              <span className={draftOk?'rb-total-ok':'rb-total-err'}>
                {draftTotal.toFixed(0)}% {draftOk?'✓ correcte':'— ha de sumar 100%'}
              </span>
            </div>
            <div className="rb-footer">
              <button className="rb-btn-cancel" onClick={()=>setEditing(false)}>Cancel·lar</button>
              <button className="rb-btn-save" onClick={handleSave} disabled={!draftOk}>Guardar objectius</button>
            </div>
          </>
        ) : (
          CATEGORIES.map(cat=>{
            const goal=goals[cat.id]||0, actual=current.pcts[cat.id]||0, diff=actual-goal
            const isOver=diff>DRIFT_THRESHOLD, isUnder=diff<-DRIFT_THRESHOLD
            const diffColor=isOver?COLORS.neonAmber:isUnder?COLORS.neonCyan:COLORS.neonGreen
            const diffBg=isOver?COLORS.bgAmber:isUnder?COLORS.bgCyan:'transparent'
            return (
              <div key={cat.id} className="rb-goal">
                <div className="rb-goal-left">
                  <div className="rb-goal-name">
                    <div className="rb-goal-dot" style={{background:cat.color}}/>
                    {cat.label}
                  </div>
                  <p className="rb-goal-val">{fmtEur(current.vals[cat.id]||0)}</p>
                </div>
                <div className="rb-goal-bars">
                  <div className="rb-bar-row">
                    <span className="rb-bar-lbl">obj</span>
                    <div className="rb-bar-track"><div className="rb-bar-fill" style={{width:`${goal}%`,background:cat.color,opacity:0.25}}/></div>
                    <span className="rb-bar-pct" style={{color:COLORS.textMuted}}>{goal}%</span>
                    <span className="rb-bar-diff" style={{color:'transparent'}}>—</span>
                  </div>
                  <div className="rb-bar-row">
                    <span className="rb-bar-lbl" style={{color:cat.color,opacity:0.7}}>ara</span>
                    <div className="rb-bar-track"><div className="rb-bar-fill" style={{width:`${Math.min(actual,100)}%`,background:cat.color}}/></div>
                    <span className="rb-bar-pct" style={{color:diffColor}}>{actual.toFixed(1)}%</span>
                    <span className="rb-bar-diff" style={{color:diffColor,background:diffBg}}>
                      {diff>=0?'+':''}{diff.toFixed(1)}pp
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
        <div className="rb-panel">
          <p className="rb-panel-title" style={{marginBottom:12}}>Suggeriments d'acció</p>
          <div className="rb-alerts">
            {alerts.length===0 ? (
              <div className="rb-alert ok">
                <span style={{fontSize:13,color:COLORS.neonGreen,flexShrink:0,marginTop:1}}>✓</span>
                <div className="rb-alert-body"><strong>Portfoli equilibrat.</strong> Totes les categories estan dins del marge de {DRIFT_THRESHOLD}pp.</div>
              </div>
            ) : alerts.map((a,i)=>(
              <div key={i} className={`rb-alert ${a.type}`}>
                <span style={{fontSize:13,color:a.type==='warn'?COLORS.neonAmber:COLORS.neonCyan,flexShrink:0,marginTop:1}}>
                  {a.type==='warn'?'↑':'↓'}
                </span>
                <div>
                  <div className="rb-alert-body">
                    <strong>{a.cat.label}</strong> {a.type==='warn'?'sobrerepresentada':'infraponderada'}{' '}
                    (<strong style={{color:a.type==='warn'?COLORS.neonAmber:COLORS.neonCyan}}>{a.diff>=0?'+':''}{a.diff.toFixed(1)}pp</strong>).
                  </div>
                  <div className="rb-alert-action">
                    → {a.type==='warn'?`Desvia ~${fmtEur(a.diffVal)} cap a categories infraponderades`:`Afegeix ~${fmtEur(a.diffVal)} a ${a.cat.label}`}
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