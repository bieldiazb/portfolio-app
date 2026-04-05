import { useState, useMemo, useEffect } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

const POPULAR = [
  { name:'Bitcoin',   coinId:'bitcoin',     symbol:'BTC'  },
  { name:'Ethereum',  coinId:'ethereum',    symbol:'ETH'  },
  { name:'Solana',    coinId:'solana',      symbol:'SOL'  },
  { name:'XRP',       coinId:'ripple',      symbol:'XRP'  },
  { name:'Cardano',   coinId:'cardano',     symbol:'ADA'  },
  { name:'Avalanche', coinId:'avalanche-2', symbol:'AVAX' },
  { name:'Polkadot',  coinId:'polkadot',    symbol:'DOT'  },
  { name:'Chainlink', coinId:'chainlink',   symbol:'LINK' },
]

function fmtQty(n) { if (!n) return '0'; return parseFloat(n.toFixed(8)).toString() }
function currentValue(c) {
  const qty = c.totalQty ?? c.qty ?? 0
  if (c.currentPrice != null && qty > 0) return qty * c.currentPrice
  return c.totalCost || c.initialValue || 0
}

const PriceTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return <div style={{ background:COLORS.elevated, border:`1px solid rgba(255,255,255,0.08)`, borderRadius:5, padding:'5px 9px', fontFamily:FONTS.mono, fontSize:11, color:'#fff' }}>{fmtEur(payload[0]?.value)}</div>
}
const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
  </svg>
)
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

