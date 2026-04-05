// ─── utils/csvParsers.js ──────────────────────────────────────────────────────
// Parsers per cada broker. Retornen array de:
// { ticker, name, type, date, qty, pricePerUnit, totalCost, totalCostEur, currency, fxRate, action }

function parseCSVRows(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return { headers: [], rows: [] }
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map(h => h.replace(/['"]/g, '').trim().toLowerCase())
  const rows = lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.replace(/^["']|["']$/g, '').trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
    return obj
  })
  return { headers, rows }
}

function cleanNum(s) {
  if (!s) return 0
  // Treu prefix de moneda "EUR 111.27" → 111.27
  const cleaned = s.replace(/^[A-Z]{3}\s+/, '').replace(/[^0-9.,-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function extractCurrency(s) {
  if (!s) return null
  const m = s.match(/^([A-Z]{3})\s/)
  return m ? m[1] : null
}

function detectBroker(headers, firstRow) {
  const h = headers.join(',')
  if (h.includes('isin') && h.includes('product') && h.includes('degiro')) return 'degiro'
  if (h.includes('isin') && h.includes('product') && (h.includes('auto fx') || h.includes('exchange'))) return 'degiro'
  if (h.includes('financial instrument') && h.includes('trade date') && h.includes('quantity')) return 'ib'
  if (h.includes('actif') || h.includes('produit') || h.includes('cours')) return 'degiro'
  if (h.includes('ticker') && h.includes('type') && h.includes('quantity') && h.includes('price per share')) return 'revolut'
  if (h.includes('ticker') && h.includes('type') && h.includes('shares') && h.includes('amount')) return 'revolut'
  if (h.includes('type') && h.includes('instrument') && h.includes('shares') && h.includes('amount')) return 'traderepublic'
  if (h.includes('action') && h.includes('symbol') && h.includes('quantity') && h.includes('price')) return 'schwab'
  if (h.includes('date') && h.includes('symbol') && h.includes('action') && h.includes('quantity')) return 'fidelity'
  if (h.includes('symbol') || h.includes('ticker')) return 'generic'
  return 'generic'
}

// ── DEGIRO ────────────────────────────────────────────────────────────────────
function parseDEGIRO(rows) {
  const result = []
  rows.forEach(r => {
    const desc   = r['product'] || r['produit'] || r['actief'] || ''
    const isin   = r['isin'] || r['isin code'] || ''
    const date   = r['date'] || r['datum'] || ''
    const qty    = cleanNum(r['quantity'] || r['aantal'] || r['quantité'] || '0')
    const price  = cleanNum(r['price'] || r['koers'] || r['cours'] || '0')
    const value  = cleanNum(r['value'] || r['waarde'] || r['valeur'] || '0')
    const curr   = r['currency'] || r['munt'] || r['devise'] || 'EUR'
    const order  = (r['order type'] || r['type ordre'] || r['ordertype'] || '').toLowerCase()

    if (!desc || qty === 0) return
    const isBuy = order.includes('buy') || order.includes('koop') || order.includes('achat') || value < 0
    const netCost = Math.abs(price * qty)
    result.push({
      name: desc.split('/')[0].trim(), ticker: isin, isin,
      date: formatDate(date), qty: Math.abs(qty),
      pricePerUnit: Math.abs(price),
      totalCost: netCost,
      totalCostEur: netCost, // DEGIRO és EUR
      currency: curr, fxRate: 1,
      action: isBuy ? 'buy' : 'sell', type: 'etf', source: 'DEGIRO',
    })
  })
  return result
}

// ── Interactive Brokers ───────────────────────────────────────────────────────
function parseIB(rows) {
  const result = []
  rows.forEach(r => {
    const symbol  = r['symbol'] || r['financial instrument'] || ''
    const date    = r['trade date'] || r['date/time'] || r['date'] || ''
    const qty     = cleanNum(r['quantity'] || '0')
    const price   = cleanNum(r['t. price'] || r['price'] || '0')
    const value   = cleanNum(r['proceeds'] || r['amount'] || '0')
    const curr    = r['currency'] || r['curr.'] || 'USD'
    const action  = r['buy/sell'] || r['action'] || ''
    const assetCat = (r['asset category'] || '').toLowerCase()

    if (!symbol || qty === 0) return
    const isBuy  = action.toLowerCase().includes('buy') || qty > 0
    const netCost = Math.abs(price * qty)
    result.push({
      name: r['description'] || symbol, ticker: symbol,
      date: formatDate(date), qty: Math.abs(qty),
      pricePerUnit: Math.abs(price),
      totalCost: netCost,
      totalCostEur: netCost, // IB: conversió manual si cal
      currency: curr, fxRate: 1,
      action: isBuy ? 'buy' : 'sell',
      type: assetCat.includes('etf') ? 'etf' : 'stock',
      source: 'Interactive Brokers',
    })
  })
  return result
}

// ── Revolut ───────────────────────────────────────────────────────────────────
// Format: Date, Ticker, Type, Quantity, Price per share, Total Amount, Currency, FX Rate
//
// ── FIX CRÍTIC ──────────────────────────────────────────────────────────────
// PROBLEMA ANTERIOR: usàvem 'total_amount' com a cost → inclou fees de Revolut
//   → avgCost incorrecte, P&G incorrecte
//
// SOLUCIÓ: usar price_per_share × quantity = cost NET (sense fees)
//   → avgCost idèntic al de Revolut
//   → totalCostEur = price × qty / fxRate (cost net en EUR al moment de compra)
//
// Verificat amb CSV real:
//   EUNL: price×qty → avgEUR=111.53 ✓ (Revolut: €111.53)
//   VUAA: price×qty → avgEUR=112.88 ✓ (Revolut: €112.88)
//   EUNM: price×qty → avgEUR=47.05  ✓ (Revolut: €47.05)
//   LMT:  price×qty → avgUSD=555.47 ✓ (Revolut: $555.47)
// ────────────────────────────────────────────────────────────────────────────
function parseRevolut(rows) {
  const result = []
  rows.forEach(r => {
    const ticker  = (r['ticker'] || r['symbol'] || '').trim()
    const rawType = (r['type'] || r['transaction type'] || '').trim()
    const typeLow = rawType.toLowerCase()

    if (!ticker) return
    if (!typeLow.includes('buy') && !typeLow.includes('sell')) return

    const date     = (r['date'] || '').split('T')[0]
    const qty      = cleanNum(r['quantity'] || '0')
    const priceRaw = r['price per share'] || r['price'] || ''
    const totalRaw = r['total amount'] || r['amount'] || r['total'] || ''

    const price = cleanNum(priceRaw)  // preu per acció en moneda original
    const total = Math.abs(cleanNum(totalRaw))  // total_amount (inclou fees — NO usar per cost)

    const curr = r['currency']
      || extractCurrency(priceRaw)
      || extractCurrency(totalRaw)
      || 'EUR'

    const fxRate = cleanNum(r['fx rate'] || r['fx_rate'] || '1') || 1

    if (qty <= 0 || price <= 0) return

    // ── CÀLCUL CORRECTE DEL COST ─────────────────────────────────────────────
    // Cost net = price_per_share × quantity (sense fees, igual que Revolut)
    const netCostOrig = price * qty              // en moneda original (USD per LMT, EUR per ETFs)
    const netCostEur  = curr === 'EUR'
      ? netCostOrig                              // ja en EUR
      : netCostOrig / fxRate                    // convertit amb FX del moment de compra

    const normalizedTicker = normalizeEuropeanTicker(ticker, curr)
    const assetType = curr === 'EUR' ? 'etf' : 'stock'
    const isBuy = typeLow.includes('buy')

    result.push({
      name:            ticker,
      ticker:          normalizedTicker,
      date:            date || new Date().toISOString().split('T')[0],
      qty:             Math.abs(qty),
      pricePerUnit:    price,                   // preu en moneda original
      pricePerUnitEur: curr === 'EUR' ? price : price / fxRate,  // preu en EUR
      // ── FIX: usa price×qty (net) en lloc de total_amount ──
      totalCost:       netCostOrig,             // en moneda original
      totalCostEur:    netCostEur,              // en EUR (amb FX del moment)
      totalCostOrig:   netCostOrig,
      // Guardem total_amount per referència (però NO per calculs de P&G)
      totalAmount:     total,
      currency:        curr,
      fxRate:          fxRate,
      action:          isBuy ? 'buy' : 'sell',
      type:            assetType,
      source:          'Revolut',
    })
  })
  return result
}

// ── Trade Republic ────────────────────────────────────────────────────────────
function parseTradeRepublic(rows) {
  const result = []
  rows.forEach(r => {
    const name  = r['instrument'] || r['name'] || r['asset'] || ''
    const isin  = r['isin'] || ''
    const date  = r['date'] || r['booking date'] || r['time'] || ''
    const qty   = cleanNum(r['shares'] || r['quantity'] || r['amount (shares)'] || '0')
    const price = cleanNum(r['price'] || r['share price'] || '0')
    const total = cleanNum(r['total'] || r['amount'] || r['total amount'] || '0')
    const curr  = r['currency'] || 'EUR'
    const type  = (r['type'] || r['transaction type'] || r['event type'] || '').toLowerCase()

    if (!name || qty === 0) return
    const isBuy = type.includes('buy') || type.includes('purchase') || type.includes('saving')
    const netCost = price > 0 ? Math.abs(price * qty) : Math.abs(total)
    const trTicker = r['ticker'] || r['symbol'] || normalizeEuropeanTicker(isin?.slice(-6) || name?.slice(0,6), curr)
    result.push({
      name, ticker: trTicker, isin,
      date: formatDate(date), qty: Math.abs(qty),
      pricePerUnit: Math.abs(price) || (qty ? Math.abs(total)/Math.abs(qty) : 0),
      totalCost: netCost, totalCostEur: netCost,
      currency: curr, fxRate: 1,
      action: isBuy ? 'buy' : 'sell', type: 'etf', source: 'Trade Republic',
    })
  })
  return result
}

// ── Fidelity / Schwab ─────────────────────────────────────────────────────────
function parseSchwabFidelity(rows, broker) {
  const result = []
  rows.forEach(r => {
    const symbol = r['symbol'] || r['ticker'] || ''
    const desc   = r['description'] || r['security description'] || r['security name'] || symbol
    const date   = r['date'] || r['run date'] || r['trade date'] || r['settlement date'] || ''
    const qty    = cleanNum(r['quantity'] || r['shares'] || r['amount'] || '0')
    const price  = cleanNum(r['price'] || r['share price'] || '0')
    const total  = cleanNum(r['amount'] || r['principal'] || r['total'] || '0')
    const curr   = r['currency'] || 'USD'
    const action = (r['action'] || r['type'] || r['transaction type'] || '').toLowerCase()

    if (!symbol || Math.abs(qty) < 0.0001) return
    const isBuy = action.includes('buy') || action.includes('purchased') || action.includes('reinvest')
    const netCost = price > 0 ? Math.abs(price * qty) : Math.abs(total)
    result.push({
      name: desc || symbol, ticker: symbol,
      date: formatDate(date), qty: Math.abs(qty),
      pricePerUnit: Math.abs(price) || (qty ? Math.abs(total)/Math.abs(qty) : 0),
      totalCost: netCost, totalCostEur: netCost,
      currency: curr, fxRate: 1,
      action: isBuy ? 'buy' : 'sell', type: 'stock',
      source: broker === 'schwab' ? 'Schwab' : 'Fidelity',
    })
  })
  return result
}

// ── Genèric ───────────────────────────────────────────────────────────────────
function parseGeneric(rows) {
  const result = []
  rows.forEach(r => {
    const ticker = r['ticker'] || r['symbol'] || r['codi'] || ''
    const name   = r['name'] || r['nom'] || r['description'] || r['actiu'] || ticker
    const date   = r['date'] || r['data'] || r['fecha'] || ''
    const qty    = cleanNum(r['qty'] || r['quantity'] || r['shares'] || r['quantitat'] || r['accions'] || '0')
    const price  = cleanNum(r['price'] || r['preu'] || r['precio'] || r['price per unit'] || '0')
    const total  = cleanNum(r['total'] || r['amount'] || r['import'] || r['cost'] || r['cost total'] || '0')
    const curr   = r['currency'] || r['moneda'] || r['devise'] || 'EUR'
    const action = (r['action'] || r['type'] || r['tipus'] || r['buy/sell'] || 'buy').toLowerCase()
    const type   = (r['type'] || r['category'] || r['asset type'] || 'stock').toLowerCase()

    if (!name || qty === 0) return
    const isBuy = !action.includes('sell') && !action.includes('venda') && !action.includes('vente')
    const netCost = price > 0 ? Math.abs(price * qty) : Math.abs(total)
    const assetType = type.includes('etf') ? 'etf' : type.includes('crypto') ? 'crypto' : 'stock'
    result.push({
      name, ticker,
      date: formatDate(date), qty: Math.abs(qty),
      pricePerUnit: Math.abs(price) || (qty ? Math.abs(total)/Math.abs(qty) : 0),
      totalCost: netCost, totalCostEur: netCost,
      currency: curr, fxRate: 1,
      action: isBuy ? 'buy' : 'sell', type: assetType, source: 'CSV genèric',
    })
  })
  return result
}

// ── Format de data ────────────────────────────────────────────────────────────
function formatDate(s) {
  if (!s) return new Date().toISOString().split('T')[0]
  s = s.split(' ')[0].split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [a, b, c] = s.split('/')
    return parseInt(a) > 12 ? `${c}-${b}-${a}` : `${c}-${a}-${b}`
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [a, b, c] = s.split('-')
    return parseInt(a) > 12 ? `${c}-${b}-${a}` : `${c}-${a}-${b}`
  }
  try { return new Date(s).toISOString().split('T')[0] } catch { return s }
}

// ── Normalitza ticker europeu ─────────────────────────────────────────────────
function normalizeEuropeanTicker(ticker, currency) {
  if (!ticker) return ticker
  if (ticker.includes('.')) return ticker
  if (currency === 'EUR') {
    const xetraETFs = ['EUNL','VUAA','IWDA','CSPX','VWCE','VUSA','EUNM','IEMA',
                       'SPPW','VFEM','EQQQ','IQQQ','QDVE','EXXT','XDWD','DBXW',
                       'XDEW','XDEM','XDEP','XDEX','VEUR','VERX','VGKE','VFEA',
                       'EMIM','HMEF','HMWO','LCUW','LCUD','AGGG','IGLN','PHAU']
    if (xetraETFs.includes(ticker.toUpperCase())) return ticker + '.DE'
    return ticker + '.DE'
  }
  if (currency === 'GBP') return ticker + '.L'
  return ticker  // USD → NYSE/NASDAQ, sense extensió
}

// ── Entry point ───────────────────────────────────────────────────────────────
export function parseCSV(text) {
  const { headers, rows } = parseCSVRows(text)
  if (!rows.length) return { broker: 'unknown', transactions: [], error: 'CSV buit o format incorrecte' }

  const broker = detectBroker(headers, rows[0])
  let transactions = []

  switch (broker) {
    case 'degiro':        transactions = parseDEGIRO(rows); break
    case 'ib':            transactions = parseIB(rows); break
    case 'revolut':       transactions = parseRevolut(rows); break
    case 'traderepublic': transactions = parseTradeRepublic(rows); break
    case 'schwab':
    case 'fidelity':      transactions = parseSchwabFidelity(rows, broker); break
    default:              transactions = parseGeneric(rows); break
  }

  return {
    broker: broker === 'degiro' ? 'DEGIRO' : broker === 'ib' ? 'Interactive Brokers' :
            broker === 'revolut' ? 'Revolut' : broker === 'traderepublic' ? 'Trade Republic' :
            broker === 'schwab' ? 'Schwab' : broker === 'fidelity' ? 'Fidelity' : 'Genèric',
    transactions: transactions.filter(t => t.qty > 0),
    total: transactions.length,
    headers,
  }
}