// ─── hooks/useDividends.js ────────────────────────────────────────────────────
// Font de dades:
//   • Alpha Vantage /query?function=DIVIDENDS         → ex-date + pay date reals
//   • Alpha Vantage /query?function=EARNINGS_CALENDAR → earnings calls
//   • Yahoo /v8/finance/chart (fallback + freqüència) → historial pay dates
//
// Clau gratuïta AV: https://www.alphavantage.co/support/#api-key
// Netlify env var: ALPHA_VANTAGE_KEY

import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

// ── Utilitats ─────────────────────────────────────────────────────────────────
function tsToDate(ts) {
  if (!ts) return null
  return new Date(ts * 1000).toISOString().split('T')[0]
}

export function generateDividendDates(refDate, frequency, yearsAhead = 1) {
  if (!refDate || !frequency) return []
  const monthGap  = Math.round(12 / frequency)
  const now       = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const limit     = new Date(now.getFullYear() + yearsAhead, 11, 31)
  let cur = new Date(refDate)
  while (cur > yearStart)
    cur = new Date(cur.getFullYear(), cur.getMonth() - monthGap, cur.getDate())
  const dates = []
  cur = new Date(cur.getFullYear(), cur.getMonth() + monthGap, cur.getDate())
  while (cur <= limit) {
    if (cur >= yearStart)
      dates.push({ date: cur.toISOString().split('T')[0], isExact: false })
    cur = new Date(cur.getFullYear(), cur.getMonth() + monthGap, cur.getDate())
  }
  return dates
}

// ── Alpha Vantage helper ──────────────────────────────────────────────────────
async function avGet(params) {
  const qs  = new URLSearchParams(params)
  const res = await fetch(`/av?${qs}`, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error(`AV ${res.status}`)
  const data = await res.json()
  // AV retorna { "Information": "..." } si s'ha superat el límit
  if (data?.Information || data?.Note) throw new Error('AV rate limit')
  return data
}

// ── Yahoo helper (fallback historial) ─────────────────────────────────────────
async function yahooChartDividends(ticker) {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return []
    const data   = await res.json()
    const rawDiv = data?.chart?.result?.[0]?.events?.dividends
    if (!rawDiv) return []
    return Object.values(rawDiv)
      .map(d => ({ date: tsToDate(d.date), amount: d.amount, ts: d.date }))
      .sort((a, b) => b.ts - a.ts)
  } catch { return [] }
}

