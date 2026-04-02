import { useState, useEffect, useCallback, useMemo } from 'react'
import { SHARED_STYLES, COLORS, FONTS } from './design-tokens'

// ── Fetch notícies via Yahoo Finance RSS ──────────────────────────────────────
async function fetchNews(ticker = null) {
  try {
    const url = ticker
      ? `/yahoo/v2/finance/news?tickers=${encodeURIComponent(ticker)}&count=20&lang=en`
      : `/yahoo/v2/finance/news?category=generalnews&count=20&lang=en`

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()

    // Yahoo retorna { items: { result: [...] } } o { data: [...] }
    const items = data?.items?.result
      || data?.data
      || data?.news
      || []

    return items.map(item => ({
      id:        item.id || item.uuid || Math.random().toString(36),
      title:     item.title || item.headline || '',
      summary:   item.summary || item.shortDescription || '',
      url:       item.url || item.link || '#',
      source:    item.publisher || item.source?.label || item.source || 'Yahoo Finance',
      time:      item.providerPublishTime || item.pubTime || item.published_at || 0,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || item.main_image?.original_url || null,
      tickers:   item.relatedTickers || item.tickers || [],
    })).filter(n => n.title)

  } catch {
    // Fallback: RSS via allorigins
    try {
      const rssUrl = ticker
        ? `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`
        : `https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US`
      const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
      const res2  = await fetch(proxy, { signal: AbortSignal.timeout(8000) })
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
        const time    = pubDate ? new Date(pubDate).getTime() / 1000 : 0
        return { id: `rss-${i}`, title, summary: desc.replace(/<[^>]+>/g, '').slice(0, 200), url: link, source, time, thumbnail: null, tickers: [] }
      }).filter(n => n.title)
    } catch { return [] }
  }
}

function timeAgo(ts) {
  if (!ts) return ''
  const secs = Math.floor(Date.now() / 1000) - ts
  if (secs < 60)   return 'ara mateix'
  if (secs < 3600) return `fa ${Math.floor(secs / 60)}m`
  if (secs < 86400) return `fa ${Math.floor(secs / 3600)}h`
  if (secs < 604800) return `fa ${Math.floor(secs / 86400)}d`
  return new Date(ts * 1000).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}

function isWithinPeriod(ts, period) {
  if (!ts || period === 'all') return true
  const secs = Date.now() / 1000 - ts
  if (period === 'today')  return secs < 86400
  if (period === 'week')   return secs < 604800
  if (period === 'month')  return secs < 2592000
  return true
}

const PERIODS = [
  { id: 'all',   label: 'Tot' },
  { id: 'today', label: 'Avui' },
  { id: 'week',  label: 'Setmana' },
  { id: 'month', label: 'Mes' },
]

const styles = `
  .nw { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:12px; }

  .nw-title { font-size:16px; font-weight:500; color:${COLORS.textPrimary}; letter-spacing:-0.2px; margin-bottom:3px; }
  .nw-sub   { font-size:12px; color:${COLORS.textMuted}; }

  /* Controls */
  .nw-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  /* Selector d'actiu */
  .nw-asset-tabs { display:flex; gap:1px; background:${COLORS.border}; border-radius:4px; overflow:hidden; flex-wrap:wrap; }
  .nw-asset-tab  { padding:6px 12px; border:none; background:${COLORS.surface}; font-family:${FONTS.mono}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; white-space:nowrap; }
  .nw-asset-tab:hover { color:${COLORS.textSecondary}; background:${COLORS.elevated}; }
  .nw-asset-tab.on { background:${COLORS.elevated}; color:${COLORS.textPrimary}; }

  /* Period tabs */
  .nw-periods { display:flex; gap:1px; background:${COLORS.border}; border-radius:4px; overflow:hidden; }
  .nw-period  { padding:6px 10px; border:none; background:${COLORS.surface}; font-family:${FONTS.mono}; font-size:11px; font-weight:500; color:${COLORS.textMuted}; cursor:pointer; transition:all 100ms; }
  .nw-period:hover { color:${COLORS.textSecondary}; background:${COLORS.elevated}; }
  .nw-period.on { background:${COLORS.elevated}; color:${COLORS.textPrimary}; }

  /* Refresh */
  .nw-refresh { width:28px; height:28px; background:transparent; border:1px solid ${COLORS.border}; border-radius:4px; color:${COLORS.textMuted}; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; flex-shrink:0; margin-left:auto; }
  .nw-refresh:hover { border-color:${COLORS.borderHi}; color:${COLORS.textSecondary}; }
  .nw-refresh.spinning svg { animation:nwspin .7s linear infinite; }
  @keyframes nwspin { to { transform:rotate(360deg); } }

  /* Notícia */
  .nw-item { display:flex; gap:12px; padding:14px 0; border-bottom:1px solid ${COLORS.border}; cursor:pointer; transition:opacity 80ms; text-decoration:none; -webkit-tap-highlight-color:transparent; }
  .nw-item:last-child { border-bottom:none; }
  .nw-item:hover { opacity:0.75; }

  .nw-thumb { width:72px; height:52px; border-radius:4px; background:${COLORS.elevated}; flex-shrink:0; object-fit:cover; border:1px solid ${COLORS.border}; }
  .nw-thumb-placeholder { width:72px; height:52px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; flex-shrink:0; display:flex; align-items:center; justify-content:center; }

  .nw-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
  .nw-headline { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .nw-summary  { font-size:11px; color:${COLORS.textMuted}; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .nw-meta     { display:flex; align-items:center; gap:6px; margin-top:2px; }
  .nw-source   { font-size:10px; font-weight:500; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .nw-dot      { width:2px; height:2px; border-radius:50%; background:${COLORS.textMuted}; flex-shrink:0; }
  .nw-time     { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .nw-ticker-badge { font-size:9px; font-weight:700; font-family:${FONTS.mono}; padding:1px 5px; border-radius:2px; background:${COLORS.bgCyan}; color:${COLORS.neonCyan}; flex-shrink:0; }

  /* Loading / empty */
  .nw-loading { display:flex; align-items:center; gap:8px; padding:40px 0; font-size:12px; color:${COLORS.textMuted}; justify-content:center; }
  .nw-spin    { width:13px; height:13px; border:1.5px solid ${COLORS.border}; border-top-color:${COLORS.textSecondary}; border-radius:50%; animation:nwspin .7s linear infinite; }
  .nw-empty   { padding:40px 0; text-align:center; font-size:13px; color:${COLORS.textMuted}; }
  .nw-empty-sub { font-size:11px; color:${COLORS.textMuted}; opacity:0.5; margin-top:4px; }

  /* Panel */
  .nw-panel { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:6px; padding:16px; }

  /* Mòbil */
  @media (max-width:500px) {
    .nw-thumb, .nw-thumb-placeholder { width:56px; height:44px; }
    .nw-headline { font-size:12px; }
  }
`

