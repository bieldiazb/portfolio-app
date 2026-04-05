import { useState, useCallback, useRef } from 'react'
import { SHARED_STYLES, COLORS, FONTS, TYPE_COLORS } from './design-tokens'

const TYPE_OPTIONS = [
  { value:'etf',     label:'ETF',     short:'ETF', emoji:'📊' },
  { value:'stock',   label:'Acció',   short:'ACC', emoji:'📈' },
  { value:'robo',    label:'Robo',    short:'ROB', emoji:'🤖' },
  { value:'efectiu', label:'Efectiu', short:'EFE', emoji:'💶' },
]

const modalStyles = `
  .aim-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.82);
    display: flex; align-items: flex-end; justify-content: center;
    z-index: 50;
    backdrop-filter: blur(6px);
    animation: aimFade 150ms ease;
  }
  @keyframes aimFade { from { opacity:0 } to { opacity:1 } }
  @media (min-width: 640px) { .aim-overlay { align-items: center; padding: 16px; } }

  .aim-modal {
    font-family: ${FONTS.sans};
    background: #131313;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 16px 16px 0 0;
    width: 100%; padding: 20px 16px 36px;
    max-height: 92dvh; overflow-y: auto;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.70);
    animation: aimSlide 220ms cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes aimSlide {
    from { transform: translateY(24px); opacity:0 }
    to   { transform: translateY(0);    opacity:1 }
  }
  @media (min-width: 640px) {
    .aim-modal { border-radius: 14px; max-width: 440px; padding: 24px 22px 28px; }
  }

  .aim-drag {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(255,255,255,0.10);
    margin: 0 auto 18px; display: block;
  }
  @media (min-width: 640px) { .aim-drag { display: none; } }

  .aim-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .aim-title { font-size:16px; font-weight:600; color:#fff; letter-spacing:-0.3px; }
  .aim-close {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.40); font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 100ms;
  }
  .aim-close:hover { color: rgba(255,255,255,0.80); border-color: rgba(255,255,255,0.18); }

  /* Tipus — 4 botons grid */
  .aim-tgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:20px; }
  .aim-tbtn {
    display: flex; flex-direction: column; align-items: center;
    padding: 12px 4px 10px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.03);
    cursor: pointer; gap: 6px; transition: all 100ms;
    font-family: ${FONTS.sans}; -webkit-tap-highlight-color: transparent;
  }
  .aim-tbtn:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); }
  .aim-tbtn.sel { border-color: rgba(0,255,136,0.28); background: rgba(0,255,136,0.07); }
  .aim-tav {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; font-family: ${FONTS.mono};
  }
  .aim-tlbl { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.40); }
  .aim-tbtn.sel .aim-tlbl { color: ${COLORS.neonGreen}; }

  /* Search */
  .aim-search-wrap { position: relative; margin-bottom: 8px; }
  .aim-search-inp {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px; padding: 11px 36px 11px 38px;
    font-family: ${FONTS.sans}; font-size: 15px;
    color: #fff; outline: none; transition: border-color 120ms;
    box-sizing: border-box; -webkit-appearance: none;
  }
  .aim-search-inp:focus { border-color: rgba(0,255,136,0.35); }
  .aim-search-inp::placeholder { color: rgba(255,255,255,0.20); }
  .aim-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.25); pointer-events: none; }
  .aim-search-spin {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    width: 13px; height: 13px;
    border: 1.5px solid rgba(255,255,255,0.08);
    border-top-color: ${COLORS.neonGreen};
    border-radius: 50%; animation: aimspin .7s linear infinite;
  }
  @keyframes aimspin { to { transform: translateY(-50%) rotate(360deg); } }

  /* Results */
  .aim-results {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; overflow: hidden; margin-bottom: 8px;
  }
  .aim-result {
    display: flex; align-items: center; padding: 11px 12px;
    cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 80ms; gap: 10px;
    -webkit-tap-highlight-color: transparent;
  }
  .aim-result:last-child { border-bottom: none; }
  .aim-result:hover { background: rgba(255,255,255,0.04); }
  .aim-result:active { background: rgba(0,255,136,0.05); }
  .aim-result-av {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; flex-shrink: 0; font-family: ${FONTS.mono};
    background: rgba(0,212,255,0.10); color: ${COLORS.neonCyan};
  }
  .aim-result-info { flex: 1; min-width: 0; }
  .aim-result-name { font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .aim-result-meta { font-size: 10px; color: rgba(255,255,255,0.30); font-family: ${FONTS.mono}; }
  .aim-result-curr {
    font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 20px;
    flex-shrink: 0; font-family: ${FONTS.mono};
  }
  .aim-result-curr.usd { color: ${COLORS.neonAmber}; background: rgba(255,149,0,0.10); }
  .aim-result-curr.gbp { color: ${COLORS.neonGreen}; background: rgba(0,255,136,0.10); }
  .aim-result-curr.eur { color: ${COLORS.neonCyan}; background: rgba(0,212,255,0.10); }
  .aim-result-price { font-size: 12px; font-family: ${FONTS.mono}; color: rgba(255,255,255,0.55); text-align: right; flex-shrink: 0; min-width: 52px; }
  .aim-result-price.loading { color: rgba(255,255,255,0.20); letter-spacing: 2px; }
  .aim-no-results { padding: 16px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.25); }

  /* Chip actiu seleccionat */
  .aim-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    background: rgba(0,255,136,0.07);
    border: 1px solid rgba(0,255,136,0.22);
    border-radius: 10px; margin-bottom: 10px;
  }
  .aim-chip-info { flex: 1; min-width: 0; }
  .aim-chip-name { font-size: 14px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .aim-chip-meta { font-size: 11px; color: ${COLORS.neonGreen}; font-family: ${FONTS.mono}; }
  .aim-chip-clear {
    width: 24px; height: 24px; border-radius: 6px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.40); font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 100ms; flex-shrink: 0;
  }
  .aim-chip-clear:hover { color: ${COLORS.neonRed}; border-color: rgba(255,59,59,0.25); }

  .aim-manual-link {
    font-size: 11px; color: rgba(255,255,255,0.25); text-align: center;
    margin-bottom: 12px; cursor: pointer; text-decoration: underline;
    text-decoration-color: rgba(255,255,255,0.10); transition: color 100ms;
  }
  .aim-manual-link:hover { color: rgba(255,255,255,0.55); }

  /* Camps manuals */
  .aim-space { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }
  .aim-lbl {
    display: block; font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.28); text-transform: uppercase;
    letter-spacing: 0.12em; margin-bottom: 6px;
  }
  .aim-inp {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
    padding: 11px 13px; font-family: ${FONTS.sans}; font-size: 15px;
    color: #fff; outline: none; transition: border-color 120ms;
    box-sizing: border-box; -webkit-appearance: none;
  }
  .aim-inp:focus { border-color: rgba(0,255,136,0.35); }
  .aim-inp::placeholder { color: rgba(255,255,255,0.20); }
  .aim-inp.mono { font-family: ${FONTS.mono}; }

  /* Hint info */
  .aim-hint {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 11px 13px;
    background: rgba(0,212,255,0.06);
    border: 1px solid rgba(0,212,255,0.15);
    border-radius: 10px; margin-bottom: 4px;
  }
  .aim-hint-text { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.65; }

  .aim-error {
    font-size: 12px; color: ${COLORS.neonRed};
    background: rgba(255,59,59,0.08);
    border: 1px solid rgba(255,59,59,0.20);
    border-radius: 8px; padding: 10px 13px; margin-bottom: 4px;
  }

  /* Footer */
  .aim-footer { display: flex; gap: 8px; margin-top: 20px; }
  .aim-cancel {
    flex: 1; padding: 13px;
    border: 1px solid rgba(255,255,255,0.09);
    background: transparent; border-radius: 10px;
    font-family: ${FONTS.sans}; font-size: 14px;
    color: rgba(255,255,255,0.45); cursor: pointer; transition: all 100ms;
  }
  .aim-cancel:hover { border-color: rgba(255,255,255,0.18); color: rgba(255,255,255,0.80); }
  .aim-submit {
    flex: 1; background: ${COLORS.neonGreen}; border: none;
    color: #000; padding: 13px; border-radius: 10px;
    font-family: ${FONTS.sans}; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: opacity 100ms;
  }
  .aim-submit:hover { opacity: 0.85; }
  .aim-submit:active { opacity: 0.75; transform: scale(0.99); }
`