const styles = `
  .cr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  .cr-hero { background:linear-gradient(135deg,#0f0f0f 0%,#141414 100%); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; margin-bottom:12px; position:relative; overflow:hidden; }
  .cr-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(255,149,0,0.07) 0%,transparent 70%); pointer-events:none; }
  .cr-hero-label { font-size:11px; font-weight:500; color:rgba(255,255,255,0.30); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .cr-hero-total { font-size:36px; font-weight:600; color:#fff; letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; margin-bottom:12px; }
  .cr-hero-total span { font-size:30px; opacity:0.7; }
  .cr-hero-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .cr-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; font-family:${FONTS.mono}; padding:4px 10px; border-radius:20px; }
  .cr-hero-badge.pos { color:${COLORS.neonGreen}; background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20); }
  .cr-hero-badge.neg { color:${COLORS.neonRed}; background:rgba(255,59,59,0.10); border:1px solid rgba(255,59,59,0.20); }
  .cr-hero-sub { font-size:11px; color:rgba(255,255,255,0.25); font-family:${FONTS.mono}; }

  .cr-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
  .cr-metric { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; }
  .cr-metric-label { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); text-transform:uppercase; letter-spacing:0.12em; }
  .cr-metric-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; letter-spacing:-0.3px; font-variant-numeric:tabular-nums; }
  .cr-metric-val.g { color:${COLORS.neonGreen}; }
  .cr-metric-val.r { color:${COLORS.neonRed}; }
  .cr-metric-val.a { color:${COLORS.neonAmber}; }
  .cr-metric-sub { font-size:10px; font-family:${FONTS.mono}; color:rgba(255,255,255,0.25); }

  .cr-actions { display:flex; gap:6px; align-items:center; margin-bottom:14px; }
  .cr-btn-ico { width:30px; height:30px; background:transparent; border:1px solid ${COLORS.border}; border-radius:6px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .cr-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .cr-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:${COLORS.neonAmber}; color:#000; border:none; border-radius:6px; font-family:${FONTS.sans}; font-size:12px; font-weight:600; cursor:pointer; margin-left:auto; white-space:nowrap; }
  .cr-btn-add:hover { opacity:0.85; }

  .cr-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .cr-section-title { font-size:10px; font-weight:600; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.14em; }

  .cr-cards { display:flex; flex-direction:column; background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:10px; overflow:hidden; }
  .cr-card { border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .cr-card:last-child { border-bottom:none; }

  .cr-card-main { display:flex; align-items:center; gap:12px; padding:14px; transition:background 80ms; }
  .cr-card-main:active { background:rgba(255,255,255,0.02); }
  .cr-av { width:36px; height:36px; border-radius:10px; background:rgba(255,149,0,0.12); border:1px solid rgba(255,149,0,0.20); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; color:${COLORS.neonAmber}; }
  .cr-card-info { flex:1; min-width:0; }
  .cr-card-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:3px; }
  .cr-card-meta { display:flex; align-items:center; gap:6px; }
  .cr-sym-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:1px 6px; border-radius:3px; background:rgba(255,149,0,0.12); color:${COLORS.neonAmber}; }
  .cr-card-price { font-size:10px; color:rgba(255,255,255,0.30); font-family:${FONTS.mono}; }
  .cr-card-right { text-align:right; flex-shrink:0; }
  .cr-card-val { font-size:15px; font-weight:500; font-family:${FONTS.mono}; color:#fff; font-variant-numeric:tabular-nums; margin-bottom:3px; }
  .cr-card-pct { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .cr-card-pct.pos { color:${COLORS.neonGreen}; }
  .cr-card-pct.neg { color:${COLORS.neonRed}; }
  .cr-card-chevron { color:rgba(255,255,255,0.20); margin-left:6px; flex-shrink:0; transition:transform 200ms; }
  .cr-card-chevron.open { transform:rotate(180deg); }

  .cr-expand { border-top:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.015); }
  .cr-expand-inner { padding:16px 14px; }
  .cr-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:14px; }
  .cr-stat { position:relative; padding-right:12px; }
  .cr-stat:not(:last-child)::after { content:''; position:absolute; right:6px; top:2px; height:calc(100% - 4px); width:1px; background:rgba(255,255,255,0.06); }
  .cr-stat-l { font-size:9px; font-weight:500; color:rgba(255,255,255,0.30); margin-bottom:5px; text-transform:uppercase; letter-spacing:0.10em; }
  .cr-stat-v { font-size:13px; font-family:${FONTS.mono}; color:#fff; font-weight:500; font-variant-numeric:tabular-nums; }
  .cr-stat-v.pos { color:${COLORS.neonGreen}; }
  .cr-stat-v.neg { color:${COLORS.neonRed}; }

  .cr-expand-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .cr-expand-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:transparent; border:1px solid ${COLORS.border}; border-radius:5px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; white-space:nowrap; }

  .cr-tx-list { display:flex; flex-direction:column; }
  .cr-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .cr-tx:last-child { border-bottom:none; }
  .cr-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:rgba(255,255,255,0.20); margin-left:8px; transition:all 80ms; }
  .cr-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  .cr-empty { padding:48px 0; text-align:center; }
  .cr-empty-main { font-size:14px; color:rgba(255,255,255,0.30); font-weight:500; margin-bottom:4px; }
  .cr-empty-sub { font-size:12px; color:rgba(255,255,255,0.15); }

  .cr-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
  @media (min-width:640px) { .cr-overlay { align-items:center; padding:16px; } }
  .cr-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:12px 12px 0 0; width:100%; padding:20px 16px 100px; font-family:${FONTS.sans}; max-height:92dvh; overflow-y:auto; }
  @media (min-width:640px) { .cr-modal { border-radius:10px; max-width:420px; padding:24px 20px; } }
  .cr-modal-drag { width:36px; height:4px; border-radius:2px; background:${COLORS.border}; margin:0 auto 18px; display:block; }
  @media (min-width:640px) { .cr-modal-drag { display:none; } }
  .cr-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .cr-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .cr-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .cr-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .cr-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .cr-inp:focus { border-color:${COLORS.neonAmber}; }
  .cr-inp::placeholder { color:${COLORS.textMuted}; }
  .cr-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .cr-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }
  .cr-fgroup { display:flex; flex-direction:column; gap:14px; }
  .cr-mfooter { display:flex; gap:8px; margin-top:20px; }
  .cr-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; }
  .cr-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; }
  .cr-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .cr-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .cr-btn-ok.def { background:#fff; color:#000; }
  .cr-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }
  .cr-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:6px; overflow:hidden; margin-bottom:16px; }
  .cr-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; color:${COLORS.textMuted}; }
  .cr-type-tab.grn { background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; }
  .cr-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; }
  .cr-popular-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:14px; }
  .cr-pop-btn { padding:8px 4px; border-radius:6px; cursor:pointer; text-align:center; font-family:${FONTS.mono}; font-size:11px; font-weight:700; transition:all 100ms; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.40); }
  .cr-pop-btn:hover { color:rgba(255,255,255,0.70); border-color:rgba(255,255,255,0.15); }
  .cr-pop-btn.sel { background:rgba(255,149,0,0.12); border-color:rgba(255,149,0,0.30); color:${COLORS.neonAmber}; }
`