// ── fetchDividendInfo ─────────────────────────────────────────────────────────
export async function fetchDividendInfo(ticker) {
  // Normalitza ticker per Alpha Vantage (treu extensió .DE .AS etc)
  const avTicker = ticker.includes('.') ? ticker.split('.')[0] : ticker
  const today    = new Date().toISOString().split('T')[0]

  try {
    // ── 1. Alpha Vantage: dividends + earnings en paral·lel ──────────────────
    const [avDivResult, avEarnResult] = await Promise.allSettled([
      // DIVIDENDS: retorna historial complet amb ex-date i pay date reals
      avGet({ function: 'DIVIDENDS', symbol: avTicker }),
      // EARNINGS_CALENDAR: properes dates d'earnings calls (fins 3 mesos)
      avGet({ function: 'EARNINGS_CALENDAR', symbol: avTicker, horizon: '12month' }),
    ])

    // ── 2. Processa dividends ─────────────────────────────────────────────────
    // AV DIVIDENDS retorna:
    // { symbol, data: [{ ex_dividend_date, declaration_date, record_date, payment_date, amount }] }
    const avDivData = avDivResult.status === 'fulfilled' ? avDivResult.value : null
    const divList   = avDivData?.data || []

    // Historial complet ordenat per payment_date desc
    const histDivs = divList
      .filter(d => d.ex_dividend_date && d.payment_date)
      .map(d => ({
        exDate:  d.ex_dividend_date,   // ex-dividend date real ✓
        date:    d.payment_date,        // pay date real ✓
        amount:  parseFloat(d.amount) || 0,
        declarationDate: d.declaration_date,
        recordDate:      d.record_date,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))

    // Proper dividend futur (ex-date >= avui)
    const nextDiv    = histDivs.find(d => d.exDate >= today)
    // Últim dividend pagat
    const lastDiv    = histDivs.find(d => d.date < today)

    const nextExDate  = nextDiv?.exDate  || null
    const nextPayDate = nextDiv?.date    || null

    // ── 3. Processa earnings ──────────────────────────────────────────────────
    // AV EARNINGS_CALENDAR retorna CSV: symbol,name,reportDate,fiscalDateEnding,estimate,currency
    // Però si demanem JSON retorna { symbol, data: [...] } o directament l'array
    let earningsStart = null
    let epsEstimate   = null

    const avEarnRaw = avEarnResult.status === 'fulfilled' ? avEarnResult.value : null

    if (avEarnRaw) {
      // AV pot retornar CSV o JSON depenent del pla
      // Si és JSON: { data: [{ reportDate, estimate, ... }] }
      const earnList = avEarnRaw?.data || (Array.isArray(avEarnRaw) ? avEarnRaw : [])
      const futureEarnings = earnList
        .filter(e => e.reportDate && e.reportDate >= today)
        .sort((a, b) => a.reportDate.localeCompare(b.reportDate))

      earningsStart = futureEarnings[0]?.reportDate || null
      epsEstimate   = futureEarnings[0]?.estimate
        ? parseFloat(futureEarnings[0].estimate) || null
        : null
    }

    // Fallback earnings: Yahoo quoteSummary si AV no dona dades
    if (!earningsStart) {
      try {
        const yRes = await fetch(
          `/yahoo/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=calendarEvents`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (yRes.ok) {
          const yData = await yRes.json()
          const cal   = yData?.quoteSummary?.result?.[0]?.calendarEvents || {}
          const eDates = (cal?.earnings?.earningsDate || [])
            .map(d => tsToDate(d?.raw || d))
            .filter(d => d && d >= today)
            .sort()
          earningsStart = eDates[0] || null
          epsEstimate   = cal?.earnings?.earningsAverage?.raw || null
        }
      } catch {}
    }

    // ── 4. Freqüència des de l'historial ─────────────────────────────────────
    let frequency = 4
    const paidDivs = histDivs.filter(d => d.date < today)

    if (paidDivs.length >= 3) {
      const gaps = []
      for (let i = 0; i < Math.min(paidDivs.length - 1, 8); i++) {
        const a = new Date(paidDivs[i].date)
        const b = new Date(paidDivs[i+1].date)
        const m = (a.getFullYear()-b.getFullYear())*12 + (a.getMonth()-b.getMonth())
        if (m > 0 && m <= 14) gaps.push(m)
      }
      if (gaps.length) {
        const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
        frequency = avg<=1.5?12:avg<=2.5?6:avg<=4.5?4:avg<=7?2:1
      }
    }

    // Si AV no té dades de dividends (ETFs europeus), fem fallback a Yahoo
    if (!histDivs.length) {
      const yahooHist = await yahooChartDividends(ticker)
      if (yahooHist.length >= 3) {
        const gaps = []
        for (let i = 0; i < Math.min(yahooHist.length - 1, 8); i++) {
          const a = new Date(yahooHist[i].date)
          const b = new Date(yahooHist[i+1].date)
          const m = (a.getFullYear()-b.getFullYear())*12+(a.getMonth()-b.getMonth())
          if (m > 0 && m <= 14) gaps.push(m)
        }
        if (gaps.length) {
          const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
          frequency = avg<=1.5?12:avg<=2.5?6:avg<=4.5?4:avg<=7?2:1
        }
        // Usem l'historial de Yahoo per les dates si AV no en té
        histDivs.push(...yahooHist.map(d => ({
          exDate: null, date: d.date, amount: d.amount
        })))
      }
    }

    // ── 5. Offset ex-date → pay-date ─────────────────────────────────────────
    let exPayOffset = 26  // fallback US
    if (nextExDate && nextPayDate) {
      const diff = Math.round((new Date(nextPayDate) - new Date(nextExDate)) / 86400000)
      if (diff > 0 && diff < 60) exPayOffset = diff
    } else if (histDivs.length >= 2) {
      // Calculem offset mitjà des de l'historial real
      const offsets = histDivs
        .filter(d => d.exDate && d.date)
        .slice(0, 6)
        .map(d => Math.round((new Date(d.date) - new Date(d.exDate)) / 86400000))
        .filter(o => o > 0 && o < 60)
      if (offsets.length)
        exPayOffset = Math.round(offsets.reduce((a,b)=>a+b,0) / offsets.length)
    } else if (ticker.includes('.')) {
      exPayOffset = 15  // ETFs europeus
    }

    // ── 6. Import per pagament ────────────────────────────────────────────────
    const perPayment = (nextDiv?.amount || lastDiv?.amount) || null
    const dividendRate  = perPayment && frequency ? +(perPayment * frequency).toFixed(4) : null
    const dividendYield = null  // AV no dona yield directament en el pla gratuït

    // ── 7. Genera dates projectades ───────────────────────────────────────────
    const refPayDate = (nextPayDate && nextPayDate >= today)
      ? nextPayDate
      : (lastDiv?.date || histDivs[0]?.date || null)

    const payDates = generateDividendDates(refPayDate, frequency)
    const allDates = payDates.map(({ date, isExact }) => {
      const payDt = new Date(date + 'T12:00:00')
      const exDt  = new Date(payDt); exDt.setDate(exDt.getDate() - exPayOffset)
      return { date, exDate: exDt.toISOString().split('T')[0], isExact }
    })

    // Inserim dates REALS d'AV amb prioritat màxima
    if (nextExDate && nextPayDate) {
      const realEntry = { date: nextPayDate, exDate: nextExDate, isExact: true }
      const idx = allDates.findIndex(d =>
        Math.abs(new Date(d.date) - new Date(nextPayDate)) / 86400000 < 45
      )
      if (idx >= 0) allDates[idx] = realEntry
      else allDates.unshift(realEntry)
      allDates.sort((a, b) => a.date.localeCompare(b.date))
    }

    return {
      nextExDate,
      nextPayDate,
      earningsStart,
      earningsEnd:   null,
      epsEstimate,
      dividendRate,
      dividendYield,
      trailingRate:  dividendRate,
      trailingYield: dividendYield,
      frequency,
      exPayOffsetDays: exPayOffset,
      perPayment,
      allDates,
      histDivs: histDivs.slice(0, 12),
      refPayDate,
      source: 'alphavantage',
    }

  } catch (err) {
    console.warn(`fetchDividendInfo AV error (${ticker}):`, err.message)
    // ── Fallback complet a Yahoo ──────────────────────────────────────────────
    return fetchDividendInfoYahoo(ticker)
  }
}

// ── Fallback Yahoo (si AV falla) ──────────────────────────────────────────────
async function fetchDividendInfoYahoo(ticker) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const modules = 'calendarEvents,summaryDetail,defaultKeyStatistics'
    const [summaryRes, chartRes] = await Promise.all([
      fetch(`/yahoo/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`, { signal: AbortSignal.timeout(10000) }),
      fetch(`/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends`, { signal: AbortSignal.timeout(10000) }),
    ])

    let calEvents = {}, sumDetail = {}
    if (summaryRes.ok) {
      const j = await summaryRes.json()
      const r = j?.quoteSummary?.result?.[0] || {}
      calEvents = r.calendarEvents || {}
      sumDetail = r.summaryDetail  || {}
    }

    let histDivs = [], frequency = 4
    if (chartRes.ok) {
      const j      = await chartRes.json()
      const rawDiv = j?.chart?.result?.[0]?.events?.dividends
      if (rawDiv) {
        histDivs = Object.values(rawDiv)
          .map(d => ({ date: tsToDate(d.date), amount: d.amount, ts: d.date, exDate: null }))
          .sort((a,b) => b.ts - a.ts)
        if (histDivs.length >= 3) {
          const gaps = []
          for (let i=0; i<Math.min(histDivs.length-1,8); i++) {
            const a = new Date(histDivs[i].date), b = new Date(histDivs[i+1].date)
            const m = (a.getFullYear()-b.getFullYear())*12+(a.getMonth()-b.getMonth())
            if (m>0&&m<=14) gaps.push(m)
          }
          if (gaps.length) {
            const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
            frequency = avg<=1.5?12:avg<=2.5?6:avg<=4.5?4:avg<=7?2:1
          }
        }
      }
    }

    const nextExDate  = tsToDate(calEvents?.exDividendDate?.raw)
    const nextPayDate = tsToDate(calEvents?.dividendDate?.raw)
    const earningsDates = (calEvents?.earnings?.earningsDate||[]).map(d=>tsToDate(d?.raw||d)).filter(d=>d&&d>=today).sort()
    const earningsStart = earningsDates[0] || null
    const epsEstimate   = calEvents?.earnings?.earningsAverage?.raw || null
    const dividendRate  = sumDetail?.dividendRate?.raw || null
    const dividendYield = sumDetail?.dividendYield?.raw || null

    const exPayOffset = nextExDate && nextPayDate
      ? Math.max(1, Math.round((new Date(nextPayDate)-new Date(nextExDate))/86400000))
      : ticker.includes('.') ? 15 : 26

    const refPayDate = (nextPayDate&&nextPayDate>=today) ? nextPayDate : histDivs[0]?.date || null
    const payDates   = generateDividendDates(refPayDate, frequency)
    const allDates   = payDates.map(({date,isExact}) => {
      const p=new Date(date+'T12:00:00'), e=new Date(p); e.setDate(e.getDate()-exPayOffset)
      return {date, exDate:e.toISOString().split('T')[0], isExact}
    })
    if (nextExDate&&nextPayDate) {
      const re={date:nextPayDate,exDate:nextExDate,isExact:true}
      const idx=allDates.findIndex(d=>Math.abs(new Date(d.date)-new Date(nextPayDate))/86400000<45)
      if(idx>=0)allDates[idx]=re; else allDates.unshift(re)
      allDates.sort((a,b)=>a.date.localeCompare(b.date))
    }

    return {
      nextExDate, nextPayDate, earningsStart, earningsEnd:null, epsEstimate,
      dividendRate, dividendYield, trailingRate:dividendRate, trailingYield:dividendYield,
      frequency, exPayOffsetDays:exPayOffset,
      perPayment: histDivs[0]?.amount||null,
      allDates, histDivs: histDivs.slice(0,12), refPayDate,
      source:'yahoo-fallback',
    }
  } catch { return null }
}

