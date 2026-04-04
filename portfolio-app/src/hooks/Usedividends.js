// ─── hooks/useDividends.js ────────────────────────────────────────────────────
// Dividends: Yahoo /v8/finance/chart (únic endpoint que funciona sense auth)
// Earnings:  Finnhub /calendar/earnings (gratuït, 60 crides/minut)

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

export async function fetchDividendInfo(ticker) {
  const today     = new Date().toISOString().split('T')[0]
  const isEur     = ticker.includes('.')
  // Finnhub usa ticker sense extensió (LMT, EUNL, VUAA...)
  const fhSymbol  = ticker.split('.')[0]

  // ── 1. Yahoo chart — historial PAY dates reals ──────────────────────────────
  // Únic endpoint Yahoo que NO requereix auth i funciona sempre
  let histDivs = [], dividendRate = null, dividendYield = null

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
      histDivs = raw
        .map(d => ({ payDate: tsToDate(d.date), amount: d.amount, ts: d.date }))
        .filter(d => d.payDate)
        .sort((a, b) => b.ts - a.ts)
    }
  } catch {}

  console.log(`[Div] ${ticker} Yahoo histDivs:${histDivs.length}`)

  // ── 2. Finnhub — earnings calendar (gratuït ✓) ──────────────────────────────
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
      earningsStart = list[0]?.date                                           || null
      epsEstimate   = list[0]?.epsEstimate != null ? parseFloat(list[0].epsEstimate) : null
    }
  } catch {}

  console.log(`[Div] ${ticker} earnings:${earningsStart} eps:${epsEstimate}`)

  // ── Sense dividends → retornem igualment (VUAA acumulació) ──────────────────
  if (!histDivs.length) {
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

  // ── 3. Freqüència real ───────────────────────────────────────────────────────
  let frequency = 4
  const gaps = []
  for (let i = 0; i < Math.min(histDivs.length - 1, 10); i++) {
    const a = new Date(histDivs[i].payDate), b = new Date(histDivs[i+1].payDate)
    const m = (a.getFullYear()-b.getFullYear())*12 + (a.getMonth()-b.getMonth())
    if (m > 0 && m <= 14) gaps.push(m)
  }
  if (gaps.length) {
    const avg = gaps.reduce((a,b)=>a+b,0) / gaps.length
    frequency = avg<=1.5?12 : avg<=2.5?6 : avg<=4.5?4 : avg<=7?2 : 1
  }

  // ── 4. Dia del mes real (moda) ───────────────────────────────────────────────
  // LMT paga el 27, EUNL el 15...
  const days = histDivs.slice(0, 10).map(d => new Date(d.payDate+'T12:00:00').getDate())
  const dc   = {}; days.forEach(d => { dc[d]=(dc[d]||0)+1 })
  const realDay = parseInt(Object.entries(dc).sort((a,b)=>b[1]-a[1])[0]?.[0] || '15')

  // ── 5. Offset ex→pay (fix per mercat) ───────────────────────────────────────
  const exPayOffset = isEur ? 13 : 25

  // ── 6. Darrer pay date real i import ────────────────────────────────────────
  const lastPaid    = histDivs.find(d => d.payDate < today)
  const perPayment  = lastPaid?.amount || histDivs[0]?.amount || null

  // ── 7. Ex-dates calculats des dels pay dates ─────────────────────────────────
  // Yahoo dona PAY dates. Ex-date = pay date - offset
  const histWithEx = histDivs.map(d => {
    const p = new Date(d.payDate+'T12:00:00')
    const e = new Date(p); e.setDate(e.getDate() - exPayOffset)
    return { ...d, exDate: e.toISOString().split('T')[0] }
  })

  // ── 8. Projecta dates futures ────────────────────────────────────────────────
  const lastRealPayDate = lastPaid?.payDate || histDivs[0]?.payDate
  if (!lastRealPayDate) return null

  const refDt   = new Date(lastRealPayDate+'T12:00:00')
  const refDate = new Date(refDt.getFullYear(), refDt.getMonth(), realDay)
    .toISOString().split('T')[0]

  const futureDates = generateDividendDates(refDate, frequency, 2)
    .filter(d => d.date > today)
    .map(({ date, isExact }) => {
      const p = new Date(date+'T12:00:00')
      const e = new Date(p); e.setDate(e.getDate()-exPayOffset)
      return { date, exDate: e.toISOString().split('T')[0], isExact, isPast: false }
    })

  // Dates passades reals (últims 12 mesos per al calendari)
  const oneYearAgo = new Date(Date.now()-365*86400000).toISOString().split('T')[0]
  const pastDates  = histWithEx
    .filter(d => d.payDate >= oneYearAgo && d.payDate <= today)
    .map(d => ({ date: d.payDate, exDate: d.exDate, isExact: true, isPast: true }))

  const allDates = [...pastDates, ...futureDates]
    .sort((a, b) => a.date.localeCompare(b.date))

  const nextPayDate = futureDates[0]?.date   || null
  const nextExDate  = futureDates[0]?.exDate || null

  console.log(`[Div] ${ticker} freq:${frequency} day:${realDay} offset:${exPayOffset} next:${nextPayDate}`)

  return {
    nextExDate,
    nextPayDate,
    lastExDate:  histWithEx[0]?.exDate   || null,
    lastPayDate: lastPaid?.payDate        || null,
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
    allDates,
    histDivs: histWithEx.slice(0, 12),
    refPayDate: refDate,
    source: 'yahoo-chart+finnhub-earnings',
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