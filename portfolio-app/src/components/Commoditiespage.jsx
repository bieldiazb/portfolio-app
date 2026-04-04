import { useState, useEffect } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const POPULAR = [
  { name:'Or',      symbol:'XAU', ticker:'GC=F',  unit:'oz',   unitLabel:'Unça troy' },
  { name:'Plata',   symbol:'XAG', ticker:'SI=F',  unit:'oz',   unitLabel:'Unça troy' },
  { name:'Platí',   symbol:'XPT', ticker:'PL=F',  unit:'oz',   unitLabel:'Unça troy' },
  { name:'Petroli', symbol:'OIL', ticker:'CL=F',  unit:'bbl',  unitLabel:'Barril'    },
  { name:'Gas nat.',symbol:'GAS', ticker:'NG=F',  unit:'MMBtu',unitLabel:'MMBtu'     },
  { name:'Coure',   symbol:'CU',  ticker:'HG=F',  unit:'lb',   unitLabel:'Lliura'    },
  { name:'Blat',    symbol:'WHT', ticker:'ZW=F',  unit:'bu',   unitLabel:'Bushel'    },
  { name:'Blat de moro', symbol:'CRN', ticker:'ZC=F', unit:'bu', unitLabel:'Bushel'  },
]

const COM_COLOR = { bg:'rgba(200,150,26,0.12)', color:'#c8961a', border:'rgba(200,150,26,0.25)' }

function fmtQty(n, unit) { if (!n) return `0 ${unit}`; return `${parseFloat(n.toFixed(4))} ${unit}` }
function currentValue(c) {
  const qty = c.totalQty ?? c.qty ?? 0
  if (c.currentPrice!=null&&qty>0) return qty*c.currentPrice
  return c.totalCost||0
}

const PriceTip = ({ active, payload }) => {
  if (!active||!payload?.length) return null
  return <div style={{background:COLORS.elevated,border:`1px solid rgba(255,255,255,0.08)`,borderRadius:5,padding:'5px 9px',fontFamily:FONTS.mono,fontSize:11,color:'#fff'}}>${payload[0]?.value?.toFixed(2)}</div>
}
const TrashIcon = ({size=12}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
  </svg>
)
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

