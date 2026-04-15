import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'


const FILTERS = [
  { id:'all',         label:'Tots',       emoji:'📋' },
  { id:'investments', label:'Inversions', emoji:'📈' },
  { id:'savings',     label:'Estalvis',   emoji:'🏦' },
  { id:'crypto',      label:'Crypto',     emoji:'🔶' },
  { id:'commodity',   label:'Primeres',   emoji:'🥇' },
]

const TYPE_LABELS = {
  etf:'ETF', stock:'Acció', robo:'Robo', efectiu:'Efectiu', estalvi:'Estalvi', crypto:'Crypto', commodity:'Commodity'
}

const styles = `
  .mv { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .mv-hero { background:linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%); border:1px solid var(--c-border); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .mv-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(123,97,255,0.06) 0%,transparent 70%); pointer-events:none; }
  .mv-hero-label { font-size:11px; font-weight:500; color:var(--c-text-muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .mv-hero-total { font-size:36px; font-weight:600; color:var(--c-text-primary); letter-spacing:0.5px; font-family:${FONTS.num}; font-variant-FONTS.numeric:tabular-FONTS.nums; line-height:1; margin-bottom:8px; }
  .mv-hero-total span { font-size:36px; opacity:0.70; }
  .mv-hero-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding-top:14px; border-top:1px solid var(--c-border); }
  .mv-hero-m-l { font-size:9px; font-weight:500; color:var(--c-text-muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
  .mv-hero-m-v { font-size:16px; font-weight:300; color:var(--c-text-primary); font-family:${FONTS.num}; font-variant-FONTS.numeric:tabular-FONTS.nums; }
  .mv-hero-m-v.g { color:${COLORS.neonGreen}; }
  .mv-hero-m-v.p { color:${COLORS.neonPurple}; }
  .mv-hero-m-v.a { color:${COLORS.neonAmber}; }
  .mv-hero-m-v.c { color:${COLORS.neonCyan}; }

  /* ── Filtres ── */
  .mv-filters { display:flex; gap:5px; flex-wrap:wrap; }
  .mv-filter { padding:6px 12px; border-radius:20px; border:1px solid var(--c-border); background:transparent; font-family:${FONTS.sans}; font-size:11px; font-weight:500; color:var(--c-text-muted); cursor:pointer; transition:all 100ms; -webkit-tap-highlight-color:transparent; }
  .mv-filter:hover { color:var(--c-text-secondary); border-color:var(--c-text-disabled); }
  .mv-filter.on { background:rgba(0,255,136,0.09); border-color:rgba(0,255,136,0.25); color:${COLORS.neonGreen}; }

  /* ── Timeline ── */
  .mv-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; overflow:hidden; }

  .mv-month-hdr { display:flex; justify-content:space-between; align-items:center; padding:10px 16px 8px; background:var(--c-elevated); border-bottom:1px solid var(--c-border); }
  .mv-month-label { font-size:10px; font-weight:600; color:var(--c-text-muted); text-transform:capitalize; letter-spacing:0.04em; }
  .mv-month-total { font-size:12px; font-family:${FONTS.num}; font-weight:500; color:var(--c-text-secondary); font-variant-FONTS.numeric:tabular-FONTS.nums; }

  /* Row */
  .mv-row { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.03); transition:background 80ms; cursor:default; }
  .mv-row:last-child { border-bottom:none; }
  .mv-row:hover { background:var(--c-elevated); }

  .mv-day { font-size:10px; font-family:${FONTS.num}; color:var(--c-text-disabled); width:20px; flex-shrink:0; text-align:center; }
  .mv-av { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; }
  .mv-info { flex:1; min-width:0; }
  .mv-name { font-size:13px; font-weight:500; color:var(--c-text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .mv-meta { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.mono}; }
  .mv-right { text-align:right; flex-shrink:0; }
  .mv-amount { font-size:13px; font-family:${FONTS.num}; font-weight:400; color:var(--c-text-secondary); font-variant-FONTS.numeric:tabular-FONTS.nums; margin-bottom:3px; }
  .mv-tag { font-size:9px; font-weight:700; padding:2px 7px; border-radius:10px; display:inline-block; }

  .mv-empty { padding:48px 16px; text-align:center; }
  .mv-empty-main { font-size:13px; color:var(--c-text-muted); font-weight:500; margin-bottom:5px; }
  .mv-empty-sub { font-size:11px; color:var(--c-text-disabled); }
`

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return {
    day:        d.getDate().toString().padStart(2,'0'),
    monthKey:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
    monthLabel: d.toLocaleDateString('ca-ES',{month:'long',year:'numeric'}),
  }
}

