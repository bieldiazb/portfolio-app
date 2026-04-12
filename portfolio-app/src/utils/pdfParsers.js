// ─── utils/pdfParsers.js ──────────────────────────────────────────────────────
// Extreu transaccions de PDFs de brokers (Trade Republic, DEGIRO, etc.)
// Usa pdf.js via CDN — no cal cap dependència npm addicional.

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// Carrega pdf.js dinàmicament (només un cop)
let pdfJsLoading = null
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib
  if (!pdfJsLoading) {
    pdfJsLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = PDFJS_CDN
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
        resolve(window.pdfjsLib)
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return pdfJsLoading
}

// Extreu tot el text d'un PDF (File o ArrayBuffer) com array de línies per pàgina
export async function extractPdfText(file) {
  const pdfjsLib = await loadPdfJs()
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // Agrupa els items per línia (y aproximada)
    const byY = {}
    content.items.forEach(item => {
      const y = Math.round(item.transform[5])
      if (!byY[y]) byY[y] = []
      byY[y].push(item.str)
    })
    const lines = Object.keys(byY)
      .sort((a, b) => b - a) // descendent (pdf coord: y creix cap amunt)
      .map(y => byY[y].join(' ').trim())
      .filter(Boolean)
    pages.push(lines)
  }
  return pages
}

// Detecta quin broker és el PDF
function detectPdfBroker(allLines) {
  const sample = allLines.slice(0, 30).join(' ').toLowerCase()
  if (sample.includes('trade republic')) return 'traderepublic'
  if (sample.includes('degiro'))         return 'degiro'
  if (sample.includes('revolut'))        return 'revolut'
  if (sample.includes('interactive brokers') || sample.includes('ibkr')) return 'ib'
  if (sample.includes('scalable'))       return 'scalable'
  return 'generic'
}

// Detecta si el PDF de TR és un extracte de custòdia (sense txs) o una confirmació d'ordre
function isTRAccountStatement(allLines) {
  const text = allLines.join(' ').toLowerCase()
  return (
    text.includes('extracto de la cuenta de valores') ||
    text.includes('depotauszug') ||
    text.includes('statement of securities account') ||
    text.includes('número de posiciones') ||
    text.includes('anzahl positionen')
  )
}