const styles = `
  .cm { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  .cm-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; margin-bottom:12px; position:relative; overflow:hidden; }
  .cm-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(200,150,26,0.07) 0%,transparent 70%); pointer-events:none; }
  .cm-hero-label { font-size:10px; font-weight:500; color:rgba(255,255,255,0.30); letter-spacing:0.14em; text-transform:uppercase; margin-bottom:6px; }
  .cm-hero-total { font-size:34px; font-weight:300; color:#fff; letter-spacing:-1.5px; font-family:${FONTS.mono}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:10px; }
  .cm-hero-total span { font-size:18px; opacity:0.4; }
  .cm-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .cm-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; font-family:${FONTS.mono}; padding:4px 10px; border-radius:20px; }
  .cm-hero-badge.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .cm-hero-badge.neg { color:${COLORS.neonRed}; background:rgba(255,59,59,0.10); border:1px solid rgba(255,59,59,0.20); }
  .cm-hero-sub { font-size:11px; color:rgba(255,255,255,0.25); font-family:${FONTS.mono}; }

  .cm-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
  .cm-metric { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
  .cm-metric-label { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; }
  .cm-metric-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
  .cm-metric-val.g { color:${COLORS.neonGreen}; }
  .cm-metric-val.r { color:${COLORS.neonRed}; }
  .cm-metric-val.y { color:#c8961a; }
  .cm-metric-sub { font-size:10px; font-family:${FONTS.mono}; color:rgba(255,255,255,0.25); }

  .cm-actions { display:flex; gap:6px; align-items:center; margin-bottom:14px; }
  .cm-btn-ico { width:30px; height:30px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .cm-btn-ico:hover { border-color:${COLORS.borderHi}; }
  .cm-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:#c8961a; color:#000; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; cursor:pointer; margin-left:auto; white-space:nowrap; }
  .cm-btn-add:hover { opacity:0.85; }

  .cm-section-hdr { display:flex; align-items:center; margin-bottom:8px; }
  .cm-section-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  .cm-cards { display:flex; flex-direction:column; background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }
  .cm-card { border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .cm-card:last-child { border-bottom:none; }

  .cm-card-main { display:flex; align-items:center; gap:12px; padding:14px; transition:background 80ms; }
  .cm-card-main:active { background:rgba(255,255,255,0.02); }
  .cm-av { width:36px; height:36px; border-radius:10px; background:${COM_COLOR.bg}; border:1px solid ${COM_COLOR.border}; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; color:${COM_COLOR.color}; }
  .cm-card-info { flex:1; min-width:0; }
  .cm-card-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:3px; }
  .cm-card-meta { display:flex; align-items:center; gap:6px; }
  .cm-sym-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:1px 6px; border-radius:3px; background:${COM_COLOR.bg}; color:${COM_COLOR.color}; }
  .cm-card-price { font-size:10px; color:rgba(255,255,255,0.30); font-family:${FONTS.mono}; }
  .cm-card-right { text-align:right; flex-shrink:0; }
  .cm-card-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .cm-card-pct { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .cm-card-pct.pos { color:${COLORS.neonGreen}; }
  .cm-card-pct.neg { color:${COLORS.neonRed}; }
  .cm-card-chevron { color:rgba(255,255,255,0.20); margin-left:6px; flex-shrink:0; transition:transform 200ms; }
  .cm-card-chevron.open { transform:rotate(180deg); }

  .cm-expand { border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.015); }
  .cm-expand-inner { padding:16px 14px; }
  .cm-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:14px; }
  .cm-stat { position:relative; padding-right:12px; }
  .cm-stat:not(:last-child)::after { content:''; position:absolute; right:6px; top:2px; height:calc(100% - 4px); width:1px; background:rgba(255,255,255,0.06); }
  .cm-stat-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); margin-bottom:5px; text-transform:uppercase; letter-spacing:0.10em; }
  .cm-stat-v { font-size:13px; font-family:${FONTS.mono}; color:#fff; font-weight:500; font-variant-numeric:tabular-nums; }
  .cm-stat-v.pos { color:${COLORS.neonGreen}; }
  .cm-stat-v.neg { color:${COLORS.neonRed}; }

  .cm-expand-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .cm-expand-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:transparent; border:1px solid ${COLORS.border}; border-radius:5px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; white-space:nowrap; }

  .cm-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .cm-tx:last-child { border-bottom:none; }
  .cm-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:rgba(255,255,255,0.20); margin-left:8px; transition:all 80ms; }
  .cm-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  .cm-empty { padding:48px 0; text-align:center; }
  .cm-empty-main { font-size:14px; color:rgba(255,255,255,0.30); font-weight:500; margin-bottom:4px; }
  .cm-empty-sub { font-size:12px; color:rgba(255,255,255,0.15); }

  .cm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
  @media (min-width:640px) { .cm-overlay { align-items:center; padding:16px; } }
  .cm-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:12px 12px 0 0; width:100%; padding:20px 16px 36px; font-family:${FONTS.sans}; max-height:92dvh; overflow-y:auto; }
  @media (min-width:640px) { .cm-modal { border-radius:10px; max-width:420px; padding:24px 20px; } }
  .cm-modal-drag { width:36px; height:4px; border-radius:2px; background:${COLORS.border}; margin:0 auto 18px; display:block; }
  @media (min-width:640px) { .cm-modal-drag { display:none; } }
  .cm-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .cm-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .cm-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .cm-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .cm-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .cm-inp:focus { border-color:#c8961a; }
  .cm-inp::placeholder { color:${COLORS.textMuted}; }
  .cm-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .cm-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }
  .cm-fgroup { display:flex; flex-direction:column; gap:14px; }
  .cm-mfooter { display:flex; gap:8px; margin-top:20px; }
  .cm-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; }
  .cm-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; }
  .cm-btn-ok.def { background:#fff; color:#000; }
  .cm-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .cm-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .cm-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }
  .cm-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; margin-bottom:16px; }
  .cm-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; color:${COLORS.textMuted}; }
  .cm-type-tab.grn { background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; }
  .cm-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; }
  .cm-popular-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:14px; }
  .cm-pop-btn { padding:8px 4px; border-radius:6px; cursor:pointer; text-align:center; font-family:${FONTS.mono}; font-size:10px; font-weight:700; transition:all 100ms; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.40); }
  .cm-pop-btn:hover { color:rgba(255,255,255,0.70); }
  .cm-pop-btn.sel { background:${COM_COLOR.bg}; border-color:${COM_COLOR.border}; color:${COM_COLOR.color}; }
`