export const fetchNextDividend = fetchDividendInfo

// ── Hook Firestore ────────────────────────────────────────────────────────────
export function useDividends(uid) {
  const [dividends, setDividends] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db,'users',uid,'dividends'), orderBy('payDate','desc'))
    return onSnapshot(q, snap => setDividends(snap.docs.map(d => ({id:d.id,...d.data()}))))
  }, [uid])

  const addDividend = useCallback(async ({
    assetId, assetName, ticker, amount, payDate, shares, currency='EUR', note=''
  }) => {
    if (!uid) return
    const amt=parseFloat(amount)||0, shr=parseFloat(shares)||0
    await addDoc(collection(db,'users',uid,'dividends'), {
      assetId, assetName, ticker, amount:amt, shares:shr,
      perShare: shr>0?amt/shr:0, currency, payDate, note,
      createdAt: serverTimestamp(),
    })
  }, [uid])

  const removeDividend = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db,'users',uid,'dividends',id))
  }, [uid])

  const byMonth = dividends.reduce((acc,d) => {
    const key = d.payDate?.slice(0,7)||'desconegut'
    acc[key]=(acc[key]||0)+(d.amount||0); return acc
  }, {})

  const thisYear      = new Date().getFullYear().toString()
  const totalThisYear = dividends.filter(d=>d.payDate?.startsWith(thisYear)).reduce((s,d)=>s+d.amount,0)
  const totalAll      = dividends.reduce((s,d)=>s+d.amount,0)

  return { dividends, addDividend, removeDividend, byMonth, totalThisYear, totalAll }
}