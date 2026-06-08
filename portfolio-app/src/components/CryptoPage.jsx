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

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
  </svg>
)
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>

const styles = `
  .cr { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:0; }

  /* Hero centrat */
  .cr-hero { text-align:center; padding:28px 20px 20px; }
  .cr-hero-label { font-size:11px; font-weight:400; color:var(--c-text-muted); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:8px; }
  .cr-hero-total { font-size:44px; font-weight:600; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-numeric:tabular-nums; line-height:1; letter-spacing:0px; margin-bottom:10px; }
  .cr-hero-total span { font-size:26px; opacity:0.4; font-weight:300; }
  .cr-hero-row { display:flex; align-items:center; justify-content:center; gap:8px; }
  .cr-hero-badge { display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:500; font-family:${FONTS.mono}; }
  .cr-hero-badge.pos { color:var(--c-green); }
  .cr-hero-badge.neg { color:var(--c-red); }

  .cr-divider { height:1px; background:var(--c-border); margin:0 0 20px; }

  /* Stats fila */
  .cr-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; margin-bottom:24px; border:1px solid var(--c-border); border-radius:12px; overflow:hidden; }
  .cr-stat-cell { padding:14px 12px; text-align:center; border-right:1px solid var(--c-border); }
  .cr-stat-cell:last-child { border-right:none; }
  .cr-stat-lbl { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .cr-stat-v { font-size:14px; font-weight:600; font-family:${FONTS.mono}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; letter-spacing:-0.3px; }
  .cr-stat-v.g { color:var(--c-green); }
  .cr-stat-v.r { color:var(--c-red); }
  .cr-stat-v.a { color:${COLORS.neonAmber}; }

  .cr-actions { display:flex; gap:6px; align-items:center; margin-bottom:20px; }
  .cr-btn-ico { width:32px; height:32px; background:transparent; border:1px solid var(--c-border); border-radius:8px; color:var(--c-text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .cr-btn-ico:hover { border-color:var(--c-border-hi); color:var(--c-text-secondary); }
  .cr-btn-add { display:flex; align-items:center; gap:5px; padding:7px 14px; background:${COLORS.neonAmber}; color:#000; border:none; border-radius:8px; font-family:${FONTS.sans}; font-size:12px; font-weight:700; cursor:pointer; margin-left:auto; white-space:nowrap; }
  .cr-btn-add:hover { opacity:0.85; }

  .cr-section-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .cr-section-title { font-size:11px; font-weight:600; color:var(--c-text-secondary); text-transform:uppercase; letter-spacing:0.12em; }

  .cr-cards { display:flex; flex-direction:column; background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; overflow:hidden; margin-bottom:12px; }
  .cr-card { border-bottom:1px solid var(--c-border); cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .cr-card:last-child { border-bottom:none; }
  .cr-card-main { display:flex; align-items:center; gap:12px; padding:13px 14px; transition:background 80ms; }
  .cr-card-main:hover { background:var(--c-elevated); }

  /* Avatar circular */
  .cr-av { width:38px; height:38px; border-radius:50%; background:rgba(255,149,0,0.12); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; color:${COLORS.neonAmber}; }
  .cr-card-info { flex:1; min-width:0; }
  .cr-card-name { font-size:14px; font-weight:500; color:var(--c-text-primary); margin-bottom:2px; }
  .cr-card-meta { display:flex; align-items:center; gap:6px; }
  .cr-sym-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:1px 6px; border-radius:3px; background:rgba(255,149,0,0.12); color:${COLORS.neonAmber}; }
  .cr-card-price { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .cr-card-right { text-align:right; flex-shrink:0; }
  .cr-card-val { font-size:14px; font-weight:500; font-family:${FONTS.mono}; color:var(--c-text-primary); font-variant-numeric:tabular-nums; margin-bottom:2px; }
  .cr-card-pct { font-size:11px; font-family:${FONTS.mono}; font-weight:600; }
  .cr-card-pct.pos { color:var(--c-green); }
  .cr-card-pct.neg { color:var(--c-red); }
  .cr-card-chevron { color:var(--c-text-disabled); margin-left:6px; flex-shrink:0; transition:transform 200ms; }
  .cr-card-chevron.open { transform:rotate(180deg); }

  .cr-expand { border-top:1px solid var(--c-border); background:var(--c-elevated); }
  .cr-expand-inner { padding:16px 14px; }
  .cr-expand-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0; padding:12px 0; border-bottom:1px solid var(--c-border); margin-bottom:14px; }
  .cr-expand-stat { position:relative; padding-right:12px; }
  .cr-expand-stat:not(:last-child)::after { content:''; position:absolute; right:6px; top:2px; height:calc(100% - 4px); width:1px; background:var(--c-surface); }
  .cr-expand-stat-l { font-size:9px; font-weight:500; color:var(--c-text-muted); margin-bottom:5px; text-transform:uppercase; letter-spacing:0.10em; }
  .cr-expand-stat-v { font-size:13px; font-family:${FONTS.mono}; color:var(--c-text-primary); font-weight:500; font-variant-numeric:tabular-nums; }
  .cr-expand-stat-v.pos { color:var(--c-green); }
  .cr-expand-stat-v.neg { color:var(--c-red); }

  .cr-expand-btns { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
  .cr-expand-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; background:transparent; border:1px solid var(--c-border); border-radius:8px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; white-space:nowrap; }

  .cr-tx-list { display:flex; flex-direction:column; }
  .cr-tx { display:flex; align-items:center; padding:8px 0; border-bottom:1px solid var(--c-border); }
  .cr-tx:last-child { border-bottom:none; }
  .cr-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:var(--c-text-disabled); margin-left:8px; transition:all 80ms; }
  .cr-tx-del:hover { color:var(--c-red); background:var(--c-bg-red); }

  .cr-empty { padding:48px 0; text-align:center; }
  .cr-empty-main { font-size:14px; color:var(--c-text-muted); font-weight:500; margin-bottom:4px; }
  .cr-empty-sub { font-size:12px; color:var(--c-text-disabled); }

  .cr-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.82); display:flex; align-items:center; justify-content:center; padding:16px; z-index:50; backdrop-filter:blur(8px); animation:crFadeIn 150ms ease; }
  @keyframes crFadeIn { from{opacity:0} to{opacity:1} }
  .cr-modal { background:var(--c-bg); border:1px solid var(--c-border); border-radius:14px; width:100%; max-width:420px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90dvh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,0.35); animation:crScaleIn 200ms cubic-bezier(0.32,1.1,0.60,1); }
  @keyframes crScaleIn { from{transform:scale(0.95) translateY(6px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
  .cr-modal-drag { display:none; }
  .cr-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .cr-modal-title { font-size:15px; font-weight:600; color:var(--c-text-primary); }
  .cr-modal-x { width:26px; height:26px; border-radius:6px; background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-secondary); font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .cr-lbl { display:block; font-size:10px; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .cr-inp { width:100%; background:var(--c-elevated); border:1px solid var(--c-border); border-radius:8px; padding:10px 12px; font-family:${FONTS.sans}; font-size:16px; color:var(--c-text-primary); outline:none; box-sizing:border-box; transition:border-color 120ms; -webkit-appearance:none; }
  .cr-inp:focus { border-color:${COLORS.neonAmber}; }
  .cr-inp::placeholder { color:var(--c-text-disabled); }
  .cr-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .cr-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }
  .cr-fgroup { display:flex; flex-direction:column; gap:14px; }
  .cr-mfooter { display:flex; gap:8px; margin-top:20px; }
  .cr-btn-cancel { flex:1; padding:11px; border:1px solid var(--c-border); background:transparent; border-radius:8px; font-family:${FONTS.sans}; font-size:13px; color:var(--c-text-secondary); cursor:pointer; }
  .cr-btn-ok { flex:1; padding:11px; border:none; border-radius:8px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; }
  .cr-btn-ok.grn { background:var(--c-green); color:#000; }
  .cr-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .cr-btn-ok.def { background:var(--c-text-primary); color:var(--c-bg); }
  .cr-error { font-size:12px; color:var(--c-red); background:var(--c-bg-red); border:1px solid var(--c-border-red); border-radius:8px; padding:9px 12px; }
  .cr-type-row { display:flex; gap:1px; background:var(--c-border); border-radius:8px; overflow:hidden; margin-bottom:16px; }
  .cr-type-tab { flex:1; padding:9px; border:none; background:var(--c-surface); font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; color:var(--c-text-muted); transition:all 100ms; }
  .cr-type-tab.grn { background:var(--c-bg-green); color:var(--c-green); }
  .cr-type-tab.org { background:var(--c-bg-amber); color:${COLORS.neonAmber}; }
  .cr-popular-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:14px; }
  .cr-pop-btn { padding:8px 4px; border-radius:8px; cursor:pointer; text-align:center; font-family:${FONTS.mono}; font-size:11px; font-weight:700; transition:all 100ms; background:var(--c-elevated); border:1px solid var(--c-border); color:var(--c-text-secondary); }
  .cr-pop-btn:hover { border-color:var(--c-border-hi); color:var(--c-text-primary); }
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

      <div className="cr-hero">
        <p className="cr-hero-label">Cartera crypto</p>
        <p className="cr-hero-total">{fmtEur(totalValue).replace('€','')}<span>€</span></p>
        <div className="cr-hero-row">
          {totalCost>0 && (
            <p className={`cr-hero-badge ${isPos?'pos':'neg'}`}>
              {isPos?'▲':'▼'} {isPos?'+':''}{fmtEur(totalGain)}
              <span style={{opacity:0.6,fontWeight:400}}>&nbsp;({isPos?'+':''}{Math.abs(gainPct).toFixed(2)}%)</span>
            </p>
          )}
        </div>
      </div>

      <div className="cr-divider"/>

      {cryptos.length>0 && (
        <div className="cr-stats">
          <div className="cr-stat-cell">
            <p className="cr-stat-lbl">Invertit</p>
            <p className="cr-stat-v">{fmtEur(totalCost)}</p>
          </div>
          <div className="cr-stat-cell">
            <p className="cr-stat-lbl">P&G</p>
            <p className={`cr-stat-v ${isPos?'g':'r'}`}>{isPos?'+':''}{fmtEur(totalGain)}</p>
          </div>
          <div className="cr-stat-cell">
            <p className="cr-stat-lbl">Actius</p>
            <p className="cr-stat-v a">{cryptos.length}</p>
          </div>
        </div>
      )}

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
                        <div className="cr-expand-stats">
                          {[
                            {l:'Cost mitjà', v:qty>0&&c.avgCost?fmtEur(c.avgCost)+'/u.':'—'},
                            {l:'Quantitat',  v:fmtQty(qty)},
                            {l:'Invertit',   v:fmtEur(cost)},
                            {l:'P&G',        v:(pos?'+':'')+fmtEur(gain), cls:pos?'pos':'neg'},
                          ].map((s,i)=>(
                            <div key={i} className="cr-expand-stat">
                              <p className="cr-expand-stat-l">{s.l}</p>
                              <p className={`cr-expand-stat-v${s.cls?' '+s.cls:''}`}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="cr-expand-btns">
                          {[
                            {label:'Comprar',color:COLORS.neonGreen,bg:'var(--c-bg-green)',border:'var(--c-border-green)',type:'buy'},
                            {label:'Vendre', color:COLORS.neonAmber,bg:'var(--c-bg-amber)',border:'var(--c-border-amber)',type:'sell'},
                          ].map(b=>(
                            <button key={b.type} className="cr-expand-btn" style={{color:b.color}}
                              onClick={()=>setTxModal({cryptoId:c.id,name:c.name,symbol:c.symbol,coinId:c.coinId,type:b.type})}
                              onMouseOver={e=>{e.currentTarget.style.background=b.bg;e.currentTarget.style.borderColor=b.border}}
                              onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--c-border)'}}
                            >{b.label}</button>
                          ))}
                          <button className="cr-expand-btn" style={{color:'var(--c-red)',marginLeft:'auto'}}
                            onClick={()=>askConfirm({name:c.name,onConfirm:()=>onRemove(c.id)})}
                            onMouseOver={e=>{e.currentTarget.style.background='var(--c-bg-red)';e.currentTarget.style.borderColor='var(--c-border-red)'}}
                            onMouseOut={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--c-border)'}}
                          >Eliminar</button>
                        </div>
                        {c.txs&&c.txs.length>0 && (
                          <>
                            <p style={{fontSize:9,fontWeight:500,color:'var(--c-text-muted)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>Operacions</p>
                            <div className="cr-tx-list" style={{maxHeight:180,overflowY:'auto'}}>
                              {[...c.txs].reverse().map(tx=>(
                                <div key={tx.id} className="cr-tx">
                                  <div style={{width:6,height:6,borderRadius:'50%',background:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber,flexShrink:0,marginRight:10}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <p style={{fontSize:12,fontWeight:500,color:'var(--c-text-secondary)',margin:'0 0 2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.note||(tx.type==='buy'?'Compra':'Venda')}</p>
                                    <p style={{fontSize:10,color:'var(--c-text-muted)',margin:0}}>{tx.date||'—'}</p>
                                  </div>
                                  <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                                    <p style={{fontSize:12,fontWeight:600,fontFamily:FONTS.mono,color:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber,margin:0}}>{tx.type==='buy'?'+':'−'}{fmtQty(tx.qty)}</p>
                                    <p style={{fontSize:10,color:'var(--c-text-muted)',fontFamily:FONTS.mono,marginTop:2}}>{fmtEur(tx.totalCost)}</p>
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
                <button onClick={fillLive} disabled={fetchingPrice||!livePrice} style={{fontSize:10,fontWeight:600,padding:'2px 8px',border:`1px solid var(--c-border)`,borderRadius:4,background:'var(--c-elevated)',color:livePrice?COLORS.neonGreen:'var(--c-text-muted)',fontFamily:FONTS.mono,cursor:livePrice?'pointer':'default'}}>{fetchingPrice?'...':livePrice?fmtEur(livePrice):'—'}</button>
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