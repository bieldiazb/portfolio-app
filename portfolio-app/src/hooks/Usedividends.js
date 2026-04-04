// ─── hooks/useDividends.js ────────────────────────────────────────────────────
// Font principal: Finnhub (gratuït, 60 crides/minut)
//   /stock/dividend2?symbol=LMT  → ex-date, paymentDate, amount (historial complet)
//   /calendar/earnings?symbol=LMT&from=&to= → earnings call dates
//
// Fallback per ETFs europeus: Yahoo /v8/finance/chart (sense auth)
//
// Setup:
//   1. Clau gratuïta: https://finnhub.io/register
//   2. Netlify env var: FINNHUB_API_KEY = la_teva_clau
//   3. netlify.toml: /fh → /.netlify/functions/finnhub

import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

function tsToDate(ts) {
  if (!ts || typeof ts !== 'number') return null
  try { return new Date(ts * 1000).toISOString().split('T')[0] }
  catch { return null }
}

export function generateDividendDates(refDate, frequency, yearsAhead = 1) {
  if (!refDate || !frequency) return []
  const monthGap = Math.round(12 / frequency)
  const refDt    = new Date(refDate + 'T12:00:00')
  const refDay   = refDt.getDate()
  const now      = new Date()
  const limit    = new Date(now.getFullYear() + yearsAhead, 11, 31)
  const yearStart= new Date(now.getFullYear(), 0, 1)
  let cur = new Date(refDt)
  while (cur > yearStart)
    cur = new Date(cur.getFullYear(), cur.getMonth() - monthGap, refDay)
  const dates = []
  cur = new Date(cur.getFullYear(), cur.getMonth() + monthGap, refDay)
  while (cur <= limit) {
    if (cur >= yearStart)
      dates.push({ date: cur.toISOString().split('T')[0], isExact: false })
    cur = new Date(cur.getFullYear(), cur.getMonth() + monthGap, refDay)
  }
  return dates
}

async function fhGet(path, params = {}) {
  const qs = new URLSearchParams({ path, ...params })
  const res = await fetch(`/fh?${qs}`, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  const data = await res.json()
  if (data?.error) throw new Error(`Finnhub: ${data.error}`)
  return data
}

// Yahoo chart (sense auth) — per ETFs europeus com a fallback
async function yahooChartDivs(ticker) {
  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return []
    const j    = await res.json()
    const raw  = j?.chart?.result?.[0]?.events?.dividends
    if (!raw) return []
    return Object.values(raw)
      .map(d => ({ exDate: null, payDate: tsToDate(d.date), amount: d.amount, ts: d.date }))
      .sort((a, b) => b.ts - a.ts)
  } catch { return [] }
}

