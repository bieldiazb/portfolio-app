import { useState, useMemo, useEffect } from 'react'
import { fmtEur } from '../utils/format'
import { useConfirmDelete, ConfirmDialog } from '../hooks/useConfirmDelete.jsx'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

// ── Matèries primeres populars ─────────────────────────────────────────────
const POPULAR = [
  { name:'Or',      symbol:'XAU', ticker:'GC=F',   unit:'oz',  unitLabel:'Unça troy' },
  { name:'Plata',   symbol:'XAG', ticker:'SI=F',   unit:'oz',  unitLabel:'Unça troy' },
  { name:'Platí',   symbol:'XPT', ticker:'PL=F',   unit:'oz',  unitLabel:'Unça troy' },
  { name:'Petroli', symbol:'OIL', ticker:'CL=F',   unit:'bbl', unitLabel:'Barril'    },
  { name:'Gas nat.', symbol:'GAS', ticker:'NG=F',  unit:'MMBtu',unitLabel:'MMBtu'    },
  { name:'Coure',   symbol:'CU',  ticker:'HG=F',   unit:'lb',  unitLabel:'Lliura'    },
  { name:'Blat',    symbol:'WHT', ticker:'ZW=F',   unit:'bu',  unitLabel:'Bushel'    },
  { name:'Blat de moro', symbol:'CRN', ticker:'ZC=F', unit:'bu', unitLabel:'Bushel' },
]

// Color únic per commodities — groc/daurat
const COM_COLOR = { bg: COLORS.bgAmber, color: '#c8961a', border: COLORS.borderAmber }

function fmtQty(n, unit) {
  if (!n) return `0 ${unit}`
  const fmt = parseFloat(n.toFixed(4)).toString()
  return `${fmt} ${unit}`
}

function currentValue(c) {
  const qty = c.totalQty ?? c.qty ?? 0
  if (c.currentPrice != null && qty > 0) return qty * c.currentPrice
  return c.totalCost || 0
}

const PriceTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:COLORS.elevated, border:`1px solid ${COLORS.borderMid}`, borderRadius:5, padding:'5px 9px', fontFamily:FONTS.mono, fontSize:11, color:COLORS.textPrimary }}>
      ${payload[0]?.value?.toFixed(2)}
    </div>
  )
}

const TrashIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const styles = `
  .cm { font-family:${FONTS.sans}; }

  .cm-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; }
  .cm-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .cm-sub-row { display:flex; align-items:center; gap:8px; }
  .cm-sub-val { font-size:13px; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; font-variant-numeric:tabular-nums; }
  .cm-pg-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; font-family:${FONTS.mono}; padding:2px 8px; border-radius:3px; }
  .cm-pg-badge.pos { color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; }
  .cm-pg-badge.neg { color:${COLORS.neonRed};   background:${COLORS.bgRed};   border:1px solid ${COLORS.borderRed};   }

  .cm-hdr-btns { display:flex; gap:6px; align-items:center; flex-shrink:0; }
  .cm-btn-ico { width:28px; height:28px; background:transparent; border:1px solid ${COLORS.border}; border-radius:4px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; flex-shrink:0; }
  .cm-btn-ico:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .cm-btn-add { display:flex; align-items:center; gap:5px; padding:6px 12px; background:${COLORS.neonPurple}; color:#fff; border:none; border-radius:4px; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:opacity 100ms; white-space:nowrap; }
  .cm-btn-add:hover { opacity:0.85; }

  .cm-desktop { display:block; }
  .cm-mobile  { display:none; flex-direction:column; }
  @media (max-width:700px) { .cm-desktop { display:none; } .cm-mobile { display:flex; } }

  .cm-table { width:100%; border-collapse:collapse; font-size:13px; }
  .cm-thead th { padding:8px 12px 10px; font-size:10px; font-weight:500; color:${COLORS.textMuted}; letter-spacing:0.10em; text-transform:uppercase; border-bottom:1px solid ${COLORS.border}; white-space:nowrap; }
  .cm-thead th:first-child { padding-left:0; text-align:left; }
  .cm-thead th:last-child { padding-right:0; }
  .cm-thead th:not(:first-child) { text-align:right; }

  .cm-row { border-bottom:1px solid ${COLORS.border}; cursor:pointer; transition:background 80ms; }
  .cm-row:last-child { border-bottom:none; }
  .cm-row:hover { background:${COLORS.elevated}; }
  .cm-row td { padding:12px; vertical-align:middle; }
  .cm-row td:first-child { padding-left:0; }
  .cm-row td:last-child { padding-right:0; }

  .cm-asset { display:flex; align-items:center; gap:10px; }
  .cm-av { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; background:${COM_COLOR.bg}; color:${COM_COLOR.color}; }
  .cm-name { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; margin-bottom:2px; }
  .cm-sym-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:1px 6px; border-radius:2px; background:${COM_COLOR.bg}; color:${COM_COLOR.color}; text-transform:uppercase; letter-spacing:0.04em; }
  .cm-unit-lbl { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }

  .cm-num { text-align:right; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; font-size:12px; font-variant-numeric:tabular-nums; }
  .cm-val { text-align:right; font-family:${FONTS.mono}; font-weight:500; color:${COLORS.textPrimary}; font-size:13px; font-variant-numeric:tabular-nums; }
  .cm-pg  { text-align:right; font-family:${FONTS.mono}; font-size:12px; font-variant-numeric:tabular-nums; }
  .cm-pg.pos { color:${COLORS.neonGreen}; }
  .cm-pg.neg { color:${COLORS.neonRed}; }
  .cm-pct { text-align:right; font-size:11px; font-weight:500; font-family:${FONTS.mono}; }
  .cm-pct.pos { color:${COLORS.neonGreen}; }
  .cm-pct.neg { color:${COLORS.neonRed}; }
  .cm-pct.neu { color:${COLORS.textMuted}; }
  .cm-more-btn { background:transparent; border:none; color:${COLORS.textMuted}; cursor:pointer; font-size:16px; line-height:1; padding:0 2px; letter-spacing:2px; transition:color 100ms; }
  .cm-more-btn:hover { color:${COLORS.textPrimary}; }

  .cm-expanded-row > td { padding:0 !important; border-bottom:1px solid ${COLORS.border}; }

  /* Mobile */
  .cm-mcard { display:flex; align-items:center; padding:12px 0; border-bottom:1px solid ${COLORS.border}; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .cm-mcard:last-child { border-bottom:none; }

  /* Stats */
  .cm-stats { display:grid; grid-template-columns:repeat(4,1fr); padding:14px 0; border-top:1px solid ${COLORS.border}; border-bottom:1px solid ${COLORS.border}; margin-bottom:14px; }
  .cm-stat { position:relative; padding-right:16px; }
  .cm-stat:not(:last-child)::after { content:''; position:absolute; right:8px; top:0; height:100%; width:1px; background:${COLORS.border}; }
  .cm-stat-l { font-size:10px; font-weight:500; color:${COLORS.textMuted}; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.10em; }
  .cm-stat-v { font-size:13px; font-family:${FONTS.mono}; color:${COLORS.textPrimary}; letter-spacing:-0.3px; font-weight:500; font-variant-numeric:tabular-nums; }
  .cm-stat-v.pos { color:${COLORS.neonGreen}; }
  .cm-stat-v.neg { color:${COLORS.neonRed}; }

  .cm-tx { display:flex; align-items:center; padding:9px 0; border-bottom:1px solid ${COLORS.border}; }
  .cm-tx:last-child { border-bottom:none; }
  .cm-tx-del { width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:none; background:transparent; border-radius:3px; cursor:pointer; color:${COLORS.textMuted}; margin-left:8px; flex-shrink:0; transition:all 80ms; }
  .cm-tx-del:hover { color:${COLORS.neonRed}; background:${COLORS.bgRed}; }

  .cm-empty { padding:56px 0; text-align:center; }
  .cm-empty-main { font-size:14px; color:${COLORS.textMuted}; font-weight:500; margin-bottom:4px; }
  .cm-empty-sub { font-size:12px; color:${COLORS.textMuted}; opacity:0.5; }

  /* Modal */
  .cm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
  .cm-modal { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px; width:100%; max-width:420px; padding:24px 20px; font-family:${FONTS.sans}; max-height:90vh; overflow-y:auto; }
  .cm-modal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .cm-modal-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .cm-modal-x { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .cm-lbl { display:block; font-size:10px; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:6px; font-weight:500; }
  .cm-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; box-sizing:border-box; transition:border-color 120ms; }
  .cm-inp:focus { border-color:${COLORS.neonPurple}; }
  .cm-inp::placeholder { color:${COLORS.textMuted}; }
  .cm-inp.mono { font-family:${FONTS.mono}; text-align:right; }
  .cm-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }
  .cm-fgroup { display:flex; flex-direction:column; gap:14px; }
  .cm-mfooter { display:flex; gap:8px; margin-top:20px; }
  .cm-btn-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .cm-btn-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .cm-btn-ok { flex:1; padding:11px; border:none; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 100ms; }
  .cm-btn-ok.def { background:#fff; color:#000; }
  .cm-btn-ok.grn { background:${COLORS.neonGreen}; color:#000; }
  .cm-btn-ok.org { background:${COLORS.neonAmber}; color:#000; }
  .cm-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; }

  .cm-type-row { display:flex; gap:1px; background:${COLORS.border}; border-radius:5px; overflow:hidden; margin-bottom:16px; }
  .cm-type-tab { flex:1; padding:9px; border:none; background:${COLORS.surface}; font-family:${FONTS.sans}; font-size:12px; font-weight:500; cursor:pointer; transition:all 100ms; color:${COLORS.textMuted}; }
  .cm-type-tab:hover { color:${COLORS.textPrimary}; background:${COLORS.elevated}; }
  .cm-type-tab.grn { background:${COLORS.bgGreen}; color:${COLORS.neonGreen}; border-bottom:1px solid ${COLORS.borderGreen}; }
  .cm-type-tab.org { background:${COLORS.bgAmber}; color:${COLORS.neonAmber}; border-bottom:1px solid ${COLORS.borderAmber}; }

  .cm-popular-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:5px; margin-bottom:14px; }
  .cm-pop-btn { padding:7px 4px; border-radius:4px; cursor:pointer; text-align:center; font-family:${FONTS.mono}; font-size:10px; font-weight:600; transition:all 100ms; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textMuted}; }
  .cm-pop-btn:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .cm-pop-btn.sel { background:${COM_COLOR.bg}; border-color:${COM_COLOR.border}; color:${COM_COLOR.color}; }
`