// ── Trade Republic PDF ────────────────────────────────────────────────────────
// Format típic d'un PDF de Trade Republic (extracte de compte o confirmació d'ordre)
//
// Confirmació d'ordre ("Wertpapierabrechnung" / "Order Confirmation"):
//   Línies rellevants:
//   - "ISIN: DE000ETF001X" o "ISIN DE000ETF001X"
//   - "Nombre d'accions / Shares: 10"
//   - "Curs / Price: 95,50 EUR"
//   - "Data / Date: 15.03.2024"
//   - "Tipus / Type: Buy / Compra"
//
// Extracte mensual (Activity Statement):
//   Bloc per transacció amb línies:
//   "15 Mar 2024", "iShares Core MSCI World", "Buy", "10 shares @ 95,50 EUR"
function parseTRPdf(pages) {
  const transactions = []
  const allLines = pages.flat()

  // Si és un extracte de custòdia → no té transaccions, retorna buit amb flag explicatiu
  if (isTRAccountStatement(allLines)) {
    return { __isStatement: true, transactions: [] }
  }

  // ── Intent 1: Confirmació d'ordre (1 tx per PDF) ─────────────────────────
  const fullText = allLines.join('\n')
  const isin     = fullText.match(/ISIN[:\s]+([A-Z]{2}[A-Z0-9]{10})/i)?.[1]
  const name     = allLines.find(l => l.match(/\b(iShares|Vanguard|Xtrackers|Lyxor|Amundi|SPDR|WisdomTree)\b/i))
                   || allLines.find(l => l.length > 6 && l.length < 80 && !l.match(/^\d/) && !l.match(/EUR|USD|GBP/))

  // Cerca preu: "95,50 EUR", "95.50 EUR", "EUR 95.50"
  const priceMatch = fullText.match(/(\d{1,6}[.,]\d{2,4})\s*(EUR|USD|GBP)/i)
                   || fullText.match(/(EUR|USD|GBP)\s*(\d{1,6}[.,]\d{2,4})/i)
  // Cerca quantitat: "10 Shares", "10 Accions", "Quantitat: 10", "Qty: 10"
  const qtyMatch  = fullText.match(/(?:shares?|accions?|qty|quantity|anzahl)[:\s]+(\d+[.,]?\d*)/i)
                   || fullText.match(/(\d+[.,]?\d*)\s+(?:shares?|accions?|títols?)/i)
  // Cerca data: "15.03.2024", "2024-03-15", "15 Mar 2024"
  const dateMatch = fullText.match(/(\d{2}[.\/-]\d{2}[.\/-]\d{4})/)?.[1]
                   || fullText.match(/(\d{4}-\d{2}-\d{2})/)?.[1]
  // Tipus: buy/sell
  const isBuy = /\b(buy|compra|purchase|kauf)\b/i.test(fullText)
  const isSell = /\b(sell|venda|vente|verkauf)\b/i.test(fullText)

  if (isin && priceMatch && qtyMatch) {
    const price = cleanPdfNum(priceMatch[1] || priceMatch[2])
    const qty   = cleanPdfNum(qtyMatch[1] || qtyMatch[2])
    const curr  = (priceMatch[2] || priceMatch[1] || 'EUR').toUpperCase()
    if (qty > 0 && price > 0) {
      transactions.push({
        name:         name?.trim() || isin,
        ticker:       normalizeTicker(isin, curr),
        isin,
        date:         formatPdfDate(dateMatch || ''),
        qty,
        pricePerUnit: price,
        totalCost:    price * qty,
        totalCostEur: curr === 'EUR' ? price * qty : price * qty, // FX no disponible al PDF
        currency:     curr,
        fxRate:       1,
        action:       isSell ? 'sell' : 'buy',
        type:         guessType(isin, name || ''),
        source:       'Trade Republic PDF',
      })
    }
  }

  // ── Intent 2: Extracte mensual (múltiples txs) ───────────────────────────
  if (!transactions.length) {
    // Busca patrons com: "Buy 10 shares of iShares ... @ 95.50 EUR on 15.03.2024"
    // o blocs de línies amb data + ticker + qty + preu
    const dateRx  = /\b(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}|\d{4}-\d{2}-\d{2})\b/
    const priceRx = /(\d{1,6}[.,]\d{2,4})\s*(EUR|USD|GBP)/i
    const qtyRx   = /(\d+[.,]?\d*)\s+(?:shares?|accions?|títols?|@)/i
    const isinRx  = /\b([A-Z]{2}[A-Z0-9]{10})\b/

    let i = 0
    while (i < allLines.length) {
      const line = allLines[i]
      if (!dateRx.test(line) && !isinRx.test(line)) { i++; continue }

      // Agafa un bloc de 8 línies al voltant
      const block = allLines.slice(Math.max(0, i - 2), i + 8).join('\n')
      const bIsin = block.match(isinRx)?.[1]
      const bPrice = block.match(priceRx)
      const bQty  = block.match(qtyRx)
      const bDate = block.match(dateRx)?.[1]
      const bBuy  = /\b(buy|compra|kauf)\b/i.test(block)
      const bSell = /\b(sell|venda|verkauf)\b/i.test(block)

      if (bIsin && bPrice && bQty) {
        const price = cleanPdfNum(bPrice[1])
        const qty   = cleanPdfNum(bQty[1])
        const curr  = (bPrice[2] || 'EUR').toUpperCase()
        transactions.push({
          name:         bIsin,
          ticker:       normalizeTicker(bIsin, curr),
          isin:         bIsin,
          date:         formatPdfDate(bDate || ''),
          qty,
          pricePerUnit: price,
          totalCost:    price * qty,
          totalCostEur: price * qty,
          currency:     curr,
          fxRate:       1,
          action:       bSell ? 'sell' : 'buy',
          type:         guessType(bIsin, ''),
          source:       'Trade Republic PDF',
        })
        i += 8
      } else {
        i++
      }
    }
  }

  return transactions
}

// ── DEGIRO PDF ────────────────────────────────────────────────────────────────
function parseDEGIROPdf(pages) {
  const transactions = []
  const allLines = pages.flat()

  // DEGIRO transaction format in PDFs:
  // "15-03-2024 09:30 ISHARES CORE MSCI WORLD DE0005933931 10 95,50 EUR"
  const txRx = /(\d{2}[-\/]\d{2}[-\/]\d{4})\s+[\d:]+\s+(.+?)\s+([A-Z]{2}[A-Z0-9]{10})\s+([\d.,]+)\s+([\d.,]+)\s+(EUR|USD|GBP)/i

  allLines.forEach(line => {
    const m = line.match(txRx)
    if (!m) return
    const [, date, name, isin, qty, price, curr] = m
    const qtyN  = cleanPdfNum(qty)
    const priceN = cleanPdfNum(price)
    if (qtyN <= 0 || priceN <= 0) return
    // DEGIRO: si el valor és negatiu = compra
    const isBuy = !line.toLowerCase().includes('vend') && !line.toLowerCase().includes('sell')
    transactions.push({
      name: name.trim(), ticker: normalizeTicker(isin, curr), isin,
      date: formatPdfDate(date),
      qty: qtyN, pricePerUnit: priceN,
      totalCost: priceN * qtyN, totalCostEur: priceN * qtyN,
      currency: curr.toUpperCase(), fxRate: 1,
      action: isBuy ? 'buy' : 'sell',
      type: guessType(isin, name),
      source: 'DEGIRO PDF',
    })
  })

  return transactions
}