async function searchYahoo(q) {
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(q)}&limit=8&exchange=NASDAQ,NYSE,EURONEXT,LSE,XETRA`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0)
        return data.slice(0,6).map(r => ({
          ticker: r.symbol, name: r.name||r.symbol,
          exchange: r.stockExchange||r.exchangeShortName||'',
          type: r.exchangeShortName==='ETF'?'etf':'stock',
          currency: r.currency||null,
        }))
    }
  } catch {}
  try {
    const res = await fetch(
      `/yahoo-search/v1/finance/search?q=${encodeURIComponent(q)}&lang=en&region=US&quotesCount=8&newsCount=0`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.quotes?.length)
        return data.quotes
          .filter(q => ['EQUITY','ETF','MUTUALFUND'].includes(q.quoteType))
          .slice(0,6)
          .map(q => ({
            ticker: q.symbol, name: q.longname||q.shortname||q.symbol,
            exchange: q.exchDisp||q.exchange||'',
            type: q.quoteType==='ETF'?'etf':'stock', currency: q.currency||null,
          }))
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
  const [form, setForm]                   = useState({ type:'etf', name:'', ticker:'' })
  const [inputCurrency, setInputCurrency] = useState('EUR')
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]         = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [manualMode, setManualMode]       = useState(false)
  const [resultPrices, setResultPrices]   = useState({})
  const [error, setError]                 = useState('')
  const debounceRef = useRef(null)

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hasQty = !['efectiu','robo'].includes(form.type)

  const handleSearch = useCallback((val) => {
    setSearchQuery(val)
    setSelectedResult(null)
    setResultPrices({})
    clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 2) { setSearchResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchYahoo(val)
        setSearchResults(results)
        results.forEach(async r => {
          try {
            const res = await fetch(
              `/yahoo/v8/finance/chart/${r.ticker}?interval=1d&range=1d`,
              { signal: AbortSignal.timeout(5000) }
            )
            if (!res.ok) return
            const d    = await res.json()
            const meta = d?.chart?.result?.[0]?.meta
            let price  = meta?.regularMarketPrice
            const curr = meta?.currency==='GBp'?'GBP':(meta?.currency||r.currency||'EUR')
            if (curr==='GBp' && price) price = price * 0.01
            if (price && price > 0)
              setResultPrices(prev => ({ ...prev, [r.ticker]: { price: +price.toFixed(4), currency: curr } }))
          } catch {}
        })
      } catch { setSearchResults([]) }
      setSearching(false)
    }, 400)
  }, [])

  const selectResult = r => {
    setSelectedResult(r)
    setForm(f => ({ ...f, name: r.name, ticker: r.ticker, type: r.type }))
    const curr = r.currency || guessCurrency(r.ticker)
    setInputCurrency(['USD','GBP'].includes(curr) ? curr : 'EUR')
    setSearchQuery(''); setSearchResults([])
  }

  const clearSelection = () => {
    setSelectedResult(null); setInputCurrency('EUR')
    setForm(f => ({ ...f, name:'', ticker:'' }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('Busca i selecciona un actiu, o introdueix el nom manualment')
    setError('')
    onAdd({ name: form.name.trim(), ticker: form.ticker.trim().toUpperCase(), type: form.type, currency: inputCurrency })
  }

  return (
    <>
      <style>{`${SHARED_STYLES}${modalStyles}`}</style>
      <div className="aim-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
        <div className="aim-modal">
          <div className="aim-drag"/>
          <div className="aim-hdr">
            <h3 className="aim-title">Nova posició</h3>
            <button className="aim-close" onClick={onClose}>×</button>
          </div>

          {/* Tipus */}
          <div className="aim-tgrid">
            {TYPE_OPTIONS.map(t => {
              const isSel = form.type === t.value
              const tc    = TYPE_COLORS[t.value] || TYPE_COLORS.etf
              return (
                <button key={t.value}
                  className={`aim-tbtn${isSel?' sel':''}`}
                  style={isSel ? { background:`${tc.bg}`, borderColor:tc.border } : {}}
                  onClick={() => set('type', t.value)}
                >
                  <div className="aim-tav"
                    style={{ background: isSel?tc.bg:'rgba(255,255,255,0.04)', color: isSel?tc.color:'rgba(255,255,255,0.30)' }}>
                    {t.short}
                  </div>
                  <span className="aim-tlbl" style={isSel?{color:tc.color}:{}}>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cercador */}
          {hasQty && !manualMode && (
            <>
              {selectedResult ? (
                <div className="aim-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonGreen} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div className="aim-chip-info">
                    <p className="aim-chip-name">{selectedResult.name}</p>
                    <p className="aim-chip-meta">
                      {selectedResult.ticker} · {selectedResult.exchange}
                      {inputCurrency !== 'EUR' && <span style={{marginLeft:8,color:COLORS.neonAmber}}>· {inputCurrency}</span>}
                    </p>
                  </div>
                  <button className="aim-chip-clear" onClick={clearSelection}>×</button>
                </div>
              ) : (
                <>
                  <div className="aim-search-wrap">
                    <svg className="aim-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      className="aim-search-inp"
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="Busca per nom o ticker…"
                      autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    />
                    {searching && <div className="aim-search-spin"/>}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="aim-results">
                      {searchResults.map(r => {
                        const curr = r.currency || guessCurrency(r.ticker)
                        const pd   = resultPrices[r.ticker]
                        const sym  = pd?.currency==='USD'?'$':pd?.currency==='GBP'?'£':'€'
                        return (
                          <div key={r.ticker} className="aim-result" onClick={() => selectResult(r)}>
                            <div className="aim-result-av">{r.ticker.slice(0,3)}</div>
                            <div className="aim-result-info">
                              <p className="aim-result-name">{r.name}</p>
                              <p className="aim-result-meta">{r.ticker} · {r.exchange}</p>
                            </div>
                            {pd
                              ? <span className="aim-result-price">{sym}{pd.price.toLocaleString('ca-ES',{minimumFractionDigits:2,maximumFractionDigits:pd.price<10?4:2})}</span>
                              : <span className="aim-result-price loading">···</span>
                            }
                            <span className={`aim-result-curr ${curr.toLowerCase()}`}>{curr}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="aim-results">
                      <div className="aim-no-results">Cap resultat per "{searchQuery}"</div>
                    </div>
                  )}
                </>
              )}
              <p className="aim-manual-link" onClick={() => setManualMode(true)}>
                Introduir manualment sense cercador
              </p>
            </>
          )}

          {/* Mode manual */}
          {(manualMode || !hasQty) && (
            <div className="aim-space">
              <div>
                <label className="aim-lbl">Nom</label>
                <input className="aim-inp" value={form.name} onChange={e => set('name', e.target.value)} placeholder="ex: Revolut Robo Advisor..." autoFocus={!hasQty}/>
              </div>
              {hasQty && (
                <div>
                  <label className="aim-lbl">Ticker Yahoo Finance</label>
                  <input className="aim-inp mono" value={form.ticker}
                    onChange={e => { const t=e.target.value.toUpperCase(); set('ticker',t); setInputCurrency(guessCurrency(t)) }}
                    placeholder="EUNL.DE, AAPL..."/>
                </div>
              )}
              {manualMode && (
                <p className="aim-manual-link" onClick={() => { setManualMode(false); clearSelection() }}>
                  ← Tornar al cercador
                </p>
              )}
            </div>
          )}

          {/* Hint */}
          {hasQty && selectedResult && (
            <div className="aim-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.neonCyan} strokeWidth="1.8" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="aim-hint-text">
                Un cop creada la posició, afegeix les teves compres amb el botó{' '}
                <strong style={{color:COLORS.neonGreen}}>Comprar</strong>{' '}
                per registrar quantitat, preu i data exactes.
              </span>
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