export async function fetchDividendInfo(ticker) {
  const today  = new Date().toISOString().split('T')[0]
  // Finnhub usa tickers sense extensió de borsa per accions US
  // Per ETFs europeus: EUNL.DE → primer provem EUNL, si no hi ha dades usem Yahoo
  const fhSymbol = ticker.includes('.') ? ticker.split('.')[0] : ticker
  const isEuropean = ticker.includes('.')

  try {
    // ── 1. Finnhub: dividends + earnings en paral·lel ─────────────────────────
    const [divResult, earnResult] = await Promise.allSettled([
      // dividend2 retorna historial complet amb ex-date i payment date
      fhGet('/stock/dividend2', { symbol: fhSymbol }),
      // earnings calendar
      fhGet('/calendar/earnings', {
        symbol: fhSymbol,
        from:   today,
        to:     new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
      }),
    ])

    // ── 2. Historial de dividends ─────────────────────────────────────────────
    // Finnhub /stock/dividend2 retorna:
    // { data: [{ exDate, paymentDate, amount, adjustedAmount, currency }] }
    const fhDivData = divResult.status === 'fulfilled' ? divResult.value : null
    let histDivs    = []

    if (fhDivData?.data?.length) {
      histDivs = fhDivData.data
        .filter(d => d.paymentDate || d.exDate)
        .map(d => ({
          exDate:  d.exDate     || null,
          payDate: d.paymentDate || d.exDate,  // usem exDate si no hi ha payDate
          amount:  parseFloat(d.adjustedAmount || d.amount) || 0,
          currency: d.currency || 'USD',
        }))
        .filter(d => d.payDate)
        .sort((a, b) => b.payDate.localeCompare(a.payDate))
    }

    console.log(`[Div] ${ticker} Finnhub divs:${histDivs.length}`)

    // Per ETFs europeus Finnhub pot no tenir dades → fallback Yahoo
    if (!histDivs.length && isEuropean) {
      const yahooHist = await yahooChartDivs(ticker)
      if (yahooHist.length) {
        histDivs = yahooHist.map(d => ({
          exDate:  null,
          payDate: d.payDate,
          amount:  d.amount,
          currency: 'EUR',
        }))
        console.log(`[Div] ${ticker} Yahoo fallback divs:${histDivs.length}`)
      }
    }

    // ── 3. Earnings ───────────────────────────────────────────────────────────
    // Finnhub /calendar/earnings retorna:
    // { earningsCalendar: [{ date, epsActual, epsEstimate, symbol, ... }] }
    let earningsStart = null, epsEstimate = null
    const fhEarnData = earnResult.status === 'fulfilled' ? earnResult.value : null
    const earnList   = fhEarnData?.earningsCalendar || []
    const futureEarn = earnList
      .filter(e => e.date && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    earningsStart = futureEarn[0]?.date       || null
    epsEstimate   = futureEarn[0]?.epsEstimate != null
                    ? parseFloat(futureEarn[0].epsEstimate) : null

    console.log(`[Div] ${ticker} earnings:${earningsStart} eps:${epsEstimate}`)

    // ── Sense historial = no paga dividends ───────────────────────────────────
    if (!histDivs.length) {
      return {
        nextExDate: null, nextPayDate: null,
        lastExDate: null, lastPayDate: null,
        earningsStart, epsEstimate,
        dividendRate: null, dividendYield: null,
        frequency: 0, allDates: [], histDivs: [],
        perPayment: null, noDividends: true,
        source: 'finnhub-no-dividends',
      }
    }

    // ── 4. Dates reals de l'últim dividend confirmat ──────────────────────────
    const lastKnownExDate  = histDivs[0]?.exDate  || null
    const lastKnownPayDate = histDivs[0]?.payDate  || null

    // Proper dividend futur (si Finnhub en té)
    const nextDiv     = histDivs.find(d => d.payDate > today)
    const nextExDate  = nextDiv?.exDate  || null
    const nextPayDate = nextDiv?.payDate || null

    // ── 5. Freqüència real ────────────────────────────────────────────────────
    let frequency = 4
    const paidDivs = histDivs.filter(d => d.payDate < today)
    if (paidDivs.length >= 3) {
      const gaps = []
      for (let i = 0; i < Math.min(paidDivs.length - 1, 10); i++) {
        const a = new Date(paidDivs[i].payDate), b = new Date(paidDivs[i+1].payDate)
        const m = (a.getFullYear()-b.getFullYear())*12 + (a.getMonth()-b.getMonth())
        if (m > 0 && m <= 14) gaps.push(m)
      }
      if (gaps.length) {
        const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
        frequency = avg<=1.5?12 : avg<=2.5?6 : avg<=4.5?4 : avg<=7?2 : 1
      }
    }

    // ── 6. Dia del mes real ───────────────────────────────────────────────────
    const days = paidDivs.slice(0, 8).map(d => new Date(d.payDate+'T12:00:00').getDate())
    const dc = {}; days.forEach(d => { dc[d]=(dc[d]||0)+1 })
    const realDay = parseInt(Object.entries(dc).sort((a,b)=>b[1]-a[1])[0]?.[0]||'15')

    // ── 7. Offset ex→pay real (calculat des de l'historial) ───────────────────
    const offsets = histDivs
      .filter(d => d.exDate && d.payDate)
      .slice(0, 8)
      .map(d => Math.round((new Date(d.payDate) - new Date(d.exDate)) / 86400000))
      .filter(o => o > 0 && o < 60)
    const exPayOffset = offsets.length
      ? Math.round(offsets.reduce((a,b)=>a+b,0)/offsets.length)
      : isEuropean ? 13 : 25

    // ── 8. Import per pagament ────────────────────────────────────────────────
    const lastPaid   = paidDivs[0]
    const perPayment = lastPaid?.amount || null
    const dividendRate  = perPayment && frequency ? +(perPayment * frequency).toFixed(4) : null
    const dividendYield = null  // Finnhub gratuït no dona yield directament

    // ── 9. Projecta dates futures ─────────────────────────────────────────────
    const lastRealPayDate = lastPaid?.payDate || histDivs[0]?.payDate
    if (!lastRealPayDate) return null

    const refDt   = new Date(lastRealPayDate+'T12:00:00')
    const refDate = new Date(refDt.getFullYear(), refDt.getMonth(), realDay)
      .toISOString().split('T')[0]

    const allFuture = generateDividendDates(refDate, frequency, 2)
      .filter(d => d.date > today)
      .map(({ date, isExact }) => {
        const p = new Date(date+'T12:00:00')
        const e = new Date(p); e.setDate(e.getDate()-exPayOffset)
        return { date, exDate: e.toISOString().split('T')[0], isExact }
      })

    // Si Finnhub té el proper dividend confirmat, l'afegim amb prioritat
    if (nextPayDate && nextPayDate > today) {
      const realEntry = {
        date:   nextPayDate,
        exDate: nextExDate || (() => {
          const p = new Date(nextPayDate+'T12:00:00')
          const e = new Date(p); e.setDate(e.getDate()-exPayOffset)
          return e.toISOString().split('T')[0]
        })(),
        isExact: true,
      }
      const idx = allFuture.findIndex(d =>
        Math.abs(new Date(d.date)-new Date(nextPayDate))/86400000 < 45
      )
      if (idx >= 0) allFuture[idx] = realEntry
      else allFuture.unshift(realEntry)
      allFuture.sort((a, b) => a.date.localeCompare(b.date))
    }

    console.log(`[Div] ${ticker} freq:${frequency} day:${realDay} offset:${exPayOffset} next pay:${allFuture[0]?.date} ex:${allFuture[0]?.exDate}`)

    return {
      nextExDate:  allFuture[0]?.exDate  || null,
      nextPayDate: allFuture[0]?.date    || null,
      lastExDate:  lastKnownExDate,
      lastPayDate: lastKnownPayDate,
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
      realDay,
      allDates: allFuture,
      histDivs: histDivs.slice(0, 12),
      refPayDate: refDate,
      source: isEuropean && !fhDivData?.data?.length ? 'yahoo+finnhub' : 'finnhub',
    }

  } catch (err) {
    console.warn(`fetchDividendInfo(${ticker}):`, err.message)
    // Fallback total a Yahoo chart
    return fetchDividendInfoYahooOnly(ticker)
  }
}

async function fetchDividendInfoYahooOnly(ticker) {
  const today = new Date().toISOString().split('T')[0]
  const histDivs = await yahooChartDivs(ticker)
  if (!histDivs.length) return null

  let frequency = 4
  const gaps = []
  for (let i = 0; i < Math.min(histDivs.length-1, 10); i++) {
    const a = new Date(histDivs[i].payDate), b = new Date(histDivs[i+1].payDate)
    const m = (a.getFullYear()-b.getFullYear())*12+(a.getMonth()-b.getMonth())
    if (m>0&&m<=14) gaps.push(m)
  }
  if (gaps.length) {
    const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
    frequency = avg<=1.5?12:avg<=2.5?6:avg<=4.5?4:avg<=7?2:1
  }

  const days = histDivs.slice(0,8).map(d=>new Date(d.payDate+'T12:00:00').getDate())
  const dc={}; days.forEach(d=>{dc[d]=(dc[d]||0)+1})
  const realDay = parseInt(Object.entries(dc).sort((a,b)=>b[1]-a[1])[0]?.[0]||'15')
  const exPayOffset = ticker.includes('.')?13:25
  const lastPaid = histDivs.find(d=>d.payDate<today)
  const perPayment = lastPaid?.amount||null
  const refDt = new Date((lastPaid?.payDate||histDivs[0]?.payDate)+'T12:00:00')
  const refDate = new Date(refDt.getFullYear(),refDt.getMonth(),realDay).toISOString().split('T')[0]
  const allFuture = generateDividendDates(refDate,frequency,2)
    .filter(d=>d.date>today)
    .map(({date,isExact})=>{
      const p=new Date(date+'T12:00:00'),e=new Date(p);e.setDate(e.getDate()-exPayOffset)
      return {date,exDate:e.toISOString().split('T')[0],isExact}
    })
  return {
    nextExDate:allFuture[0]?.exDate||null, nextPayDate:allFuture[0]?.date||null,
    lastExDate:null, lastPayDate:lastPaid?.payDate||null,
    earningsStart:null, epsEstimate:null,
    dividendRate:perPayment&&frequency?+(perPayment*frequency).toFixed(4):null,
    dividendYield:null, frequency, exPayOffsetDays:exPayOffset,
    perPayment, realDay, allDates:allFuture,
    histDivs:histDivs.slice(0,12), refPayDate:refDate,
    source:'yahoo-only',
  }
}

export const fetchNextDividend = fetchDividendInfo

export function useDividends(uid) {
  const [dividends, setDividends] = useState([])
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db,'users',uid,'dividends'), orderBy('payDate','desc'))
    return onSnapshot(q, snap=>setDividends(snap.docs.map(d=>({id:d.id,...d.data()}))))
  }, [uid])

  const addDividend = useCallback(async ({assetId,assetName,ticker,amount,payDate,shares,currency='EUR',note=''})=>{
    if (!uid) return
    const amt=parseFloat(amount)||0, shr=parseFloat(shares)||0
    await addDoc(collection(db,'users',uid,'dividends'),{
      assetId,assetName,ticker,amount:amt,shares:shr,
      perShare:shr>0?amt/shr:0,currency,payDate,note,createdAt:serverTimestamp(),
    })
  },[uid])

  const removeDividend = useCallback(async(id)=>{
    if(!uid)return
    await deleteDoc(doc(db,'users',uid,'dividends',id))
  },[uid])

  const byMonth = dividends.reduce((acc,d)=>{
    const key=d.payDate?.slice(0,7)||'desconegut'
    acc[key]=(acc[key]||0)+(d.amount||0);return acc
  },{})
  const thisYear=new Date().getFullYear().toString()
  const totalThisYear=dividends.filter(d=>d.payDate?.startsWith(thisYear)).reduce((s,d)=>s+d.amount,0)
  const totalAll=dividends.reduce((s,d)=>s+d.amount,0)
  return {dividends,addDividend,removeDividend,byMonth,totalThisYear,totalAll}
}