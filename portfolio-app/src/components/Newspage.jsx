import { useState, useEffect, useCallback, useMemo } from 'react'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'


async function fetchNews(ticker = null) {
  try {
    const url = ticker
      ? `/yahoo/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=20&quotesCount=0&lang=en`
      : `/yahoo/v1/finance/search?q=market+news+stocks&newsCount=20&quotesCount=0&lang=en`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data  = await res.json()
      const items = data?.news || []
      if (items.length > 0)
        return items.map(item => ({
          id:        item.uuid || Math.random().toString(36),
          title:     item.title || '',
          summary:   item.summary || '',
          url:       item.link || '#',
          source:    item.publisher || 'Yahoo Finance',
          time:      item.providerPublishTime || 0,
          thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
          tickers:   item.relatedTickers || [],
        })).filter(n => n.title)
    }
  } catch {}
  try {
    const rssUrl = ticker
      ? `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`
      : `https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US`
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
    const res2  = await fetch(proxy, { signal: AbortSignal.timeout(10000) })
    if (!res2.ok) return []
    const xml   = await res2.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    return items.slice(0, 20).map((m, i) => {
      const inner   = m[1]
      const title   = inner.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || inner.match(/<title>(.*?)<\/title>/)?.[1] || ''
      const link    = inner.match(/<link>(.*?)<\/link>/)?.[1] || '#'
      const desc    = inner.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || ''
      const source  = inner.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Yahoo Finance'
      const pubDate = inner.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      return { id:`rss-${i}`, title, summary:desc.replace(/<[^>]+>/g,'').slice(0,200), url:link, source, time:pubDate?new Date(pubDate).getTime()/1000:0, thumbnail:null, tickers:[] }
    }).filter(n => n.title)
  } catch { return [] }
}

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor(Date.now()/1000) - ts
  if (s < 60)     return 'ara mateix'
  if (s < 3600)   return `fa ${Math.floor(s/60)}m`
  if (s < 86400)  return `fa ${Math.floor(s/3600)}h`
  if (s < 604800) return `fa ${Math.floor(s/86400)}d`
  return new Date(ts*1000).toLocaleDateString('ca-ES',{day:'numeric',month:'short'})
}
function isWithinPeriod(ts, period) {
  if (!ts||period==='all') return true
  const s = Date.now()/1000 - ts
  if (period==='today') return s < 86400
  if (period==='week')  return s < 604800
  if (period==='month') return s < 2592000
  return true
}

const PERIODS = [
  { id:'all',   label:'Tot'     },
  { id:'today', label:'Avui'    },
  { id:'week',  label:'Setmana' },
  { id:'month', label:'Mes'     },
]