export default function MovementsPage({ investments=[], savings=[], cryptos=[], commodities=[] }) {
  const [filter, setFilter] = useState('all')

  const allMovements = useMemo(() => {
    const list = []

    investments.forEach(inv => {
      const tc = TYPE_COLORS[inv.type]||TYPE_COLORS.etf
      const dateStr = inv.purchaseDate||inv.createdAt||new Date().toISOString()
      list.push({
        id:`inv-${inv.id}`, category:'investments', date:dateStr,
        name:inv.name, meta:[inv.qty&&`${inv.qty} u.`,inv.ticker].filter(Boolean).join(' · '),
        amount:inv.initialValue||inv.totalCost||0, type:inv.type, typeLabel:TYPE_LABELS[inv.type]||inv.type,
        initials:inv.name.slice(0,2).toUpperCase(), bg:tc.bg, color:tc.color,
      })
    })
    savings.forEach(s => {
      const dateStr = s.createdAt||s.purchaseDate||new Date().toISOString()
      list.push({
        id:`sav-${s.id}`, category:'savings', date:dateStr,
        name:s.name, meta:s.rate?`${s.rate}% TAE`:'Compte estalvi',
        amount:s.amount||0, type:'estalvi', typeLabel:'Estalvi',
        initials:s.name.slice(0,2).toUpperCase(),
        bg:'rgba(0,255,136,0.10)', color:COLORS.neonGreen,
      })
    })
    cryptos.forEach(c => {
      const dateStr = c.purchaseDate||c.createdAt||new Date().toISOString()
      list.push({
        id:`cry-${c.id}`, category:'crypto', date:dateStr,
        name:c.name, meta:[(c.totalQty||c.qty)&&`${c.totalQty||c.qty} u.`,c.symbol].filter(Boolean).join(' · '),
        amount:c.totalCost||c.initialValue||0, type:'crypto', typeLabel:c.symbol||'Crypto',
        initials:(c.symbol||c.name).slice(0,3).toUpperCase(),
        bg:'rgba(255,149,0,0.10)', color:COLORS.neonAmber,
      })
    })
    commodities.forEach(c => {
      const dateStr = c.purchaseDate||c.createdAt||new Date().toISOString()
      list.push({
        id:`com-${c.id}`, category:'commodity', date:dateStr,
        name:c.name, meta:[c.totalQty&&`${c.totalQty} ${c.unit||''}`,c.symbol].filter(Boolean).join(' · '),
        amount:c.totalCost||0, type:'commodity', typeLabel:c.symbol||'Mat. primera',
        initials:(c.symbol||c.name).slice(0,3).toUpperCase(),
        bg:'rgba(200,150,26,0.10)', color:'#c8961a',
      })
    })

    return list.sort((a,b)=>new Date(b.date)-new Date(a.date))
  }, [investments, savings, cryptos, commodities])

  const filtered = filter==='all' ? allMovements : allMovements.filter(m=>m.category===filter)

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(m => {
      const d = formatDate(m.date)
      if (!d) return
      if (!groups[d.monthKey]) groups[d.monthKey] = { label:d.monthLabel, items:[] }
      groups[d.monthKey].items.push({...m, day:d.day})
    })
    return Object.entries(groups).sort((a,b)=>b[0].localeCompare(a[0]))
  }, [filtered])

  const totalInvested  = allMovements.reduce((s,m)=>s+m.amount,0)
  const countInv = allMovements.filter(m=>m.category==='investments').length
  const countSav = allMovements.filter(m=>m.category==='savings').length
  const countCry = allMovements.filter(m=>m.category==='crypto').length
  const countCom = allMovements.filter(m=>m.category==='commodity').length

  const totalStr = fmtEur(totalInvested).replace('€','').trim()
  const [intPart, decPart='00'] = totalStr.split(',')

  return (
    <div className="mv">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="mv-hero">
        <p className="mv-hero-label">Historial de posicions</p>
        <p className="mv-hero-total">{intPart}<span>,{decPart} €</span></p>
        <div className="mv-hero-metrics">
          <div>
            <p className="mv-hero-m-l">Inversions</p>
            <p className="mv-hero-m-v c">{countInv}</p>
          </div>
          <div>
            <p className="mv-hero-m-l">Estalvis</p>
            <p className="mv-hero-m-v g">{countSav}</p>
          </div>
          <div>
            <p className="mv-hero-m-l">Crypto</p>
            <p className="mv-hero-m-v a">{countCry}</p>
          </div>
          <div>
            <p className="mv-hero-m-l">Mat. primeres</p>
            <p className="mv-hero-m-v" style={{color:'#c8961a'}}>{countCom}</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="mv-filters">
        {FILTERS.map(f=>(
          <button key={f.id} className={`mv-filter${filter===f.id?' on':''}`} onClick={()=>setFilter(f.id)}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="mv-panel">
        {grouped.length===0 ? (
          <div className="mv-empty">
            <p className="mv-empty-main">Cap moviment registrat</p>
            <p className="mv-empty-sub">Les posicions que afegeixes apareixeran aquí</p>
          </div>
        ) : grouped.map(([key, group])=>{
          const monthTotal = group.items.reduce((s,m)=>s+m.amount,0)
          return (
            <div key={key}>
              <div className="mv-month-hdr">
                <span className="mv-month-label">{group.label}</span>
                <span className="mv-month-total">{fmtEur(monthTotal)}</span>
              </div>
              {group.items.map(m=>(
                <div key={m.id} className="mv-row">
                  <span className="mv-day">{m.day}</span>
                  <div className="mv-av" style={{background:m.bg,color:m.color}}>{m.initials}</div>
                  <div className="mv-info">
                    <p className="mv-name">{m.name}</p>
                    {m.meta && <p className="mv-meta">{m.meta}</p>}
                  </div>
                  <div className="mv-right">
                    <p className="mv-amount">{fmtEur(m.amount)}</p>
                    <span className="mv-tag" style={{background:m.bg,color:m.color}}>{m.typeLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div style={{height:16}}/>
    </div>
  )
}