// Icona de notícia placeholder
const NewsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>
  </svg>
)

function NewsItem({ item }) {
  return (
    <a className="nw-item" href={item.url} target="_blank" rel="noopener noreferrer">
      {item.thumbnail
        ? <img className="nw-thumb" src={item.thumbnail} alt="" loading="lazy" onError={e => { e.target.style.display='none' }}/>
        : <div className="nw-thumb-placeholder"><NewsIcon/></div>
      }
      <div className="nw-body">
        <p className="nw-headline">{item.title}</p>
        {item.summary && <p className="nw-summary">{item.summary}</p>}
        <div className="nw-meta">
          <span className="nw-source">{item.source}</span>
          {item.time > 0 && <><div className="nw-dot"/><span className="nw-time">{timeAgo(item.time)}</span></>}
          {item.tickers?.slice(0, 2).map(t => (
            <span key={t} className="nw-ticker-badge">{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}

export default function NewsPage({ investments = [], cryptos = [], commodities = [] }) {
  const [activeTicker, setActiveTicker] = useState('market')
  const [period, setPeriod]   = useState('all')
  const [news, setNews]       = useState([])
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)

  // Construeix la llista d'actius disponibles
  const assets = useMemo(() => {
    const list = [{ id: 'market', label: 'Mercat', ticker: null }]
    investments
      .filter(i => i.ticker && !['efectiu', 'estalvi'].includes(i.type))
      .forEach(i => list.push({ id: i.id, label: i.ticker, ticker: i.ticker, name: i.name }))
    cryptos
      .filter(c => c.coinId)
      .forEach(c => list.push({ id: c.id, label: c.symbol || c.name, ticker: c.symbol, name: c.name }))
    return list
  }, [investments.length, cryptos.length]) // eslint-disable-line

  const load = useCallback(async () => {
    setLoading(true)
    const asset  = assets.find(a => a.id === activeTicker)
    const result = await fetchNews(asset?.ticker || null)
    setNews(result)
    setLastFetch(new Date())
    setLoading(false)
  }, [activeTicker, assets])

  useEffect(() => { load() }, [activeTicker]) // eslint-disable-line

  const filtered = useMemo(() =>
    news.filter(n => isWithinPeriod(n.time, period))
  , [news, period])

  const activeAsset = assets.find(a => a.id === activeTicker)

  return (
    <div className="nw">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="nw-title">Notícies</h2>
        <p className="nw-sub">
          {activeAsset?.ticker
            ? `Notícies sobre ${activeAsset.name || activeAsset.ticker}`
            : 'Notícies generals del mercat'}
          {lastFetch && <span style={{ marginLeft: 6, opacity: 0.5 }}>· {timeAgo(lastFetch.getTime() / 1000)}</span>}
        </p>
      </div>

      {/* Selector d'actiu */}
      <div className="nw-asset-tabs">
        {assets.map(a => (
          <button key={a.id} className={`nw-asset-tab${activeTicker === a.id ? ' on' : ''}`}
            onClick={() => setActiveTicker(a.id)}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Controls: period + refresh */}
      <div className="nw-controls">
        <div className="nw-periods">
          {PERIODS.map(p => (
            <button key={p.id} className={`nw-period${period === p.id ? ' on' : ''}`}
              onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <button className={`nw-refresh${loading ? ' spinning' : ''}`} onClick={load} title="Actualitzar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      {/* Contingut */}
      <div className="nw-panel">
        {loading ? (
          <div className="nw-loading"><div className="nw-spin"/> Carregant notícies...</div>
        ) : filtered.length === 0 ? (
          <div className="nw-empty">
            <p>Cap notícia trobada</p>
            <p className="nw-empty-sub">
              {period !== 'all' ? 'Prova amb un altre filtre de data' : 'Yahoo Finance pot no tenir notícies per aquest actiu'}
            </p>
          </div>
        ) : (
          filtered.map(item => <NewsItem key={item.id} item={item}/>)
        )}
      </div>
    </div>
  )
}