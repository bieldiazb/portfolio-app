import { useState, useCallback, useRef } from 'react'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'

const TYPE_OPTIONS = [
  { value:'etf',     label:'ETF',     short:'ETF' },
  { value:'stock',   label:'Acció',   short:'ACC' },
  { value:'robo',    label:'Robo',    short:'ROB' },
  { value:'efectiu', label:'Efectiu', short:'EFE' },
]

const modalStyles = `
  .aim-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:flex-end; justify-content:center; z-index:50; }
  @media (min-width:640px) { .aim-overlay { align-items:center; padding:1rem; } }

  .aim-modal { font-family:${FONTS.sans}; background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:8px 8px 0 0; width:100%; padding:24px 20px 32px; max-height:92vh; overflow-y:auto; }
  @media (min-width:640px) { .aim-modal { max-width:440px; border-radius:8px; padding:24px 22px 28px; } }

  .aim-handle { width:32px; height:3px; border-radius:2px; background:${COLORS.borderMid}; margin:0 auto 18px; }
  @media (min-width:640px) { .aim-handle { display:none; } }

  .aim-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .aim-title { font-size:15px; font-weight:600; color:${COLORS.textPrimary}; }
  .aim-close { width:26px; height:26px; border-radius:4px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .aim-close:hover { color:${COLORS.textPrimary}; border-color:${COLORS.borderHi}; }

  /* Tipus */
  .aim-tgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:20px; }
  .aim-tbtn { display:flex; flex-direction:column; align-items:center; padding:10px 4px 8px; border-radius:4px; border:1px solid ${COLORS.border}; background:${COLORS.elevated}; cursor:pointer; gap:5px; transition:all 100ms; font-family:${FONTS.sans}; -webkit-tap-highlight-color:transparent; }
  .aim-tbtn:hover { border-color:${COLORS.borderHi}; }
  .aim-tav { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; font-family:${FONTS.mono}; }
  .aim-tlbl { font-size:10px; color:${COLORS.textMuted}; font-weight:500; }
  .aim-tbtn.sel .aim-tlbl { color:${COLORS.textSecondary}; }

  /* Search */
  .aim-search-wrap { position:relative; margin-bottom:8px; }
  .aim-search-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 36px 10px 36px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; transition:border-color 120ms; box-sizing:border-box; }
  .aim-search-inp:focus { border-color:${COLORS.neonPurple}; }
  .aim-search-inp::placeholder { color:${COLORS.textMuted}; }
  .aim-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:${COLORS.textMuted}; pointer-events:none; }
  .aim-search-spin { position:absolute; right:11px; top:50%; transform:translateY(-50%); width:13px; height:13px; border:1.5px solid ${COLORS.border}; border-top-color:${COLORS.textSecondary}; border-radius:50%; animation:aimspin .7s linear infinite; }
  @keyframes aimspin { to { transform:translateY(-50%) rotate(360deg); } }

  /* Results */
  .aim-results { background:${COLORS.surface}; border:1px solid ${COLORS.border}; border-radius:5px; overflow:hidden; margin-bottom:8px; }
  .aim-result { display:flex; align-items:center; padding:10px 12px; cursor:pointer; border-bottom:1px solid ${COLORS.border}; transition:background 80ms; gap:10px; -webkit-tap-highlight-color:transparent; }
  .aim-result:last-child { border-bottom:none; }
  .aim-result:hover { background:${COLORS.elevated}; }
  .aim-result-av { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; font-family:${FONTS.mono}; background:${COLORS.bgCyan}; color:${COLORS.neonCyan}; }
  .aim-result-info { flex:1; min-width:0; }
  .aim-result-name { font-size:12px; font-weight:500; color:${COLORS.textPrimary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .aim-result-meta { font-size:10px; color:${COLORS.textMuted}; font-family:${FONTS.mono}; }
  .aim-result-curr { font-size:9px; font-weight:700; padding:1px 5px; border-radius:2px; flex-shrink:0; font-family:${FONTS.mono}; }
  .aim-result-curr.usd { color:${COLORS.neonAmber}; background:${COLORS.bgAmber}; }
  .aim-result-curr.gbp { color:${COLORS.neonGreen}; background:${COLORS.bgGreen}; }
  .aim-result-curr.eur { color:${COLORS.neonCyan}; background:${COLORS.bgCyan}; }
  .aim-result-price { font-size:11px; font-family:${FONTS.mono}; color:${COLORS.textSecondary}; text-align:right; flex-shrink:0; min-width:52px; }
  .aim-result-price.loading { color:${COLORS.textMuted}; letter-spacing:2px; }
  .aim-no-results { padding:16px; text-align:center; font-size:12px; color:${COLORS.textMuted}; }

  /* Chip seleccionat */
  .aim-chip { display:flex; align-items:center; gap:10px; padding:10px 12px; background:${COLORS.bgGreen}; border:1px solid ${COLORS.borderGreen}; border-radius:5px; margin-bottom:10px; }
  .aim-chip-info { flex:1; min-width:0; }
  .aim-chip-name { font-size:13px; font-weight:500; color:${COLORS.textPrimary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .aim-chip-meta { font-size:10px; color:${COLORS.neonGreen}; font-family:${FONTS.mono}; }
  .aim-chip-clear { width:22px; height:22px; border-radius:3px; background:${COLORS.elevated}; border:1px solid ${COLORS.border}; color:${COLORS.textSecondary}; font-size:13px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 100ms; }
  .aim-chip-clear:hover { color:${COLORS.textPrimary}; }

  .aim-manual-link { font-size:11px; color:${COLORS.textMuted}; text-align:center; margin-bottom:12px; cursor:pointer; text-decoration:underline; text-decoration-color:${COLORS.borderMid}; transition:color 100ms; }
  .aim-manual-link:hover { color:${COLORS.textSecondary}; }

  /* Fields */
  .aim-space { display:flex; flex-direction:column; gap:12px; margin-bottom:14px; }
  .aim-lbl { display:block; font-size:10px; font-weight:500; color:${COLORS.textMuted}; text-transform:uppercase; letter-spacing:0.10em; margin-bottom:5px; }
  .aim-inp { width:100%; background:${COLORS.bg}; border:1px solid ${COLORS.border}; border-radius:5px; padding:10px 12px; font-family:${FONTS.sans}; font-size:14px; color:${COLORS.textPrimary}; outline:none; transition:border-color 120ms; box-sizing:border-box; }
  .aim-inp:focus { border-color:${COLORS.neonPurple}; }
  .aim-inp::placeholder { color:${COLORS.textMuted}; }
  .aim-inp.mono { font-family:${FONTS.mono}; }

  /* Hint */
  .aim-hint { display:flex; align-items:flex-start; gap:8px; padding:10px 12px; background:${COLORS.bgCyan}; border:1px solid ${COLORS.borderCyan}; border-radius:5px; margin-bottom:4px; }
  .aim-hint-text { font-size:11px; color:${COLORS.textSecondary}; line-height:1.6; }

  .aim-error { font-size:12px; color:${COLORS.neonRed}; background:${COLORS.bgRed}; border:1px solid ${COLORS.borderRed}; border-radius:5px; padding:9px 12px; margin-bottom:4px; }

  /* Footer */
  .aim-footer { display:flex; gap:8px; margin-top:18px; }
  .aim-cancel { flex:1; padding:11px; border:1px solid ${COLORS.border}; background:transparent; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; color:${COLORS.textSecondary}; cursor:pointer; transition:all 100ms; }
  .aim-cancel:hover { border-color:${COLORS.borderHi}; color:${COLORS.textPrimary}; }
  .aim-submit { flex:1; background:${COLORS.neonPurple}; border:none; color:#fff; padding:11px; border-radius:5px; font-family:${FONTS.sans}; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 100ms; }
  .aim-submit:hover { opacity:0.85; }
`