export default function CommoditiesPage({ commodities, onAdd, onRemove, onRefresh, onAddTransaction, onRemoveTransaction }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalValue = commodities.reduce((s,c)=>s+currentValue(c),0)
  const totalCost  = commodities.reduce((s,c)=>s+(c.totalCost||0),0)
  const totalGain  = totalValue-totalCost
  const isPos      = totalGain>=0
  const gainPct    = totalCost>0?(totalGain/totalCost)*100:0
  const posCount   = commodities.filter(c=>currentValue(c)>(c.totalCost||0)).length
  const sorted     = [...commodities].sort((a,b)=>sortDir==='desc'?currentValue(b)-currentValue(a):currentValue(a)-currentValue(b))
  const toggle     = id => setExpanded(e=>({...e,[id]:!e[id]}))

  return (
    <div className="cm">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm}/>

      {/* Hero */}
      <div className="cm-hero">
        <p className="cm-hero-label">Matèries primeres</p>
        <p className="cm-hero-total">{fmtEur(totalValue).replace('€','')}<span>€</span></p>
        <div className="cm-hero-row">
          {totalCost>0 && (
            <span className={`cm-hero-badge ${isPos?'pos':'neg'}`}>
              {isPos?'▲':'▼'} {isPos?'+':''}{fmtEur(totalGain)} ({Math.abs(gainPct).toFixed(2)}%)
            </span>
          )}
          <span className="cm-hero-sub">{commodities.length} posició{commodities.length!==1?'ns':''}</span>
        </div>
      </div>

      {/* Mètriques */}
      {commodities.length>0 && (
        <div className="cm-metrics">
          <div className="cm-metric">
            <p className="cm-metric-label">Invertit</p>
            <p className="cm-metric-val">{fmtEur(totalCost)}</p>
            <p className="cm-metric-sub">cost total</p>
          </div>
          <div className="cm-metric">
            <p className="cm-metric-label">P&amp;G</p>
            <p className={`cm-metric-val ${isPos?'g':'r'}`}>{isPos?'+':''}{fmtEur(totalGain)}</p>
            <p className="cm-metric-sub">{Math.abs(gainPct).toFixed(2)}%</p>
          </div>
          <div className="cm-metric">
            <p className="cm-metric-label">Posicions</p>
            <p className="cm-metric-val y">{commodities.length}</p>
            <p className="cm-metric-sub">{posCount} positives</p>
          </div>
        </div>
      )}

      {/* Accions */}
      <div className="cm-actions">
        {onRefresh && (
          <button className="cm-btn-ico" onClick={onRefresh} title="Actualitzar preus">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        )}
        <button className="cm-btn-ico" onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </button>
        <button className="cm-btn-add" onClick={()=>setShowNew(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova posició
        </button>
      </div>

      {commodities.length===0 ? (
        <div className="cm-empty">
          <p className="cm-empty-main">Cap matèria primera registrada</p>
          <p className="cm-empty-sub">Afegeix or, plata, petroli o altres commodities</p>
        </div>
      ) : (
        <>
          <div className="cm-section-hdr">
            <span className="cm-section-title">Posicions</span>
          </div>
          <div className="cm-cards">
            {sorted.map(c => {
              const qty    = c.totalQty??c.qty??0
              const curVal = currentValue(c)
              const cost   = c.totalCost||0
              const gain   = curVal-cost
              const gPct   = cost>0?(gain/cost)*100:0
              const pos    = gain>=0

              const chartData = (c.txs||[]).filter(t=>t.type==='buy'&&t.pricePerUnit>0).map((t,i)=>({i,price:t.pricePerUnit}))
              if (c.currentPrice!=null) chartData.push({i:chartData.length,price:c.currentPrice})

              return (
                <div key={c.id} className="cm-card">
                  <div className="cm-card-main" onClick={()=>toggle(c.id)}>
                    <div className="cm-av">{c.symbol?.slice(0,3)||c.name?.slice(0,2).toUpperCase()}</div>
                    <div className="cm-card-info">
                      <p className="cm-card-name">{c.name}</p>
                      <div className="cm-card-meta">
                        <span className="cm-sym-badge">{c.symbol}</span>
                        {c.currentPrice!=null && <span className="cm-card-price">${c.currentPrice.toFixed(2)}/{c.unit}</span>}
                        {qty>0 && <span className="cm-card-price">{fmtQty(qty,c.unit)}</span>}
                      </div>
                    </div>
                    {chartData.length>=3 && (
                      <div style={{width:50,height:28,flexShrink:0}}>
                        <ResponsiveContainer width="100%" height={28}>
                          <AreaChart data={chartData} margin={{top:2,right:0,left:0,bottom:2}}>
                            <defs>
                              <linearGradient id={`cmsg${c.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={pos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0.3}/>
                                <stop offset="100%" stopColor={pos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="price" stroke={pos?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill={`url(#cmsg${c.id})`} dot={false}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="cm-card-right">
                      <p className="cm-card-val">{fmtEur(curVal)}</p>
                      <p className={`cm-card-pct ${pos?'pos':'neg'}`}>{pos?'▲ +':'▼ '}{Math.abs(gPct).toFixed(2)}%</p>
                    </div>
                    <div className={`cm-card-chevron${expanded[c.id]?' open':''}`}><ChevronDown/></div>
                  </div>

                  {expanded[c.id] && (
                    <div className="cm-expand">
                      <div className="cm-expand-inner">
                        <div className="cm-stats">
                          {[
                            {l:'Preu mig', v:qty>0&&c.avgCost?`$${c.avgCost.toFixed(2)}/${c.unit}`:'—'},
                            {l:'Quantitat', v:fmtQty(qty,c.unit)},
                            {l:'Invertit',  v:fmtEur(cost)},
                            {l:'P&G',       v:(pos?'+':'')+fmtEur(gain), cls:pos?'pos':'neg'},
                          ].map((s,i)=>(
                            <div key={i} className="cm-stat">
                              <p className="cm-stat-l">{s.l}</p>
                              <p className={`cm-stat-v${s.cls?' '+s.cls:''}`}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="cm-expand-btns">
                          {[
                            {label:'Comprar',color:COLORS.neonGreen,bg:COLORS.bgGreen,border:COLORS.borderGreen,type:'buy'},
                            {label:'Vendre', color:COLORS.neonAmber,bg:COLORS.bgAmber,border:COLORS.borderAmber,type:'sell'},
                          ].map(b=>(
                            <button key={b.type} className="cm-expand-btn" style={{color:b.color}}
                              onClick={()=>setTxModal({id:c.id,name:c.name,symbol:c.symbol,unit:c.unit,ticker:c.ticker,type:b.type})}
                              onMouseOver={e=>{e.currentTarget.style.background=b.bg;e.currentTarget.style.borderColor=b.border}}
                              onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=COLORS.border}}
                            >{b.label}</button>
                          ))}
                          <button className="cm-expand-btn" style={{color:COLORS.neonRed,marginLeft:'auto'}}
                            onClick={()=>askConfirm({name:c.name,onConfirm:()=>onRemove(c.id)})}
                            onMouseOver={e=>{e.currentTarget.style.background=COLORS.bgRed;e.currentTarget.style.borderColor=COLORS.borderRed}}
                            onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=COLORS.border}}
                          >Eliminar</button>
                        </div>
                        {c.txs&&c.txs.length>0 && (
                          <>
                            <p style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>Operacions</p>
                            <div style={{maxHeight:180,overflowY:'auto'}}>
                              {[...c.txs].reverse().map(tx=>(
                                <div key={tx.id} className="cm-tx">
                                  <div style={{width:6,height:6,borderRadius:'50%',background:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber,flexShrink:0,marginRight:10}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.55)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.note||(tx.type==='buy'?'Compra':'Venda')}</p>
                                    <p style={{fontSize:10,color:'rgba(255,255,255,0.25)',margin:0}}>{tx.date||'—'}</p>
                                  </div>
                                  <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                                    <p style={{fontSize:12,fontWeight:600,fontFamily:FONTS.mono,color:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber,margin:0}}>{tx.type==='buy'?'+':'−'}{parseFloat(tx.qty).toFixed(4)} {c.unit}</p>
                                    <p style={{fontSize:10,color:'rgba(255,255,255,0.30)',fontFamily:FONTS.mono,marginTop:2}}>{fmtEur(tx.totalCostEur||tx.totalCost)}</p>
                                  </div>
                                  {onRemoveTransaction&&<button className="cm-tx-del" onClick={()=>onRemoveTransaction(c.id,tx.id)}><TrashIcon size={11}/></button>}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{height:16}}/>
      {showNew && <NewCommodityModal onAdd={d=>{onAdd(d);setShowNew(false)}} onClose={()=>setShowNew(false)}/>}
      {txModal && <TxModal item={txModal} onAdd={tx=>{onAddTransaction?.(txModal.id,tx);setTxModal(null)}} onClose={()=>setTxModal(null)}/>}
    </div>
  )
}

function NewCommodityModal({ onAdd, onClose }) {
  const [form, setForm] = useState({name:'',symbol:'',ticker:'',unit:'oz',unitLabel:'Unça troy'})
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const submit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    if (!form.ticker.trim()) return setError('El ticker de Yahoo és obligatori')
    setError(''); onAdd({name:form.name.trim(),symbol:form.symbol.toUpperCase(),ticker:form.ticker.trim(),unit:form.unit,unitLabel:form.unitLabel})
  }
  return (
    <div className="cm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cm-modal">
        <div className="cm-modal-drag"/>
        <div className="cm-modal-hdr"><h3 className="cm-modal-title">Nova matèria primera</h3><button className="cm-modal-x" onClick={onClose}>×</button></div>
        <label className="cm-lbl" style={{marginBottom:8}}>Populars</label>
        <div className="cm-popular-grid">
          {POPULAR.map(p=>(
            <button key={p.ticker} className={`cm-pop-btn${form.ticker===p.ticker?' sel':''}`} onClick={()=>setForm({name:p.name,symbol:p.symbol,ticker:p.ticker,unit:p.unit,unitLabel:p.unitLabel})}>{p.symbol}</button>
          ))}
        </div>
        <div className="cm-fgroup">
          <div className="cm-grid2">
            <div><label className="cm-lbl">Nom</label><input className="cm-inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Or"/></div>
            <div><label className="cm-lbl">Símbol</label><input className="cm-inp mono" value={form.symbol} onChange={e=>set('symbol',e.target.value.toUpperCase())} placeholder="XAU"/></div>
          </div>
          <div><label className="cm-lbl">Ticker Yahoo Finance</label><input className="cm-inp mono" value={form.ticker} onChange={e=>set('ticker',e.target.value)} placeholder="GC=F"/></div>
          <div className="cm-grid2">
            <div><label className="cm-lbl">Unitat</label><input className="cm-inp mono" value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="oz"/></div>
            <div><label className="cm-lbl">Nom unitat</label><input className="cm-inp" value={form.unitLabel} onChange={e=>set('unitLabel',e.target.value)} placeholder="Unça troy"/></div>
          </div>
          {error&&<p className="cm-error">{error}</p>}
        </div>
        <div className="cm-mfooter">
          <button className="cm-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="cm-btn-ok def" onClick={submit}>Crear posició</button>
        </div>
      </div>
    </div>
  )
}

function TxModal({ item, onAdd, onClose }) {
  const [type, setType]     = useState(item.type||'buy')
  const [qty, setQty]       = useState('')
  const [price, setPrice]   = useState('')
  const [total, setTotal]   = useState('')
  const [fxRate, setFxRate] = useState(null)
  const [note, setNote]     = useState('')
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [livePrice, setLivePrice] = useState(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [error, setError]   = useState('')

  useEffect(()=>{
    if(!item.ticker)return
    setFetchingPrice(true)
    Promise.all([
      fetch(`/yahoo/v8/finance/chart/${item.ticker}?interval=1d&range=1d`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).catch(()=>null),
      fetch(`/yahoo/v8/finance/chart/USDEUR=X?interval=1d&range=1d`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).catch(()=>null),
    ]).then(([d1,d2])=>{
      const p=d1?.chart?.result?.[0]?.meta?.regularMarketPrice; if(p>0)setLivePrice(+p.toFixed(4))
      const fx=d2?.chart?.result?.[0]?.meta?.regularMarketPrice; if(fx>0)setFxRate(+fx.toFixed(6))
      setFetchingPrice(false)
    })
  },[item.ticker])

  const recalc=(q,p)=>{const t=parseFloat(q)*parseFloat(p);if(!isNaN(t)&&t>0)setTotal(t.toFixed(2))}
  const handleQty=v=>{setQty(v);if(v&&price)recalc(v,price)}
  const handlePrice=v=>{setPrice(v);if(v&&qty)recalc(qty,v)}
  const fillLive=()=>{if(!livePrice)return;setPrice(livePrice.toString());if(qty)recalc(qty,livePrice)}

  const totalUsd=parseFloat(total)||0, totalEur=fxRate?+(totalUsd*fxRate).toFixed(2):totalUsd
  const priceUsd=parseFloat(price)||0, priceEur=fxRate?+(priceUsd*fxRate).toFixed(4):priceUsd

  const submit=()=>{
    const q=parseFloat(qty),t=parseFloat(total)
    if(!q||q<=0)return setError('La quantitat és obligatòria')
    if(!t||t<=0)return setError("L'import és obligatori")
    setError(''); onAdd({qty:q,pricePerUnit:priceUsd,pricePerUnitEur:priceEur,totalCost:totalUsd,totalCostEur:totalEur,type,note,date})
  }

  return (
    <div className="cm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cm-modal">
        <div className="cm-modal-drag"/>
        <div className="cm-modal-hdr">
          <h3 className="cm-modal-title">{item.name} <span style={{fontSize:11,color:COM_COLOR.color,fontFamily:FONTS.mono}}>{item.symbol}</span></h3>
          <button className="cm-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="cm-type-row">
          <button className={`cm-type-tab${type==='buy'?' grn':''}`} onClick={()=>setType('buy')}>↑ Compra</button>
          <button className={`cm-type-tab${type==='sell'?' org':''}`} onClick={()=>setType('sell')}>↓ Venda</button>
        </div>
        <div className="cm-fgroup">
          <div className="cm-grid2">
            <div><label className="cm-lbl">Quantitat ({item.unit})</label><input type="number" inputMode="decimal" step="any" className="cm-inp mono" value={qty} onChange={e=>handleQty(e.target.value)} placeholder="0.000"/></div>
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <label className="cm-lbl" style={{margin:0}}>Preu/u (USD)</label>
                <button onClick={fillLive} disabled={fetchingPrice||!livePrice} style={{fontSize:10,fontWeight:600,padding:'2px 8px',border:`1px solid ${COLORS.border}`,borderRadius:3,background:COLORS.elevated,color:livePrice?COLORS.neonGreen:COLORS.textMuted,fontFamily:FONTS.mono,cursor:livePrice?'pointer':'default'}}>{fetchingPrice?'...':livePrice?`$${livePrice}`:'—'}</button>
              </div>
              <input type="number" inputMode="decimal" step="any" className="cm-inp mono" value={price} onChange={e=>handlePrice(e.target.value)} placeholder="0.00"/>
            </div>
          </div>
          <div>
            <label className="cm-lbl">Total (USD)</label>
            <input type="number" inputMode="decimal" step="any" className="cm-inp mono" value={total} onChange={e=>setTotal(e.target.value)} placeholder="0.00"/>
            {totalUsd>0&&fxRate&&<p style={{fontSize:10,color:COLORS.textMuted,fontFamily:FONTS.mono,marginTop:4,textAlign:'right'}}>≈ <span style={{color:COLORS.textSecondary}}>{fmtEur(totalEur)}</span> <span style={{opacity:0.5}}>· 1 USD = {fxRate.toFixed(4)} €</span></p>}
          </div>
          <div className="cm-grid2">
            <div><label className="cm-lbl">Data</label><input type="date" className="cm-inp" value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label className="cm-lbl">Nota</label><input className="cm-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="opcional"/></div>
          </div>
          {error&&<p className="cm-error">{error}</p>}
        </div>
        <div className="cm-mfooter">
          <button className="cm-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`cm-btn-ok ${type==='buy'?'grn':'org'}`} onClick={submit}>{type==='buy'?'Registrar compra':'Registrar venda'}</button>
        </div>
      </div>
    </div>
  )
}