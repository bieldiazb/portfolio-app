import { useState, useCallback, useRef, useEffect } from 'react'
import { SHARED_STYLES, TYPE_COLORS } from './design-tokens'

const TYPE_OPTIONS = [
  { value: 'etf',     label: 'ETF',     short: 'ETF' },
  { value: 'stock',   label: 'Acció',   short: 'ACC' },
  { value: 'robo',    label: 'Robo',    short: 'ROB' },
  { value: 'efectiu', label: 'Efectiu', short: 'EFE' },
]

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£' }

const modalStyles = `
  .aim2-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82); backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
  @media (min-width: 640px) { .aim2-overlay { align-items: center; padding: 1rem; } }
  .aim2-modal { font-family: 'Geist', sans-serif; background: #0f0f0f; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px 12px 0 0; width: 100%; padding: 22px; max-height: 92vh; overflow-y: auto; }
  @media (min-width: 640px) { .aim2-modal { max-width: 420px; border-radius: 10px; } }

  .aim2-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .aim2-title { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .aim2-close { width: 24px; height: 24px; border-radius: 4px; background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.38); font-size: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-family: inherit; line-height: 1; }

  .aim2-tgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 18px; }
  .aim2-tbtn { display: flex; flex-direction: column; align-items: center; padding: 8px 3px 7px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); cursor: pointer; gap: 4px; transition: all 100ms; font-family: 'Geist', sans-serif; }
  .aim2-tav { width: 26px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; }
  .aim2-tlbl { font-size: 9px; color: rgba(255,255,255,0.30); text-align: center; }
  .aim2-tbtn.sel .aim2-tlbl { color: rgba(255,255,255,0.55); }

  .aim2-search-wrap { position: relative; margin-bottom: 14px; }
  .aim2-search-inp { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); border-radius: 7px; padding: 10px 36px 10px 38px; font-family: 'Geist', sans-serif; font-size: 16px; color: rgba(255,255,255,0.82); outline: none; transition: border-color 100ms; box-sizing: border-box; touch-action: manipulation; }
  .aim2-search-inp:focus { border-color: rgba(255,255,255,0.24); }
  .aim2-search-inp::placeholder { color: rgba(255,255,255,0.22); }
  .aim2-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.28); pointer-events: none; }
  .aim2-search-spin { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); width: 13px; height: 13px; border: 1.5px solid rgba(255,255,255,0.12); border-top-color: rgba(255,255,255,0.55); border-radius: 50%; animation: aim2spin .7s linear infinite; }
  @keyframes aim2spin { to { transform: translateY(-50%) rotate(360deg); } }

  .aim2-results { border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; overflow: hidden; margin-bottom: 14px; }
  .aim2-result { display: flex; align-items: center; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 80ms; gap: 10px; -webkit-tap-highlight-color: transparent; }
  .aim2-result:last-child { border-bottom: none; }
  .aim2-result:hover, .aim2-result:active { background: rgba(255,255,255,0.05); }
  .aim2-result-av { width: 28px; height: 28px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; flex-shrink: 0; background: rgba(60,130,255,0.12); color: rgba(100,160,255,0.85); }
  .aim2-result-info { flex: 1; min-width: 0; }
  .aim2-result-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .aim2-result-meta { font-size: 10px; color: rgba(255,255,255,0.30); margin-top: 1px; font-family: 'Geist Mono', monospace; }
  .aim2-result-curr { font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
  .aim2-result-curr.usd { background: rgba(255,170,50,0.12); color: rgba(255,170,60,0.80); }
  .aim2-result-curr.gbp { background: rgba(100,200,100,0.12); color: rgba(100,210,100,0.80); }
  .aim2-result-curr.eur { background: rgba(100,155,255,0.12); color: rgba(100,160,255,0.75); }
  .aim2-no-results { padding: 16px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.24); }
  .aim2-result-price { font-size: 11px; font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.55); text-align: right; flex-shrink: 0; min-width: 52px; letter-spacing: -0.3px; }
  .aim2-result-price.loading { color: rgba(255,255,255,0.16); letter-spacing: 2px; }

  .aim2-chip { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: rgba(80,210,110,0.06); border: 1px solid rgba(80,210,110,0.18); border-radius: 7px; margin-bottom: 14px; }
  .aim2-chip-info { flex: 1; min-width: 0; }
  .aim2-chip-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .aim2-chip-ticker { font-size: 10px; color: rgba(80,210,110,0.70); font-family: 'Geist Mono', monospace; margin-top: 1px; }
  .aim2-chip-clear { width: 22px; height: 22px; border-radius: 4px; background: rgba(255,255,255,0.06); border: none; color: rgba(255,255,255,0.36); font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; font-family: inherit; }

  .aim2-manual-toggle { font-size: 11px; color: rgba(255,255,255,0.28); text-align: center; margin-bottom: 12px; cursor: pointer; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.14); -webkit-tap-highlight-color: transparent; }

  .aim2-space { display: flex; flex-direction: column; gap: 11px; }
  .aim2-lbl { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }

  /* Input amb prefix de moneda */
  .aim2-inp-wrap { position: relative; }
  .aim2-inp-prefix { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); font-family: 'Geist Mono', monospace; font-size: 13px; color: rgba(255,255,255,0.35); pointer-events: none; }
  .aim2-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 9px 11px; font-family: 'Geist', sans-serif; font-size: 16px; color: rgba(255,255,255,0.82); outline: none; transition: border-color 100ms; box-sizing: border-box; touch-action: manipulation; }
  .aim2-inp:focus { border-color: rgba(255,255,255,0.22); }
  .aim2-inp::placeholder { color: rgba(255,255,255,0.18); }
  .aim2-inp.mono { font-family: 'Geist Mono', monospace; text-align: right; }
  .aim2-inp.with-prefix { padding-left: 26px; }
  .aim2-inp.date { font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.55); }
  .aim2-inp.date::-webkit-calendar-picker-indicator { filter: invert(0.4); }
  .aim2-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .aim2-error { font-size: 11px; color: rgba(255,90,70,0.80); background: rgba(255,60,40,0.08); border: 1px solid rgba(255,60,40,0.14); border-radius: 5px; padding: 8px 11px; }

  /* Conversió EUR */
  .aim2-conv { font-size: 10px; color: rgba(255,255,255,0.28); font-family: 'Geist Mono', monospace; margin-top: 4px; text-align: right; }
  .aim2-conv span { color: rgba(255,255,255,0.48); }

  /* Rate badge */
  .aim2-rate { display: flex; align-items: center; gap: 6px; font-size: 10px; color: rgba(255,255,255,0.28); padding: 6px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; }
  .aim2-rate-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(80,210,110,0.70); flex-shrink: 0; }
  .aim2-rate-val { font-family: 'Geist Mono', monospace; color: rgba(255,255,255,0.45); }

  .aim2-footer { display: flex; gap: 8px; margin-top: 18px; }
  .aim2-cancel { flex: 1; border: 1px solid rgba(255,255,255,0.07); background: transparent; color: rgba(255,255,255,0.34); padding: 11px; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 13px; cursor: pointer; }
  .aim2-submit { flex: 1; background: rgba(255,255,255,0.92); border: none; color: #080808; padding: 11px; border-radius: 5px; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
  .aim2-submit:hover { background: #fff; }
`