async function searchYahoo(q) {
  try {
    const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(q)}&limit=8&exchange=NASDAQ,NYSE,EURONEXT,LSE,XETRA`,{signal:AbortSignal.timeout(6000)})
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)&&data.length>0) return data.slice(0,6).map(r=>({ticker:r.symbol,name:r.name||r.symbol,exchange:r.stockExchange||r.exchangeShortName||'',type:r.exchangeShortName==='ETF'?'etf':'stock',currency:r.currency||null}))
    }
  } catch {}
  try {
    const res = await fetch(`/yahoo-search/v1/finance/search?q=${encodeURIComponent(q)}&lang=en&region=US&quotesCount=8&newsCount=0`,{signal:AbortSignal.timeout(5000)})
    if (res.ok) {
      const data = await res.json()
      if (data.quotes?.length) return data.quotes.filter(q=>['EQUITY','ETF','MUTUALFUND'].includes(q.quoteType)).slice(0,6).map(q=>({ticker:q.symbol,name:q.longname||q.shortname||q.symbol,exchange:q.exchDisp||q.exchange||'',type:q.quoteType==='ETF'?'etf':'stock',currency:q.currency||null}))
    }
  } catch {}
  return []
}

function guessCurrency(ticker) {
  if (!ticker) return 'EUR'
  const t = ticker.toUpperCase()
  if (t.endsWith('.L')||t.endsWith('.LON')) return 'GBP'
  if (!t.includes('.')) return 'USD'
  return 'EUR'
}

export default function AddInvestmentModal({ onAdd, onClose }) {
  const [form, setForm]             = useState({type:'etf',name:'',ticker:''})
  const [inputCurrency, setInputCurrency] = useState('EUR')
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]         = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [manualMode, setManualMode]       = useState(false)
  const [resultPrices, setResultPrices]   = useState({})
  const [error, setError]                 = useState('')
  const debounceRef = useRef(null)

  const set    = (k,v) => setForm(f=>({...f,[k]:v}))
  const hasQty = !['efectiu','robo'].includes(form.type)

  const handleSearch = useCallback((val) => {
    setSearchQuery(val)
    setSelectedResult(null)
    setResultPrices({})
    clearTimeout(debounceRef.current)
    if (!val.trim()||val.length<2) { setSearchResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchYahoo(val)
        setSearchResults(results)
        results.forEach(async r => {
          try {
            const res = await fetch(`/yahoo/v8/finance/chart/${r.ticker}?interval=1d&range=1d`,{signal:AbortSignal.timeout(5000)})
            if (!res.ok) return
            const d = await res.json()
            const meta = d?.chart?.result?.[0]?.meta
            let price = meta?.regularMarketPrice
            const curr = meta?.currency==='GBp'?'GBP':(meta?.currency||r.currency||'EUR')
            if (curr==='GBp'&&price) price=price*0.01
            if (price&&price>0) setResultPrices(prev=>({...prev,[r.ticker]:{price:+price.toFixed(4),currency:curr}}))
          } catch {}
        })
      } catch { setSearchResults([]) }
      setSearching(false)
    }, 400)
  }, [])

  const selectResult = r => {
    setSelectedResult(r)
    setForm(f=>({...f,name:r.name,ticker:r.ticker,type:r.type}))
    const curr = r.currency||guessCurrency(r.ticker)
    setInputCurrency(['USD','GBP'].includes(curr)?curr:'EUR')
    setSearchQuery('')
    setSearchResults([])
  }

  const clearSelection = () => { setSelectedResult(null); setInputCurrency('EUR'); setForm(f=>({...f,name:'',ticker:''})) }

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('Busca i selecciona un actiu, o introdueix el nom manualment')
    setError('')
    onAdd({name:form.name.trim(),ticker:form.ticker.trim().toUpperCase(),type:form.type,currency:inputCurrency})
  }

  const CURR_SYM = {EUR:'€',USD:'$',GBP:'£'}

  return (
    <>
      <style>{`${SHARED_STYLES}${modalStyles}`}</style>
      <div className="aim-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="aim-modal">
          <div className="aim-handle"/>
          <div className="aim-hdr">
            <h3 className="aim-title">Nova posició</h3>
            <button className="aim-close" onClick={onClose}>×</button>
          </div>

          {/* Tipus */}
          <div className="aim-tgrid">
            {TYPE_OPTIONS.map(t => {
              const isSelected = form.type===t.value
              const tc = TYPE_COLORS[t.value]||TYPE_COLORS.etf
              return (
                <button key={t.value} className={`aim-tbtn${isSelected?' sel':''}`}
                  style={isSelected?{background:tc.bg,borderColor:tc.border}:{}} onClick={()=>set('type',t.value)}>
                  <div className="aim-tav" style={{background:isSelected?tc.bg:COLORS.elevated,color:isSelected?tc.color:COLORS.textMuted}}>{t.short}</div>
                  <span className="aim-tlbl">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cercador */}
          {hasQty && !manualMode && (
            <>
              {selectedResult ? (
                <div className="aim-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonGreen} strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div className="aim-chip-info">
                    <p className="aim-chip-name">{selectedResult.name}</p>
                    <p className="aim-chip-meta">{selectedResult.ticker} · {selectedResult.exchange}{inputCurrency!=='EUR'&&<span style={{marginLeft:6,color:COLORS.neonAmber}}>· {inputCurrency}</span>}</p>
                  </div>
                  <button className="aim-chip-clear" onClick={clearSelection}>×</button>
                </div>
              ) : (
                <>
                  <div className="aim-search-wrap">
                    <svg className="aim-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input className="aim-search-inp" value={searchQuery} onChange={e=>handleSearch(e.target.value)} placeholder="Busca per nom o ticker…" autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}/>
                    {searching && <div className="aim-search-spin"/>}
                  </div>
                  {searchResults.length>0 && (
                    <div className="aim-results">
                      {searchResults.map(r => {
                        const curr = r.currency||guessCurrency(r.ticker)
                        const pd = resultPrices[r.ticker]
                        const sym = pd?.currency==='USD'?'$':pd?.currency==='GBP'?'£':'€'
                        return (
                          <div key={r.ticker} className="aim-result" onClick={()=>selectResult(r)}>
                            <div className="aim-result-av">{r.ticker.slice(0,3)}</div>
                            <div className="aim-result-info">
                              <p className="aim-result-name">{r.name}</p>
                              <p className="aim-result-meta">{r.ticker} · {r.exchange}</p>
                            </div>
                            {pd ? <span className="aim-result-price">{sym}{pd.price.toLocaleString('ca-ES',{minimumFractionDigits:2,maximumFractionDigits:pd.price<10?4:2})}</span>
                                : <span className="aim-result-price loading">···</span>}
                            <span className={`aim-result-curr ${curr.toLowerCase()}`}>{curr}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {searchQuery.length>=2&&!searching&&searchResults.length===0 && (
                    <div className="aim-results"><div className="aim-no-results">Cap resultat per "{searchQuery}"</div></div>
                  )}
                </>
              )}
              <p className="aim-manual-link" onClick={()=>setManualMode(true)}>Introduir manualment sense cercador</p>
            </>
          )}

          {(manualMode||!hasQty) && (
            <div className="aim-space">
              <div>
                <label className="aim-lbl">Nom</label>
                <input className="aim-inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ex: Revolut Robo Advisor..." autoFocus={!hasQty}/>
              </div>
              {hasQty && (
                <div>
                  <label className="aim-lbl">Ticker Yahoo Finance</label>
                  <input className="aim-inp mono" value={form.ticker} onChange={e=>{const t=e.target.value.toUpperCase();set('ticker',t);setInputCurrency(guessCurrency(t))}} placeholder="EUNL.DE, AAPL..."/>
                </div>
              )}
              {manualMode && <p className="aim-manual-link" onClick={()=>{setManualMode(false);clearSelection()}}>← Tornar al cercador</p>}
            </div>
          )}

          {hasQty && selectedResult && (
            <div className="aim-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonCyan} strokeWidth="1.8" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="aim-hint-text">Un cop creada la posició, afegeix les teves compres amb el botó <strong style={{color:COLORS.neonGreen}}>Comprar</strong> per registrar quantitat, preu i data exactes.</span>
            </div>
          )}

          {error && <p className="aim-error">{error}</p>}

          <div className="aim-footer">
            <button className="aim-cancel" onClick={onClose}>Cancel·lar</button>
            <button className="aim-submit" onClick={handleSubmit}>Crear posició</button>
          </div>
        </div>
      </div>
    </>
  )
}