function ExpandedPanel({ c, onOpenTx, onRemoveTx, onRemove }) {
  const qty    = c.totalQty ?? c.qty ?? 0
  const curVal = currentValue(c)
  const cost   = c.totalCost || 0
  const gain   = curVal - cost
  const isPos  = gain >= 0

  const chartData = useMemo(() => {
    const pts = (c.txs||[]).filter(t=>t.type==='buy'&&t.pricePerUnit>0).map((t,i)=>({i,price:t.pricePerUnit}))
    if (c.currentPrice!=null) pts.push({i:pts.length,price:c.currentPrice})
    return pts
  }, [c.txs, c.currentPrice])

  const btns = [
    { label:'Comprar', color:COLORS.neonGreen, bg:COLORS.bgGreen, border:COLORS.borderGreen, type:'buy'  },
    { label:'Vendre',  color:COLORS.neonAmber, bg:COLORS.bgAmber, border:COLORS.borderAmber, type:'sell' },
    { label:'Eliminar',color:COLORS.neonRed,   bg:COLORS.bgRed,   border:COLORS.borderRed,   type:'del', ml:'auto' },
  ]

  return (
    <div style={{ background:COLORS.elevated, borderTop:`1px solid ${COLORS.border}`, padding:'16px 5px', fontFamily:FONTS.sans }}>
      {chartData.length>=2 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, textTransform:'uppercase', letterSpacing:'0.10em' }}>Evolució del preu</span>
            {c.currentPrice!=null && <span style={{ fontSize:11, fontFamily:FONTS.mono, color:isPos?COLORS.neonGreen:COLORS.neonRed }}>${c.currentPrice.toFixed(2)}/{c.unit}</span>}
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={chartData} margin={{top:2,right:0,left:0,bottom:0}}>
              <defs>
                <linearGradient id={`cg${c.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPos?'rgba(0,255,136,0.15)':'rgba(255,59,59,0.12)'}/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="price" stroke={isPos?COLORS.neonGreen:COLORS.neonRed} strokeWidth={1.5} fill={`url(#cg${c.id})`} dot={false}/>
              <Tooltip content={<PriceTip/>} cursor={{stroke:COLORS.border,strokeWidth:1}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="cm-stats">
        {[
          { l:'Preu mig', v: qty>0&&c.avgCost?`$${c.avgCost.toFixed(2)}/${c.unit}`:'—' },
          { l:'Quantitat', v: fmtQty(qty, c.unit) },
          { l:'Invertit',  v: fmtEur(cost) },
          { l:'P&G',       v: (isPos?'+':'')+fmtEur(gain), cls:isPos?'pos':'neg' },
        ].map((s,i) => (
          <div key={i} className="cm-stat">
            <p className="cm-stat-l">{s.l}</p>
            <p className={`cm-stat-v${s.cls?' '+s.cls:''}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {btns.map(b => (
          <button key={b.type} onClick={()=>b.type==='del'?onRemove():onOpenTx(b.type)}
            style={{ marginLeft:b.ml||0, display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', border:`1px solid ${COLORS.border}`, borderRadius:4, fontFamily:FONTS.sans, fontSize:12, fontWeight:500, cursor:'pointer', color:b.color, whiteSpace:'nowrap', transition:'all 100ms' }}
            onMouseOver={e=>{ e.currentTarget.style.background=b.bg; e.currentTarget.style.borderColor=b.border }}
            onMouseOut={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor=COLORS.border }}
          >{b.label}</button>
        ))}
      </div>

      <p style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, textTransform:'uppercase', letterSpacing:'0.10em', margin:'0 0 8px' }}>Operacions</p>
      <div style={{ maxHeight:200, overflowY:'auto' }}>
        {(!c.txs||c.txs.length===0) ? (
          <p style={{ textAlign:'center', fontSize:12, color:COLORS.textMuted, padding:'12px 0' }}>Cap operació registrada</p>
        ) : [...c.txs].reverse().map(tx => (
          <div key={tx.id} className="cm-tx">
            <div style={{ width:6, height:6, borderRadius:'50%', background:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber, flexShrink:0, marginRight:10 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:500, color:COLORS.textSecondary, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {tx.note||(tx.type==='buy'?'Compra':'Venda')}
              </p>
              <p style={{ fontSize:10, color:COLORS.textMuted, margin:0 }}>{tx.date||'—'}</p>
            </div>
            <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
              <p style={{ fontSize:12, fontWeight:600, fontFamily:FONTS.mono, color:tx.type==='buy'?COLORS.neonGreen:COLORS.neonAmber, margin:0 }}>
                {tx.type==='buy'?'+':'−'}{parseFloat(tx.qty).toFixed(4)} {c.unit}
              </p>
              <p style={{ fontSize:10, color:COLORS.textMuted, fontFamily:FONTS.mono, marginTop:2 }}>
                {fmtEur(tx.totalCostEur||tx.totalCost)}
              </p>
            </div>
            {onRemoveTx && <button className="cm-tx-del" onClick={()=>onRemoveTx(tx.id)}><TrashIcon size={11}/></button>}
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const sorted     = [...commodities].sort((a,b)=>sortDir==='desc'?currentValue(b)-currentValue(a):currentValue(a)-currentValue(b))
  const toggle     = id => setExpanded(e=>({...e,[id]:!e[id]}))

  return (
    <div className="cm">
      <style>{`${SHARED_STYLES}${styles}`}</style>
      <ConfirmDialog state={confirmState} onClose={closeConfirm}/>

      <div className="cm-hdr">
        <div>
          <h2 className="cm-title">Matèries primeres</h2>
          <div className="cm-sub-row">
            <span className="cm-sub-val">{fmtEur(totalValue)}</span>
            {totalCost>0 && <span className={`cm-pg-badge ${isPos?'pos':'neg'}`}>{isPos?'▲':'▼'} {Math.abs(gainPct).toFixed(2)}%</span>}
          </div>
        </div>
        <div className="cm-hdr-btns">
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
      </div>

      {commodities.length===0 ? (
        <div className="cm-empty">
          <p className="cm-empty-main">Cap matèria primera registrada</p>
          <p className="cm-empty-sub">Afegeix or, plata, petroli o altres commodities</p>
        </div>
      ) : (<>
        {/* Desktop */}
        <div className="cm-desktop">
          <table className="cm-table">
            <thead className="cm-thead">
              <tr><th>Actiu</th><th>Quantitat</th><th>Preu actual</th><th>Valor</th><th>P&amp;G</th><th>P&amp;G %</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const qty    = c.totalQty??c.qty??0
                const curVal = currentValue(c)
                const cost   = c.totalCost||0
                const gain   = curVal-cost
                const gPct   = cost>0?(gain/cost)*100:0
                const pos    = gain>=0
                return (<>
                  <tr key={c.id} className="cm-row" onClick={()=>toggle(c.id)}>
                    <td>
                      <div className="cm-asset">
                        <div className="cm-av">{c.symbol?.slice(0,3)||c.name?.slice(0,2).toUpperCase()}</div>
                        <div>
                          <p className="cm-name">{c.name}</p>
                          <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                            <span className="cm-sym-badge">{c.symbol}</span>
                            <span className="cm-unit-lbl">{c.unitLabel||c.unit}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="cm-num">{qty>0?fmtQty(qty,c.unit):'—'}</td>
                    <td className="cm-num">{c.currentPrice!=null?`$${c.currentPrice.toFixed(2)}`:'—'}</td>
                    <td className="cm-val">{fmtEur(curVal)}</td>
                    <td className={`cm-pg ${pos?'pos':'neg'}`} onClick={e=>e.stopPropagation()}>{pos?'+':''}{fmtEur(gain)}</td>
                    <td className={`cm-pct ${pos?'pos':gPct===0?'neu':'neg'}`} onClick={e=>e.stopPropagation()}>{pos?'▲':gPct<0?'▼':''} {Math.abs(gPct).toFixed(2)}%</td>
                    <td style={{textAlign:'right'}} onClick={e=>e.stopPropagation()}><button className="cm-more-btn">···</button></td>
                  </tr>
                  {expanded[c.id] && (
                    <tr key={c.id+'_exp'} className="cm-expanded-row">
                      <td colSpan={7}>
                        <ExpandedPanel c={c} onOpenTx={type=>setTxModal({id:c.id,name:c.name,symbol:c.symbol,unit:c.unit,ticker:c.ticker,type})} onRemoveTx={txId=>onRemoveTransaction?.(c.id,txId)} onRemove={()=>askConfirm({name:c.name,onConfirm:()=>onRemove(c.id)})}/>
                      </td>
                    </tr>
                  )}
                </>)
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="cm-mobile">
          {sorted.map(c => {
            const curVal = currentValue(c)
            const cost   = c.totalCost||0
            const gain   = curVal-cost
            const gPct   = cost>0?(gain/cost)*100:0
            const pos    = gain>=0
            return (
              <div key={c.id}>
                <div className="cm-mcard" onClick={()=>toggle(c.id)}>
                  <div className="cm-av" style={{marginRight:12}}>{c.symbol?.slice(0,3)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p className="cm-name" style={{marginBottom:2}}>{c.name}</p>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <span className="cm-sym-badge">{c.symbol}</span>
                      {c.currentPrice!=null && <span style={{fontSize:10,color:COLORS.textMuted,fontFamily:FONTS.mono}}>${c.currentPrice.toFixed(2)}/{c.unit}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                    <p style={{fontSize:13,fontWeight:500,fontFamily:FONTS.mono,color:COLORS.textPrimary,fontVariantNumeric:'tabular-nums',marginBottom:2}}>{fmtEur(curVal)}</p>
                    <p style={{fontSize:11,fontFamily:FONTS.mono,color:pos?COLORS.neonGreen:COLORS.neonRed,fontWeight:500}}>{pos?'▲':'▼'} {Math.abs(gPct).toFixed(2)}%</p>
                  </div>
                  <svg style={{color:COLORS.textMuted,marginLeft:10,flexShrink:0,transition:'transform 200ms',transform:expanded[c.id]?'rotate(180deg)':'none'}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {expanded[c.id] && <ExpandedPanel c={c} onOpenTx={type=>setTxModal({id:c.id,name:c.name,symbol:c.symbol,unit:c.unit,ticker:c.ticker,type})} onRemoveTx={txId=>onRemoveTransaction?.(c.id,txId)} onRemove={()=>askConfirm({name:c.name,onConfirm:()=>onRemove(c.id)})}/>}
              </div>
            )
          })}
        </div>
      </>)}

      {showNew && <NewCommodityModal onAdd={d=>{onAdd(d);setShowNew(false)}} onClose={()=>setShowNew(false)}/>}
      {txModal && <TxModal item={txModal} onAdd={tx=>{onAddTransaction?.(txModal.id,tx);setTxModal(null)}} onClose={()=>setTxModal(null)}/>}
    </div>
  )
}

function NewCommodityModal({ onAdd, onClose }) {
  const [form, setForm] = useState({name:'',symbol:'',ticker:'',unit:'oz',unitLabel:'Unça troy'})
  const [error, setError] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const selectPopular = p => setForm({name:p.name,symbol:p.symbol,ticker:p.ticker,unit:p.unit,unitLabel:p.unitLabel})

  const submit = () => {
    if (!form.name.trim()) return setError('El nom és obligatori')
    if (!form.ticker.trim()) return setError('El ticker de Yahoo és obligatori')
    setError('')
    onAdd({name:form.name.trim(),symbol:form.symbol.toUpperCase(),ticker:form.ticker.trim(),unit:form.unit,unitLabel:form.unitLabel})
  }

  return (
    <div className="cm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cm-modal">
        <div className="cm-modal-hdr"><h3 className="cm-modal-title">Nova matèria primera</h3><button className="cm-modal-x" onClick={onClose}>×</button></div>
        <div style={{marginBottom:14}}>
          <label className="cm-lbl" style={{marginBottom:8}}>Populars</label>
          <div className="cm-popular-grid">
            {POPULAR.map(p=>(
              <button key={p.ticker} className={`cm-pop-btn${form.ticker===p.ticker?' sel':''}`} onClick={()=>selectPopular(p)}>{p.symbol}</button>
            ))}
          </div>
        </div>
        <div className="cm-fgroup">
          <div className="cm-grid2">
            <div><label className="cm-lbl">Nom</label><input className="cm-inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Or" autoFocus/></div>
            <div><label className="cm-lbl">Símbol</label><input className="cm-inp mono" value={form.symbol} onChange={e=>set('symbol',e.target.value.toUpperCase())} placeholder="XAU"/></div>
          </div>
          <div><label className="cm-lbl">Ticker Yahoo Finance</label><input className="cm-inp mono" value={form.ticker} onChange={e=>set('ticker',e.target.value)} placeholder="GC=F"/></div>
          <div className="cm-grid2">
            <div><label className="cm-lbl">Unitat</label><input className="cm-inp mono" value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="oz"/></div>
            <div><label className="cm-lbl">Nom unitat</label><input className="cm-inp" value={form.unitLabel} onChange={e=>set('unitLabel',e.target.value)} placeholder="Unça troy"/></div>
          </div>
          {error && <p className="cm-error">{error}</p>}
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
  const [type, setType]   = useState(item.type||'buy')
  const [qty, setQty]     = useState('')
  const [price, setPrice] = useState('')  // USD per unitat
  const [total, setTotal] = useState('')  // USD
  const [fxRate, setFxRate] = useState(null) // USD→EUR
  const [note, setNote]   = useState('')
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [livePrice, setLivePrice] = useState(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [error, setError] = useState('')

  // Fetch preu live + taxa USD→EUR
  useEffect(() => {
    if (!item.ticker) return
    setFetchingPrice(true)
    Promise.all([
      fetch(`/yahoo/v8/finance/chart/${item.ticker}?interval=1d&range=1d`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).catch(()=>null),
      fetch(`/yahoo/v8/finance/chart/USDEUR=X?interval=1d&range=1d`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).catch(()=>null),
    ]).then(([d1,d2]) => {
      const p = d1?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (p>0) setLivePrice(+p.toFixed(4))
      const fx = d2?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (fx>0) setFxRate(+fx.toFixed(6))
      setFetchingPrice(false)
    })
  }, [item.ticker])

  const recalc = (q,p) => { const t=parseFloat(q)*parseFloat(p); if(!isNaN(t)&&t>0) setTotal(t.toFixed(2)) }
  const handleQty   = v => { setQty(v);   if(v&&price) recalc(v,price) }
  const handlePrice = v => { setPrice(v); if(v&&qty)   recalc(qty,v) }
  const fillLive = () => { if(!livePrice)return; setPrice(livePrice.toString()); if(qty)recalc(qty,livePrice) }

  const totalUsd = parseFloat(total)||0
  const totalEur = fxRate ? +(totalUsd*fxRate).toFixed(2) : totalUsd
  const priceUsd = parseFloat(price)||0
  const priceEur = fxRate ? +(priceUsd*fxRate).toFixed(4) : priceUsd

  const submit = () => {
    const q=parseFloat(qty), t=parseFloat(total)
    if (!q||q<=0) return setError('La quantitat és obligatòria')
    if (!t||t<=0) return setError("L'import és obligatori")
    setError('')
    onAdd({
      qty:q,
      pricePerUnit:priceUsd,
      pricePerUnitEur:priceEur,
      totalCost:totalUsd,
      totalCostEur:totalEur,
      type, note, date,
    })
  }

  return (
    <div className="cm-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="cm-modal">
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
            <div>
              <label className="cm-lbl">Quantitat ({item.unit})</label>
              <input type="number" inputMode="decimal" step="any" className="cm-inp mono" autoFocus value={qty} onChange={e=>handleQty(e.target.value)} placeholder="0.000"/>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <label className="cm-lbl" style={{margin:0}}>Preu/u (USD)</label>
                <button onClick={fillLive} disabled={fetchingPrice||!livePrice} style={{fontSize:10,fontWeight:600,padding:'2px 8px',border:`1px solid ${COLORS.border}`,borderRadius:3,background:COLORS.elevated,color:livePrice?COLORS.neonGreen:COLORS.textMuted,fontFamily:FONTS.mono,cursor:livePrice?'pointer':'default',transition:'all 100ms'}}>
                  {fetchingPrice?'...':livePrice?`$${livePrice}`:'—'}
                </button>
              </div>
              <input type="number" inputMode="decimal" step="any" className="cm-inp mono" value={price} onChange={e=>handlePrice(e.target.value)} placeholder="0.00"/>
            </div>
          </div>
          <div>
            <label className="cm-lbl">Total (USD)</label>
            <input type="number" inputMode="decimal" step="any" className="cm-inp mono" value={total} onChange={e=>setTotal(e.target.value)} placeholder="0.00"/>
            {totalUsd>0 && fxRate && (
              <p style={{fontSize:10,color:COLORS.textMuted,fontFamily:FONTS.mono,marginTop:4,textAlign:'right'}}>
                ≈ <span style={{color:COLORS.textSecondary}}>{fmtEur(totalEur)}</span>
                <span style={{opacity:0.5}}> · 1 USD = {fxRate.toFixed(4)} €</span>
              </p>
            )}
          </div>
          <div className="cm-grid2">
            <div><label className="cm-lbl">Data</label><input type="date" className="cm-inp" value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label className="cm-lbl">Nota</label><input className="cm-inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="opcional"/></div>
          </div>
          {error && <p className="cm-error">{error}</p>}
        </div>
        <div className="cm-mfooter">
          <button className="cm-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className={`cm-btn-ok ${type==='buy'?'grn':'org'}`} onClick={submit}>{type==='buy'?'Registrar compra':'Registrar venda'}</button>
        </div>
      </div>
    </div>
  )
}