const styles = `
  .nw { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  /* ── Hero ── */
  .nw-hero { background:linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%); border:1px solid var(--c-border); border-radius:12px; padding:20px; position:relative; overflow:hidden; }
  .nw-hero::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%); pointer-events:none; }
  .nw-hero-label { font-size:11px; font-weight:500; color:var(--c-text-muted); letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .nw-hero-title { font-size:36px; font-weight:600; color:var(--c-text-primary); letter-spacing:0.5px; font-family:${FONTS.num}; margin-bottom:4px; }
  .nw-hero-sub { font-size:12px; color:var(--c-text-muted); }

  /* Tabs d'actiu — scrollable horitzontal */
  .nw-asset-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:2px; }
  .nw-asset-scroll::-webkit-scrollbar { display:none; }
  .nw-asset-tabs { display:flex; gap:5px; width:max-content; }
  .nw-asset-tab { padding:6px 14px; border-radius:20px; border:1px solid var(--c-border); background:transparent; font-family:${FONTS.sans}; font-size:12px; font-weight:500; color:var(--c-text-secondary); cursor:pointer; transition:all 100ms; white-space:nowrap; -webkit-tap-highlight-color:transparent; }
  .nw-asset-tab:hover { color:var(--c-text-secondary); border-color:var(--c-text-disabled); }
  .nw-asset-tab.on { background:rgba(0,212,255,0.10); border-color:rgba(0,212,255,0.25); color:${COLORS.neonCyan}; }

  /* Controls period + refresh */
  .nw-controls { display:flex; align-items:center; gap:6px; }
  .nw-periods { display:flex; gap:3px; }
  .nw-period { padding:5px 11px; border-radius:20px; border:1px solid var(--c-border); background:transparent; font-family:${FONTS.num}; font-size:11px; font-weight:500; color:var(--c-text-muted); cursor:pointer; transition:all 100ms; }
  .nw-period:hover { color:var(--c-text-secondary); border-color:var(--c-text-disabled); }
  .nw-period.on { background:rgba(0,255,136,0.09); border-color:rgba(0,255,136,0.25); color:${COLORS.neonGreen}; }
  .nw-refresh { width:30px; height:30px; background:transparent; border:1px solid var(--c-border); border-radius:8px; color:var(--c-text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; margin-left:auto; }
  .nw-refresh:hover { border-color:var(--c-text-disabled); color:var(--c-text-secondary); }
  .nw-count { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.num}; }
  .nw-spin-anim { animation:nwspin .7s linear infinite; }
  @keyframes nwspin { to { transform:rotate(360deg); } }

  /* Panel notícies */
  .nw-panel { background:var(--c-surface); border:1px solid var(--c-border); border-radius:10px; overflow:hidden; }

  /* Notícia */
  .nw-item { display:flex; gap:12px; padding:14px 16px; border-bottom:1px solid var(--c-border); cursor:pointer; transition:background 80ms; text-decoration:none; -webkit-tap-highlight-color:transparent; }
  .nw-item:last-child { border-bottom:none; }
  .nw-item:hover { background:var(--c-elevated); }
  .nw-item:active { background:var(--c-elevated); }

  /* Thumbnail */
  .nw-thumb { width:72px; height:52px; border-radius:8px; object-fit:cover; flex-shrink:0; background:var(--c-elevated); }
  .nw-thumb-ph { width:72px; height:52px; border-radius:8px; flex-shrink:0; background:var(--c-elevated); border:1px solid var(--c-border); display:flex; align-items:center; justify-content:center; }

  .nw-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; justify-content:center; }
  .nw-headline { font-size:13px; font-weight:500; color:var(--c-text-primary); line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .nw-summary  { font-size:11px; color:var(--c-text-muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
  .nw-meta { display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap; }
  .nw-source   { font-size:10px; font-weight:600; color:var(--c-text-muted); }
  .nw-dot      { width:2px; height:2px; border-radius:50%; background:rgba(255,255,255,0.15); flex-shrink:0; }
  .nw-time     { font-size:10px; color:var(--c-text-muted); font-family:${FONTS.num}; }
  .nw-ticker-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:1px 6px; border-radius:10px; background:rgba(0,212,255,0.10); color:${COLORS.neonCyan}; }

  /* Loading / empty */
  .nw-loading { display:flex; align-items:center; gap:8px; padding:48px 16px; font-size:12px; color:var(--c-text-muted); justify-content:center; }
  .nw-spin { width:12px; height:12px; border:1.5px solid rgba(255,255,255,0.08); border-top-color:${COLORS.neonGreen}; border-radius:50%; animation:nwspin .7s linear infinite; }
  .nw-empty { padding:48px 16px; text-align:center; }
  .nw-empty-main { font-size:13px; color:var(--c-text-muted); font-weight:500; margin-bottom:5px; }
  .nw-empty-sub { font-size:11px; color:rgba(255,255,255,0.16); }

  @media (max-width:500px) {
    .nw-thumb, .nw-thumb-ph { width:60px; height:46px; }
    .nw-headline { font-size:12px; }
  }
`

const NewsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>
  </svg>
)