export default function CryptoPage({ cryptos, onAdd, onRemove, onUpdate, onRefresh, onAddTransaction, onRemoveTransaction }) {
  const [showNew, setShowNew]   = useState(false)
  const [txModal, setTxModal]   = useState(null)
  const [expanded, setExpanded] = useState({})
  const [sortDir, setSortDir]   = useState('desc')
  const { confirmState, askConfirm, closeConfirm } = useConfirmDelete()

  const totalValue = cryptos.reduce((s,c)=>s+currentValue(c),0)
  const totalCost  = cryptos.reduce((s,c)=>s+(c.totalCost||c.initialValue||0),0)
  const totalGain  = totalValue-totalCost
  const isPos      = totalGain>=0
  const gainPct    = totalCost>0?(totalGain/totalCost)*100:0
  const posCount   = cryptos.filter(c=>currentValue(c)>(c.totalCost||c.initialValue||0)).length
  const sorted     = [...cryptos].sort((a,b)=>sortDir==='desc'?currentValue(b)-currentValue(a):currentValue(a)-currentValue(b))
  const toggle     = id => setExpanded(e=>({...e,[id]:!e[id]}))

  return (
    <div className="cr">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm}/>

      {/* Hero */}
      <div className="cr-hero">
        <p className="cr-hero-label">Cartera crypto</p>
        <p className="cr-hero-total">{fmtEur(totalValue).replace('€','')}<span>€</span></p>
        <div className="cr-hero-row">
          {totalCost>0 && (
            <span className={`cr-hero-badge ${isPos?'pos':'neg'}`}>
              {isPos?'▲':'▼'} {isPos?'+':''}{fmtEur(totalGain)} ({Math.abs(gainPct).toFixed(2)}%)
            </span>
          )}
          <span className="cr-hero-sub">{cryptos.length} actiu{cryptos.length!==1?'s':''} · {posCount} en positiu</span>
        </div>
      </div>

      {/* Mètriques */}
      {cryptos.length>0 && (
        <div className="cr-metrics">
          <div className="cr-metric">
            <p className="cr-metric-label">Invertit</p>
            <p className="cr-metric-val">{fmtEur(totalCost)}</p>
            <p className="cr-metric-sub">cost total</p>
          </div>
          <div className="cr-metric">
            <p className="cr-metric-label">P&amp;G</p>
            <p className={`cr-metric-val ${isPos?'g':'r'}`}>{isPos?'+':''}{fmtEur(totalGain)}</p>
            <p className="cr-metric-sub">{Math.abs(gainPct).toFixed(2)}%</p>
          </div>
          <div className="cr-metric">
            <p className="cr-metric-label">Actius</p>
            <p className="cr-metric-val a">{cryptos.length}</p>
            <p className="cr-metric-sub">{posCount} positius</p>
          </div>
        </div>
      )}

      {/* Accions */}
      <div className="cr-actions">
        {onRefresh && (
          <button className="cr-btn-ico" onClick={onRefresh} title="Actualitzar preus">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        )}
        <button className="cr-btn-ico" onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </button>
        <button className="cr-btn-add" onClick={()=>setShowNew(true)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova crypto
        </button>
      </div>

      {cryptos.length===0 ? (
        <div className="cr-empty">
          <p className="cr-empty-main">Cap criptomoneda registrada</p>
          <p className="cr-empty-sub">Afegeix BTC, ETH o qualsevol altra crypto</p>
        </div>
      ) : (
        <>
          <div className="cr-section-hdr">
            <span className="cr-section-title">Posicions</span>
          </div>
          <div className="cr-cards">
            {sorted.map(c => {
              const qty    = c.totalQty??c.qty??0
              const curVal = currentValue(c)
              const cost   = c.totalCost||c.initialValue||0
              const gain   = curVal-cost
              const gPct   = cost>0?(gain/cost)*100:0
              const pos    = gain>=0

              const chartData = (c.txs||[]).filter(t=>t.type==='buy'&&t.pricePerUnit>0).map((t,i)=>({i,price:t.pricePerUnit}))
              if (c.currentPrice!=null) chartData.push({i:chartData.length,price:c.currentPrice})

              return (
                <div key={c.id} className="cr-card">
                  <div className="cr-card-main" onClick={()=>toggle(c.id)}>
                    <div className="cr-av">{c.symbol?.slice(0,3)||c.name?.slice(0,2).toUpperCase()}</div>
                    <div className="cr-card-info">
                      <p className="cr-card-name">{c.name}</p>
                      <div className="cr-card-meta">
                        <span className="cr-sym-badge">{c.symbol}</span>
                        {c.currentPrice!=null && <span className="cr-card-price">{fmtEur(c.currentPrice)}/u.</span>}
                        {qty>0 && <span className="cr-card-price">{fmtQty(qty)} u.</span>}
                      </div>
                    </div>
                    {chartData.length>=3 && (
                      <div style={{width:50,height:28,flexShrink:0}}>
                        <ResponsiveContainer width="100%" height={28}>
                          <AreaChart data={chartData} margin={{top:2,right:0,left:0,bottom:2}}>
                            <defs>
                              <linearGradient id={`sg${c.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={pos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0.3}/>
                                <stop offset="100%" stopColor={pos?COLORS.neonGreen:COLORS.neonRed} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="price" stroke={pos?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill={`url(#sg${c.id})`} dot={false}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="cr-card-right">
                      <p className="cr-card-val">{fmtEur(curVal)}</p>
                      <p className={`cr-card-pct ${pos?'pos':'neg'}`}>{pos?'▲ +':'▼ '}{Math.abs(gPct).toFixed(2)}%</p>
                    </div>
                    <div className={`cr-card-chevron${expanded[c.id]?' open':''}`}><ChevronDown/></div>
                  </div>

                  {expanded[c.id] && (
                    <div className="cr-expand">
                      <div className="cr-expand-inner">
                        <div className="cr-stats">
                          {[
                            {l:'Cost mitjà', v:qty>0&&c.avgCost?fmtEur(c.avgCost)+'/u.':'—'},
                            {l:'Quantitat',  v:fmtQty(qty)},
                            {l:'Invertit',   v:fmtEur(cost)},
                            {l:'P&G',        v:(pos?'+':'')+fmtEur(gain), cls:pos?'pos':'neg'},
                          ].map((s,i)=>(
                            <div key={i} className="cr-stat">
                              <p className="cr-stat-l">{s.l}</p>
                              <p className={`cr-stat-v${s.cls?' '+s.cls:''}`}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="cr-expand-btns">
                          {[
                            {label:'Comprar',color:COLORS.neonGreen,bg:COLORS.bgGreen,border:COLORS.borderGreen,type:'buy'},
                            {label:'Vendre', color:COLORS.neonAmber,bg:COLORS.bgAmber,border:COLORS.borderAmber,type:'sell'},
                          ].map(b=>(
                            <button key={b.type} className="cr-expand-btn" style={{color:b.color}}
                              onClick={()=>setTxModal({cryptoId:c.id,name:c.name,symbol:c.symbol,coinId:c.coinId,type:b.type})}
                              onMouseOver={e=>{e.currentTarget.style.background=b.bg;e.currentTarget.style.borderColor=b.border}}
                              onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=COLORS.border}}
                            >{b.label}</button>
                          ))}
                          <button className="cr-expand-btn" style={{color:COLORS.neonRed,marginLeft:'auto'}}
                            onClick={()=>askConfirm({name:c.name,onConfirm:()=>onRemove(c.id)})}
                            onMouseOver={e=>{e.currentTarget.style.background=COLORS.bgRed;e.currentTarget.style.borderColor=COLORS.borderRed}}
                            onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=COLORS.border}}
                          >Eliminar</button>
                        </div>
                        {c.txs&&c.txs.length>0 && (
                          <>
                            <p style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>Operacions</p>
                            <div className="cr-tx-list" style={{maxHeight:180,overflowY:'auto'}}>
                              {[...c.txs].reverse().map(tx=>(
                                <div key={tx.id} className="cr-tx">
                                  <div style={{width:6,height:6,borderRadius:'50%',background:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber,flexShrink:0,marginRight:10}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,0.55)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.note||(tx.type==='buy'?'Compra':'Venda')}</p>
                                    <p style={{fontSize:10,color:'rgba(255,255,255,0.25)',margin:0}}>{tx.date||'—'}</p>
                                  </div>
                                  <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                                    <p style={{fontSize:12,fontWeight:600,fontFamily:FONTS.mono,color:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber,margin:0}}>{tx.type==='buy'?'+':'−'}{fmtQty(tx.qty)}</p>
                                    <p style={{fontSize:10,color:'rgba(255,255,255,0.30)',fontFamily:FONTS.mono,marginTop:2}}>{fmtEur(tx.totalCost)}</p>
                                  </div>
                                  {onRemoveTransaction&&<button className="cr-tx-del" onClick={()=>onRemoveTransaction(c.id,tx.id)}><TrashIcon size={11}/></button>}
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
      {showNew && <NewCryptoModal onAdd={d=>{onAdd(d);setShowNew(false)}} onClose={()=>setShowNew(false)}/>}
      {txModal && <TxModal name={txModal.name} symbol={txModal.symbol} coinId={txModal.coinId} defaultType={txModal.type} onAdd={tx=>{onAddTransaction?.(txModal.cryptoId,tx);setTxModal(null)}} onClose={()=>setTxModal(null)}/>}
    </div>
  )
}

function NewCryptoModal({ onAdd, onClose }) {
  const [form, setForm] = useState({name:'',symbol:'',coinId:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <div className="cr-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cr-modal">
        <div className="cr-modal-drag"/>
        <div className="cr-modal-hdr"><h3 className="cr-modal-title">Nova criptomoneda</h3><button className="cr-modal-x" onClick={onClose}>×</button></div>
        <label className="cr-lbl" style={{marginBottom:8}}>Populars</label>
        <div className="cr-popular-grid">
          {POPULAR.map(p=>(
            <button key={p.coinId} className={`cr-pop-btn${form.coinId===p.coinId?' sel':''}`} onClick={()=>setForm({name:p.name,symbol:p.symbol,coinId:p.coinId})}>{p.symbol}</button>
          ))}
        </div>
        <div className="cr-fgroup">
          <div className="cr-grid2">
            <div><label className="cr-lbl">Nom</label><input className="cr-inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Bitcoin"/></div>
            <div><label className="cr-lbl">Símbol</label><input className="cr-inp mono" value={form.symbol} onChange={e=>set('symbol',e.target.value.toUpperCase())} placeholder="BTC"/></div>
          </div>
          <div><label className="cr-lbl">CoinGecko ID</label><input className="cr-inp mono" value={form.coinId} onChange={e=>set('coinId',e.target.value.toLowerCase())} placeholder="bitcoin"/></div>
        </div>
        <div className="cr-mfooter">
          <button className="cr-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="cr-btn-ok def" onClick={()=>{if(!form.name.trim()||!form.symbol.trim())return;onAdd({name:form.name.trim(),symbol:form.symbol,coinId:form.coinId})}}>Crear posició</button>
        </div>
      </div>
    </div>
  )
}

function TxModal({ name, symbol, coinId, defaultType, onAdd, onClose }) {
  const [type, setType]   = useState(defaultType||'buy')
  const [qty, setQty]     = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState('')
  const [note, setNote]   = useState('')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [livePrice, setLivePrice] = useState(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    if(!coinId)return
    setFetchingPrice(true)
    fetch(`/coingecko/api/v3/simple/price?ids=${coinId}&vs_currencies=eur`,{signal:AbortSignal.timeout(6000)})
      .then(r=>r.json()).then(d=>{const p=d?.[coinId]?.eur;if(p)setLivePrice(+p.toFixed(6))}).catch(()=>{}).finally(()=>setFetchingPrice(false))
  },[coinId])

  const recalc=(q,p)=>{const t=parseFloat(q)*parseFloat(p);if(!isNaN(t)&&t>0)setTotal(t.toFixed(2))}
  const handleQty=v=>{setQty(v);if(v&&price)recalc(v,price)}
  const handlePrice=v=>{setPrice(v);if(v&&qty)recalc(qty,v)}
  const fillLive=()=>{if(!livePrice)return;setPrice(livePrice.toString());if(qty)recalc(qty,livePrice)}
  const submit=()=>{
    const q=parseFloat(qty),t=parseFloat(total)
    if(!q||q<=0)return setError('La quantitat és obligatòria')
    if(!t||t<=0)return setError("L'import és obligatori")
    setError('');onAdd({qty:q,pricePerUnit:parseFloat(price)||(t/q),totalCost:t,type,note,date})
  }
  return (
    <div className="cr-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cr-modal">
        <div className="cr-modal-drag"/>
        <div className="cr-modal-hdr">
          <h3 className="cr-modal-title">{name} <span style={{fontSize:11,color:COLORS.neonAmber,fontFamily:FONTS.mono}}>{symbol}</span></h3>
          <button className="cr-modal-x" onClick={onClose}>×</button>
        </div>
        <div className="cr-type-row">
          <button className={`cr-type-tab${type==='buy'?' grn':''}`} onClick={()=>setType('buy')}>↑ Compra</button>
          <button className={`cr-type-tab${type==='sell'?' org':''}`} onClick={()=>setType('sell')}>↓ Venda</button>
        </div>
        <div className="cr-fgroup">
          <div className="cr-grid2">
            <div><label className="cr-lbl">Quantitat ({symbol})</label><input type="number" inputMode="decimal" step="any" className="cr-inp mono" value={qty} onChange={e=>handleQty(e.target.value)} placeholder="0.00000"/></div>
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <label className="cr-lbl" style={{margin:0}}>Preu/u (€)</label>
                <button onClick={fillLive} disabled={fetchingPrice||!livePrice} style={{fontSize:10,fontWeight:600,padding:'2px 8px',border:`1px solid ${COLORS.border}`,borderRadius:3,background:COLORS.elevated,color:livePrice?COLORS.neonGreen:COLORS.textMuted,fontFamily:FONTS.mono,cursor:livePrice?'pointer':'default'}}>{fetchingPrice?'...':livePrice?fmtEur(livePrice):'—'}</button>
              </div>
              <input type="number" inputMode="decimal" step="any" className="cr-inp mono" value={price} onChange={e=>handlePrice(e.target.value)} placeholder="0.00"/>
            </div>
          </div>
          <div><label className="cr-lbl">Total (€)</label><input type="number" inputMode="decimal" step="any" className="cr-inp mono" value={total} onChange={e=>setTotal(e.target.value)} placeholder="0.00"/></div>
          <div className="cr-grid2">
            <div><label className="cr-lbl">Data</label><input type="date" className="cr-inp" value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label className="cr-lbl">Nota</label><input className="cr-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="opcional"/></div>
          </div>
          {error&&<p className="cr-error">{error}</p>}
        </div>
        <div className="cr-mfooter">
          <button className="cr-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`cr-btn-ok ${type==='buy'?'grn':'org'}`} onClick={submit}>{type==='buy'?'Registrar compra':'Registrar venda'}</button>
        </div>
      </div>
    </div>
  )
}