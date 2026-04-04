// ─── hooks/useDividends.js ────────────────────────────────────────────────────
// IMPORTANT: Yahoo chart events.dividends → EX-DATES (no pay dates!)
// Ex-date LMT: Mar 2 → Pay date: Mar 27 (+25 dies) ✓ confirmat per l'usuari
//
// Dividends: Yahoo /v8/finance/chart (ex-dates reals)
// Earnings:  Finnhub /calendar/earnings (gratuït)

import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

function tsToDate(ts) {
  if (!ts || typeof ts !== 'number') return null
  // Afegim 12h per evitar problemes de timezone (UTC vs local)
  try { return new Date((ts + 43200) * 1000).toISOString().split('T')[0] }
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

export async function fetchDividendInfo(ticker) {
  const today    = new Date().toISOString().split('T')[0]
  const isEur    = ticker.includes('.')
  const fhSymbol = ticker.split('.')[0]

  // ── 1. Yahoo chart → EX-DATES reals ──────────────────────────────────────
  let exDates = [], dividendRate = null, dividendYield = null

  try {
    const res = await fetch(
      `/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (res.ok) {
      const j    = await res.json()
      const r    = j?.chart?.result?.[0]
      const meta = r?.meta || {}
      dividendRate  = meta.dividendRate  || null
      dividendYield = meta.dividendYield || null
      const raw = r?.events?.dividends ? Object.values(r.events.dividends) : []
      // Yahoo events.dividends → EX-DATES (confirmat: LMT ex=Mar2, pay=Mar27)
      exDates = raw
        .map(d => ({ exDate: tsToDate(d.date), amount: d.amount, ts: d.date }))
        .filter(d => d.exDate)
        .sort((a, b) => b.ts - a.ts)
    }
  } catch (e) {
    console.warn(`[Div] ${ticker} Yahoo error:`, e.message)
  }

  console.log(`[Div] ${ticker} Yahoo exDates:${exDates.length}`)

  // ── 2. Finnhub → Earnings (gratuït ✓) ────────────────────────────────────
  let earningsStart = null, epsEstimate = null

  try {
    const to  = new Date(Date.now() + 365*86400000).toISOString().split('T')[0]
    const qs  = new URLSearchParams({ path: '/calendar/earnings', symbol: fhSymbol, from: today, to })
    const res = await fetch(`/fh?${qs}`, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const j    = await res.json()
      const list = (j?.earningsCalendar || [])
        .filter(e => e.date && e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
      earningsStart = list[0]?.date        || null
      epsEstimate   = list[0]?.epsEstimate != null ? parseFloat(list[0].epsEstimate) : null
    }
  } catch {}

  console.log(`[Div] ${ticker} earnings:${earningsStart} eps:${epsEstimate}`)

  // ── Sense dividends ───────────────────────────────────────────────────────
  if (!exDates.length) {
    return {
      nextExDate: null, nextPayDate: null,
      lastExDate: null, lastPayDate: null,
      earningsStart, epsEstimate,
      dividendRate: null, dividendYield: null,
      frequency: 0, allDates: [], histDivs: [],
      perPayment: null, noDividends: true,
      source: 'yahoo-no-dividends',
    }
  }

  // ── 3. Freqüència des dels ex-dates ───────────────────────────────────────
  let frequency = 4
  const gaps = []
  for (let i = 0; i < Math.min(exDates.length - 1, 10); i++) {
    const a = new Date(exDates[i].exDate), b = new Date(exDates[i+1].exDate)
    const m = (a.getFullYear()-b.getFullYear())*12 + (a.getMonth()-b.getMonth())
    if (m > 0 && m <= 14) gaps.push(m)
  }
  if (gaps.length) {
    const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
    frequency = avg<=1.5?12 : avg<=2.5?6 : avg<=4.5?4 : avg<=7?2 : 1
  }

  // ── 4. Dia del mes real de l'EX-DATE (moda) ───────────────────────────────
  // LMT ex-dates: 2, 2, 2, 2... → realDay = 2
  // EUNL ex-dates: variable però al voltant de 10-15
  const exDays = exDates.slice(0, 10).map(d => new Date(d.exDate+'T12:00:00').getDate())
  const dc     = {}; exDays.forEach(d => { dc[d]=(dc[d]||0)+1 })
  const realExDay = parseInt(Object.entries(dc).sort((a,b)=>b[1]-a[1])[0]?.[0]||'1')

  // ── 5. Offset ex→pay real (fix per mercat) ────────────────────────────────
  // LMT: ex=Mar2, pay=Mar27 → offset=25 dies (confirmat per usuari)
  // ETFs europeus: ex≈dia15, pay≈dia22-30 → offset≈13-15 dies
  const exPayOffset = isEur ? 13 : 25

  // ── 6. Calculem pay dates des dels ex-dates ───────────────────────────────
  const histDivs = exDates.map(d => {
    const exDt  = new Date(d.exDate+'T12:00:00')
    const payDt = new Date(exDt); payDt.setDate(payDt.getDate() + exPayOffset)
    return {
      exDate:  d.exDate,
      payDate: payDt.toISOString().split('T')[0],
      amount:  d.amount,
    }
  })

  // ── 7. Import per pagament ────────────────────────────────────────────────
  const lastPaid   = histDivs.find(d => d.payDate < today)
  const perPayment = lastPaid?.amount || histDivs[0]?.amount || null

  // ── 8. Projecta des de l'últim ex-date real ───────────────────────────────
  // Usem l'ex-date com a referència (mantenim el dia del mes de l'ex-date)
  const lastRealExDate = exDates.find(d => d.exDate < today)?.exDate || exDates[0]?.exDate
  if (!lastRealExDate) return null

  const refDt     = new Date(lastRealExDate+'T12:00:00')
  const refExDate = new Date(refDt.getFullYear(), refDt.getMonth(), realExDay)
    .toISOString().split('T')[0]

  // Genera ex-dates futures i calcula pay dates corresponents
  const futureExDates = generateDividendDates(refExDate, frequency, 2)
    .filter(d => d.date > today)

  const futureDates = futureExDates.map(({ date: exDate, isExact }) => {
    const exDt  = new Date(exDate+'T12:00:00')
    const payDt = new Date(exDt); payDt.setDate(payDt.getDate() + exPayOffset)
    return {
      date:    payDt.toISOString().split('T')[0],  // pay date
      exDate,                                         // ex-date
      isExact,
      isPast: false,
    }
  })

  // Dates passades de l'historial (últims 12 mesos per al calendari)
  const oneYearAgo = new Date(Date.now()-365*86400000).toISOString().split('T')[0]
  const pastDates  = histDivs
    .filter(d => d.payDate >= oneYearAgo && d.payDate < today)
    .map(d => ({ date: d.payDate, exDate: d.exDate, isExact: true, isPast: true }))

  const allDates = [...pastDates, ...futureDates]
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextPayDate = futureDates[0]?.date   || null
  const nextExDate  = futureDates[0]?.exDate || null

  console.log(`[Div] ${ticker} freq:${frequency} exDay:${realExDay} offset:${exPayOffset} nextEx:${nextExDate} nextPay:${nextPayDate}`)

  return {
    nextExDate,
    nextPayDate,
    lastExDate:  histDivs[0]?.exDate  || null,
    lastPayDate: lastPaid?.payDate     || null,
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
    realExDay,
    allDates,
    histDivs: histDivs.slice(0, 12),  // sempre array ✓
    refExDate,
    source: 'yahoo-exdates+finnhub-earnings',
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
      perShare:shr>0?amt/shr:0,currency,payDate,note,
      createdAt:serverTimestamp(),
    })
  },[uid])

  const removeDividend = useCallback(async(id)=>{
    if(!uid)return
    await deleteDoc(doc(db,'users',uid,'dividends',id))
  },[uid])

  const byMonth = dividends.reduce((acc,d)=>{
    const key=d.payDate?.slice(0,7)||'desconegut'
    acc[key]=(acc[key]||0)+(d.amount||0); return acc
  },{})
  const thisYear=new Date().getFullYear().toString()
  const totalThisYear=dividends.filter(d=>d.payDate?.startsWith(thisYear)).reduce((s,d)=>s+d.amount,0)
  const totalAll=dividends.reduce((s,d)=>s+d.amount,0)
  return {dividends,addDividend,removeDividend,byMonth,totalThisYear,totalAll}
}