function NewsItem({ item }) {
  return (
    <a className="nw-item" href={item.url} target="_blank" rel="noopener noreferrer">
      {item.thumbnail
        ? <img className="nw-thumb" src={item.thumbnail} alt="" loading="lazy" onError={e=>e.target.style.display='none'}/>
        : <div className="nw-thumb-ph"><NewsIcon/></div>
      }
      <div className="nw-body">
        <p className="nw-headline">{item.title}</p>
        {item.summary && <p className="nw-summary">{item.summary}</p>}
        <div className="nw-meta">
          <span className="nw-source">{item.source}</span>
          {item.time>0 && <><div className="nw-dot"/><span className="nw-time">{timeAgo(item.time)}</span></>}
          {item.tickers?.slice(0,2).map(t=>(
            <span key={t} className="nw-ticker-badge">{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}

export default function NewsPage({ investments=[], cryptos=[], commodities=[] }) {
  const [activeTicker, setActiveTicker] = useState('market')
  const [period, setPeriod]   = useState('all')
  const [news, setNews]       = useState([])
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)
  const [spinning, setSpinning] = useState(false)

  const assets = useMemo(() => {
    const list = [{ id:'market', label:'🌍 Mercat', ticker:null }]
    investments.filter(i=>i.ticker&&!['efectiu','estalvi'].includes(i.type))
      .forEach(i => list.push({ id:i.id, label:i.ticker, ticker:i.ticker, name:i.name }))
    cryptos.filter(c=>c.symbol)
      .forEach(c => list.push({ id:c.id, label:c.symbol, ticker:c.symbol, name:c.name }))
    return list
  }, [investments.length, cryptos.length]) // eslint-disable-line

  const load = useCallback(async (showSpin=false) => {
    setLoading(true)
    if (showSpin) setSpinning(true)
    const asset  = assets.find(a=>a.id===activeTicker)
    const result = await fetchNews(asset?.ticker||null)
    setNews(result)
    setLastFetch(new Date())
    setLoading(false)
    setSpinning(false)
  }, [activeTicker, assets])

  useEffect(() => { load() }, [activeTicker]) // eslint-disable-line

  const filtered = useMemo(() => news.filter(n=>isWithinPeriod(n.time,period)), [news, period])
  const activeAsset = assets.find(a=>a.id===activeTicker)

  return (
    <div className="nw">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      {/* Hero */}
      <div className="nw-hero">
        <p className="nw-hero-label">Notícies financeres</p>
        <p className="nw-hero-title">
          {activeAsset?.ticker ? `${activeAsset.name||activeAsset.ticker}` : 'Mercat global'}
        </p>
        <p className="nw-hero-sub">
          {filtered.length} notícia{filtered.length!==1?'es':''}{lastFetch?` · ${timeAgo(lastFetch.getTime()/1000)}`:''}
        </p>
      </div>

      {/* Selector d'actiu (scrollable) */}
      <div className="nw-asset-scroll">
        <div className="nw-asset-tabs">
          {assets.map(a=>(
            <button key={a.id} className={`nw-asset-tab${activeTicker===a.id?' on':''}`} onClick={()=>setActiveTicker(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="nw-controls">
        <div className="nw-periods">
          {PERIODS.map(p=>(
            <button key={p.id} className={`nw-period${period===p.id?' on':''}`} onClick={()=>setPeriod(p.id)}>{p.label}</button>
          ))}
        </div>
        <button className="nw-refresh" onClick={()=>load(true)} title="Actualitzar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={spinning?'nw-spin-anim':''}>
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      {/* Llista */}
      <div className="nw-panel">
        {loading ? (
          <div className="nw-loading"><div className="nw-spin"/> Carregant notícies...</div>
        ) : filtered.length===0 ? (
          <div className="nw-empty">
            <p className="nw-empty-main">Cap notícia trobada</p>
            <p className="nw-empty-sub">{period!=='all'?'Prova amb un altre filtre de data':'Yahoo Finance no té notícies per aquest actiu'}</p>
          </div>
        ) : (
          filtered.map(item=><NewsItem key={item.id} item={item}/>)
        )}
      </div>

      <div style={{height:16}}/>
    </div>
  )
}