// ── Yahoo Finance via proxy ────────────────────────────────────────────────────
// Cerca d'actius via múltiples APIs públiques sense autenticació
async function searchYahoo(q) {
  // 1. Open Figi / Financial Modeling Prep — gratuït, sense API key, sense CORS
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(q)}&limit=8&exchange=NASDAQ,NYSE,EURONEXT,LSE,XETRA`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, 6).map(r => ({
          ticker:   r.symbol,
          name:     r.name || r.symbol,
          exchange: r.stockExchange || r.exchangeShortName || '',
          type:     r.symbol?.endsWith('.L') || r.exchangeShortName === 'ETF' ? 'etf' : 'stock',
          currency: r.currency || null,
        }))
      }
    }
  } catch {}

  // 2. Yahoo Finance via proxy Vite/Netlify (pot fallar per restriccions de Yahoo)
  try {
    const res = await fetch(
      `/yahoo-search/v1/finance/search?q=${encodeURIComponent(q)}&lang=en&region=US&quotesCount=8&newsCount=0`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.quotes?.length) {
        return data.quotes
          .filter(q => ['EQUITY', 'ETF', 'MUTUALFUND'].includes(q.quoteType))
          .slice(0, 6)
          .map(q => ({
            ticker:   q.symbol,
            name:     q.longname || q.shortname || q.symbol,
            exchange: q.exchDisp || q.exchange || '',
            type:     q.quoteType === 'ETF' ? 'etf' : 'stock',
            currency: q.currency || null,
          }))
      }
    }
  } catch {}

  return []
}

async function fetchExchangeRate(from, to) {
  try {
    const res  = await fetch(`/yahoo/v8/finance/chart/${from}${to}=X?interval=1d&range=1d`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || null
  } catch { return null }
}

// Detecta moneda a partir del ticker (heurística)
function guessCurrency(ticker) {
  if (!ticker) return 'EUR'
  const t = ticker.toUpperCase()
  if (t.endsWith('.L') || t.endsWith('.LON')) return 'GBP'
  if (!t.includes('.')) return 'USD'  // sense extensió = NYSE/NASDAQ → USD
  return 'EUR'
}

export default function AddInvestmentModal({ onAdd, onClose }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    type: 'etf', name: '', ticker: '', qty: '', initialValue: '', purchaseDate: today,
  })
  const [inputCurrency, setInputCurrency] = useState('EUR') // moneda en la que l'usuari introdueix el cost
  const [exchangeRate, setExchangeRate]   = useState(null)  // taxa de canvi a EUR
  const [loadingRate, setLoadingRate]     = useState(false)

  const [searchQuery, setSearchQuery]       = useState('')
  const [searchResults, setSearchResults]   = useState([])
  const [searching, setSearching]           = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [manualMode, setManualMode]         = useState(false)
  const [error, setError]                   = useState('')
  const debounceRef = useRef(null)

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const hasQty = !['efectiu', 'robo'].includes(form.type)

  // Quan canvia la moneda d'entrada, obté la taxa de canvi
  useEffect(() => {
    if (inputCurrency === 'EUR') { setExchangeRate(1); return }
    setLoadingRate(true)
    fetchExchangeRate(inputCurrency, 'EUR').then(rate => {
      setExchangeRate(rate || (inputCurrency === 'USD' ? 0.92 : 1.17))
      setLoadingRate(false)
    })
  }, [inputCurrency])

  // Calcula el cost en EUR
  const costInOriginal = parseFloat(form.initialValue) || 0
  const costInEur = inputCurrency === 'EUR' ? costInOriginal : +(costInOriginal * (exchangeRate || 1)).toFixed(2)

  const [resultPrices, setResultPrices] = useState({}) // { ticker: { price, currency } }

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
        // Obté preus en paral·lel per tots els resultats
        results.forEach(async r => {
          try {
            const res = await fetch(
              `/yahoo/v8/finance/chart/${r.ticker}?interval=1d&range=1d`,
              { signal: AbortSignal.timeout(5000) }
            )
            if (!res.ok) return
            const d = await res.json()
            const meta = d?.chart?.result?.[0]?.meta
            let price = meta?.regularMarketPrice
            const curr = meta?.currency === 'GBp' ? 'GBP' : (meta?.currency || r.currency || 'EUR')
            if (curr === 'GBp' && price) price = price * 0.01
            if (price && price > 0) {
              setResultPrices(prev => ({ ...prev, [r.ticker]: { price: +price.toFixed(4), currency: curr } }))
            }
          } catch {}
        })
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    }, 400)
  }, [])

  const selectResult = (r) => {
    setSelectedResult(r)
    setForm(f => ({ ...f, name: r.name, ticker: r.ticker, type: r.type }))
    // Auto-detecta moneda a partir del ticker o del camp currency de Yahoo
    const curr = r.currency || guessCurrency(r.ticker)
    setInputCurrency(['USD', 'GBP'].includes(curr) ? curr : 'EUR')
    setSearchQuery('')
    setSearchResults([])
  }

  const clearSelection = () => {
    setSelectedResult(null)
    setInputCurrency('EUR')
    setForm(f => ({ ...f, name: '', ticker: '' }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('Busca i selecciona un actiu, o introdueix el nom manualment')
    setError('')
    onAdd({
      name:     form.name.trim(),
      ticker:   form.ticker.trim().toUpperCase(),
      type:     form.type,
      currency: inputCurrency,
    })
  }

  const sym = CURRENCY_SYMBOLS[inputCurrency] || inputCurrency

  return (
    <>
      <style>{`${SHARED_STYLES}${modalStyles}`}</style>
      <div className="aim2-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="aim2-modal">

          <div className="aim2-hdr">
            <h3 className="aim2-title">Nova posició</h3>
            <button className="aim2-close" onClick={onClose}>×</button>
          </div>

          {/* Tipus */}
          <div className="aim2-tgrid">
            {TYPE_OPTIONS.map(t => {
              const isSelected = form.type === t.value
              const color = TYPE_COLORS[t.value] || TYPE_COLORS.etf
              return (
                <button key={t.value}
                  className={`aim2-tbtn${isSelected ? ' sel' : ''}`}
                  style={isSelected ? { background: color.bg, borderColor: color.color.replace('0.85', '0.30') } : {}}
                  onClick={() => set('type', t.value)}
                >
                  <div className="aim2-tav" style={{
                    background: isSelected ? color.bg : 'rgba(255,255,255,0.06)',
                    color: isSelected ? color.color : 'rgba(255,255,255,0.28)',
                  }}>{t.short}</div>
                  <span className="aim2-tlbl">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cercador */}
          {hasQty && !manualMode && (
            <>
              {selectedResult ? (
                <div className="aim2-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(80,210,110,0.75)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div className="aim2-chip-info">
                    <p className="aim2-chip-name">{selectedResult.name}</p>
                    <p className="aim2-chip-ticker">
                      {selectedResult.ticker} · {selectedResult.exchange}
                      {inputCurrency !== 'EUR' && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,170,60,0.75)' }}>· cotitza en {inputCurrency}</span>
                      )}
                    </p>
                  </div>
                  <button className="aim2-chip-clear" onClick={clearSelection}>×</button>
                </div>
              ) : (
                <>
                  <div className="aim2-search-wrap">
                    <svg className="aim2-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      className="aim2-search-inp"
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="Busca per nom o ticker… (AAPL, MSCI…)"
                      autoFocus
                      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                    />
                    {searching && <div className="aim2-search-spin" />}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="aim2-results">
                      {searchResults.map(r => {
                        const curr = r.currency || guessCurrency(r.ticker)
                        const currClass = curr === 'USD' ? 'usd' : curr === 'GBP' ? 'gbp' : 'eur'
                        return (
                          <div key={r.ticker} className="aim2-result" onClick={() => selectResult(r)}>
                            <div className="aim2-result-av">{r.ticker.slice(0, 3)}</div>
                            <div className="aim2-result-info">
                              <p className="aim2-result-name">{r.name}</p>
                              <p className="aim2-result-meta">{r.ticker} · {r.exchange}</p>
                            </div>
                            {(() => {
                              const pd = resultPrices[r.ticker]
                              const sym = pd?.currency === 'USD' ? '$' : pd?.currency === 'GBP' ? '£' : '€'
                              return pd
                                ? <span className="aim2-result-price">{sym}{pd.price.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: pd.price < 10 ? 4 : 2 })}</span>
                                : <span className="aim2-result-price loading">···</span>
                            })()}
                            <span className={`aim2-result-curr ${currClass}`}>{curr}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="aim2-results">
                      <div className="aim2-no-results">Cap resultat per "{searchQuery}"</div>
                    </div>
                  )}
                </>
              )}
              <p className="aim2-manual-toggle" onClick={() => setManualMode(true)}>
                Introduir manualment sense cercador
              </p>
            </>
          )}

          {/* Camps manuals */}
          {(manualMode || !hasQty) && (
            <div className="aim2-space" style={{ marginBottom: 14 }}>
              <div>
                <label className="aim2-lbl">Nom</label>
                <input className="aim2-inp" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="ex: Revolut Robo Advisor..." autoFocus={!hasQty} />
              </div>
              {hasQty && (
                <div>
                  <label className="aim2-lbl">Ticker Yahoo Finance</label>
                  <input className="aim2-inp mono" value={form.ticker}
                    onChange={e => {
                      const t = e.target.value.toUpperCase()
                      set('ticker', t)
                      setInputCurrency(guessCurrency(t))
                    }}
                    placeholder="EUNL.DE, AAPL..." />
                </div>
              )}
              {manualMode && (
                <p className="aim2-manual-toggle" onClick={() => { setManualMode(false); clearSelection() }}>
                  ← Tornar al cercador
                </p>
              )}
            </div>
          )}

          {/* Info extra: hint que cal afegir compra després */}
          {hasQty && selectedResult && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', background: 'rgba(100,155,255,0.06)', border: '1px solid rgba(100,155,255,0.14)', borderRadius: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(100,155,255,0.70)" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', lineHeight: 1.5 }}>
                Un cop creada la posició, afegeix les teves compres amb el botó <strong style={{ color: 'rgba(80,210,110,0.70)' }}>Comprar</strong> per registrar quantitat, preu i data exactes.
              </span>
            </div>
          )}

          {error && <p className="aim2-error">{error}</p>}

          <div className="aim2-footer">
            <button className="aim2-cancel" onClick={onClose}>Cancel·lar</button>
            <button className="aim2-submit" onClick={handleSubmit}>Crear posició</button>
          </div>
        </div>
      </div>
    </>
  )
}