// ── Scalable Capital PDF ──────────────────────────────────────────────────────
function parseScalablePdf(pages) {
  // Format similar a Trade Republic — reutilitzem el parser
  return parseTRPdf(pages).map(t => ({ ...t, source: 'Scalable Capital PDF' }))
}

// ── Generic PDF parser ────────────────────────────────────────────────────────
function parseGenericPdf(pages) {
  const transactions = []
  const allLines = pages.flat()
  const isinRx  = /\b([A-Z]{2}[A-Z0-9]{10})\b/
  const priceRx = /(\d{1,6}[.,]\d{2,4})\s*(EUR|USD|GBP)/i
  const qtyRx   = /(\d+[.,]?\d*)\s+(?:shares?|accions?|@|×)/i
  const dateRx  = /(\d{2}[.\/-]\d{2}[.\/-]\d{4}|\d{4}-\d{2}-\d{2})/

  let i = 0
  while (i < allLines.length) {
    const line = allLines[i]
    const isin = line.match(isinRx)?.[1]
    if (!isin) { i++; continue }

    const block = allLines.slice(Math.max(0, i - 3), i + 6).join('\n')
    const price = block.match(priceRx)
    const qty   = block.match(qtyRx)
    const date  = block.match(dateRx)?.[1]

    if (price && qty) {
      const priceN = cleanPdfNum(price[1])
      const qtyN   = cleanPdfNum(qty[1])
      const curr   = (price[2] || 'EUR').toUpperCase()
      const isBuy  = !/\b(sell|venda)\b/i.test(block)
      transactions.push({
        name: isin, ticker: normalizeTicker(isin, curr), isin,
        date: formatPdfDate(date || ''),
        qty: qtyN, pricePerUnit: priceN,
        totalCost: priceN * qtyN, totalCostEur: priceN * qtyN,
        currency: curr, fxRate: 1,
        action: isBuy ? 'buy' : 'sell',
        type: guessType(isin, ''),
        source: 'PDF genèric',
      })
    }
    i++
  }
  return transactions
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cleanPdfNum(s) {
  if (!s) return 0
  // "1.234,56" → 1234.56  |  "1,234.56" → 1234.56  |  "95,50" → 95.50
  s = String(s).trim()
  if (s.match(/\d{1,3}\.\d{3},\d/)) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  if (s.match(/\d{1,3},\d{3}\.\d/)) return parseFloat(s.replace(/,/g, '')) || 0
  return parseFloat(s.replace(',', '.')) || 0
}

function formatPdfDate(s) {
  if (!s) return new Date().toISOString().split('T')[0]
  s = s.trim()
  // DD.MM.YYYY o DD/MM/YYYY o DD-MM-YYYY
  const m1 = s.match(/^(\d{2})[.\/-](\d{2})[.\/-](\d{4})$/)
  if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  try { return new Date(s).toISOString().split('T')[0] } catch { return s }
}

function guessType(isin, name) {
  const n = (name || isin || '').toLowerCase()
  if (n.includes('etf') || n.includes('ishares') || n.includes('vanguard') ||
      n.includes('xtrackers') || n.includes('lyxor') || n.includes('amundi')) return 'etf'
  return 'etf' // per defecte ETF per Trade Republic
}

function normalizeTicker(isin, currency) {
  if (!isin) return ''
  // Afegim .DE per ISINs europeus en EUR (Xetra)
  if (currency === 'EUR' && /^(DE|IE|LU|FR|NL)/.test(isin)) return isin + '.DE'
  return isin
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function parsePDF(file) {
  const pages = await extractPdfText(file)
  const allLines = pages.flat()

  if (!allLines.length) {
    return { broker: 'unknown', transactions: [], error: 'No s\'ha pogut extreure text del PDF. Pot ser un PDF escanejat (imatge).' }
  }

  const broker = detectPdfBroker(allLines)
  let transactions = []

  let trResult = null
  switch (broker) {
    case 'traderepublic':
      trResult = parseTRPdf(pages)
      if (trResult?.__isStatement) {
        return {
          broker: 'Trade Republic',
          transactions: [],
          isPdf: true,
          error: 'Aquest PDF és un extracte de custòdia (llista de posicions), no una confirmació d\'ordre. Per importar transaccions, obre Trade Republic → Activitat → toca una operació → Documents → descarrega la confirmació d\'ordre.',
        }
      }
      transactions = trResult || []
      break
    case 'degiro':   transactions = parseDEGIROPdf(pages); break
    case 'scalable': transactions = parseScalablePdf(pages); break
    default:         transactions = parseGenericPdf(pages); break
  }

  const brokerName = {
    traderepublic: 'Trade Republic',
    degiro:        'DEGIRO',
    revolut:       'Revolut',
    ib:            'Interactive Brokers',
    scalable:      'Scalable Capital',
    generic:       'Genèric',
  }[broker] || 'Genèric'

  return {
    broker: brokerName,
    transactions: transactions.filter(t => t.qty > 0),
    total: transactions.length,
    isPdf: true,
  }
}