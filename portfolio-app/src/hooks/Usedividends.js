// ─── hooks/useDividends.js ────────────────────────────────────────────────────
// Endpoints Yahoo que funcionen SENSE autenticació:
//   /v8/finance/chart  → exDividendDate, dividendDate, events.dividends
//   /v7/finance/quote  → earningsTimestampStart/End, epsForward, exDividendDate

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
  const today = new Date().toISOString().split('T')[0]

  try {
    // ── Dues crides en paral·lel (ambdós sense auth) ─────────────────────────
    const [chartRes, quoteRes] = await Promise.all([
      // Chart: historial dividends + meta (ex-date, pay-date, dividend rate)
      fetch(
        `/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends`,
        { signal: AbortSignal.timeout(10000) }
      ),
      // Quote v7: earnings timestamps + eps forward (sense auth ✓)
      fetch(
        `/yahoo/v7/finance/quote?symbols=${encodeURIComponent(ticker)}&fields=earningsTimestampStart,earningsTimestampEnd,earningsTimestamp,epsForward,epsTrailingTwelveMonths,exDividendDate,dividendDate`,
        { signal: AbortSignal.timeout(10000) }
      ),
    ])

    // ── Chart: historial + meta ───────────────────────────────────────────────
    let histDivs = [], dividendRate = null, dividendYield = null
    let metaExDate = null, metaPayDate = null

    if (chartRes.ok) {
      const j = await chartRes.json()
      const r = j?.chart?.result?.[0]
      if (r) {
        const m = r.meta || {}
        dividendRate  = m.dividendRate  || null
        dividendYield = m.dividendYield || null

        // meta.exDividendDate = últim ex-date confirmat (timestamp)
        // meta.currentDividendDate = últim pay-date confirmat (timestamp)
        metaExDate  = tsToDate(m.exDividendDate)
        metaPayDate = tsToDate(m.currentDividendDate) || tsToDate(m.dividendDate)

        const raw = r.events?.dividends ? Object.values(r.events.dividends) : []
        histDivs = raw
          .map(d => ({ date: tsToDate(d.date), amount: d.amount, ts: d.date }))
          .filter(d => d.date)
          .sort((a, b) => b.ts - a.ts)

        console.log(`[Div] ${ticker} meta exDate:${metaExDate} payDate:${metaPayDate} histDivs:${histDivs.length}`)
      }
    } else {
      console.warn(`[Div] ${ticker} chart error:`, chartRes.status)
    }

    // ── Quote v7: earnings + ex-date alternatiu ───────────────────────────────
    let earningsStart = null, earningsEnd = null, epsEstimate = null
    let quoteExDate = null, quotePayDate = null

    if (quoteRes.ok) {
      const j    = await quoteRes.json()
      const q    = j?.quoteResponse?.result?.[0] || {}

      console.log(`[Div] ${ticker} quote:`, JSON.stringify({
        earningsTimestampStart: q.earningsTimestampStart,
        earningsTimestampEnd:   q.earningsTimestampEnd,
        earningsTimestamp:      q.earningsTimestamp,
        exDividendDate:         q.exDividendDate,
        dividendDate:           q.dividendDate,
        epsForward:             q.epsForward,
      }))

      // Earnings: earningsTimestampStart/End = rang estimat, earningsTimestamp = últim
      const esStart = q.earningsTimestampStart
      const esEnd   = q.earningsTimestampEnd
      const eTs     = q.earningsTimestamp

      // Preferim earningsTimestampStart si és futur, sinó earningsTimestamp
      const startDate = tsToDate(esStart) || tsToDate(eTs)
      const endDate   = tsToDate(esEnd)

      earningsStart = startDate || null
      earningsEnd   = endDate   || null
      epsEstimate   = q.epsForward || null

      // Ex-date i pay-date del quote (alternativa al chart meta)
      quoteExDate  = tsToDate(q.exDividendDate)
      quotePayDate = tsToDate(q.dividendDate)

      console.log(`[Div] ${ticker} earnings:${earningsStart}~${earningsEnd} eps:${epsEstimate}`)
    } else {
      console.warn(`[Div] ${ticker} quote v7 error:`, quoteRes.status)
    }

    // Combinem ex-date/pay-date: quote té prioritat sobre chart meta
    const lastKnownExDate  = quoteExDate  || metaExDate  || null
    const lastKnownPayDate = quotePayDate || metaPayDate || null

    console.log(`[Div] ${ticker} lastExDate:${lastKnownExDate} lastPayDate:${lastKnownPayDate}`)

    // ── Sense historial = no paga dividends (ex: VUAA acc) ───────────────────
    if (!histDivs.length) {
      return {
        nextExDate: null, nextPayDate: null,
        lastExDate: lastKnownExDate, lastPayDate: lastKnownPayDate,
        earningsStart, earningsEnd, epsEstimate,
        dividendRate: null, dividendYield: null,
        frequency: 0, allDates: [], histDivs: [],
        perPayment: null, noDividends: true,
        source: 'yahoo-no-dividends',
      }
    }

    // ── Freqüència real ───────────────────────────────────────────────────────
    let frequency = 4
    const gaps = []
    for (let i = 0; i < Math.min(histDivs.length - 1, 10); i++) {
      const a = new Date(histDivs[i].date), b = new Date(histDivs[i+1].date)
      const m = (a.getFullYear()-b.getFullYear())*12 + (a.getMonth()-b.getMonth())
      if (m > 0 && m <= 14) gaps.push(m)
    }
    if (gaps.length) {
      const avg = gaps.reduce((a,b)=>a+b,0)/gaps.length
      frequency = avg<=1.5?12 : avg<=2.5?6 : avg<=4.5?4 : avg<=7?2 : 1
    }

    // ── Dia del mes real ──────────────────────────────────────────────────────
    const days = histDivs.slice(0, 8).map(d => new Date(d.date+'T12:00:00').getDate())
    const dc   = {}; days.forEach(d => { dc[d]=(dc[d]||0)+1 })
    const realDay = parseInt(Object.entries(dc).sort((a,b)=>b[1]-a[1])[0]?.[0]||'1')

    // ── Offset ex→pay ─────────────────────────────────────────────────────────
    let exPayOffset = ticker.includes('.') ? 15 : 26
    if (lastKnownExDate && lastKnownPayDate) {
      const diff = Math.round((new Date(lastKnownPayDate)-new Date(lastKnownExDate))/86400000)
      if (diff > 0 && diff < 60) exPayOffset = diff
    }

    // ── Darrer pay date real ──────────────────────────────────────────────────
    const lastPaidDiv     = histDivs.find(d => d.date < today)
    const lastRealPayDate = lastPaidDiv?.date || histDivs[0]?.date
    const perPayment      = lastPaidDiv?.amount || histDivs[0]?.amount || null

    if (!lastRealPayDate) return null

    // ── Projecta des del darrer pay date real mantenint el dia del mes ────────
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

    const nextPayDate = allFuture[0]?.date   || null
    const nextExDate  = allFuture[0]?.exDate || null

    return {
      nextExDate,           // proper ex-date PROJECTAT
      nextPayDate,          // proper pay date PROJECTAT
      lastExDate:  lastKnownExDate,   // últim ex-date CONFIRMAT
      lastPayDate: lastKnownPayDate,  // últim pay date CONFIRMAT
      earningsStart,        // earnings call (v7/quote)
      earningsEnd,
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
      histDivs: histDivs.slice(0,12).map(d => ({...d, exDate:null})),
      refPayDate: refDate,
      source: 'yahoo-chart+quote',
    }

  } catch (err) {
    console.warn(`fetchDividendInfo(${ticker}):`, err.message)
    return null
  }
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
      perShare:shr>0?amt/shr:0, currency, payDate, note,
      createdAt:serverTimestamp(),
    })
  }, [uid])

  const removeDividend = useCallback(async (id) => {
    if (!uid) return
    await deleteDoc(doc(db,'users',uid,'dividends',id))
  }, [uid])

  const byMonth = dividends.reduce((acc,d) => {
    const key=d.payDate?.slice(0,7)||'desconegut'
    acc[key]=(acc[key]||0)+(d.amount||0); return acc
  }, {})

  const thisYear      = new Date().getFullYear().toString()
  const totalThisYear = dividends.filter(d=>d.payDate?.startsWith(thisYear)).reduce((s,d)=>s+d.amount,0)
  const totalAll      = dividends.reduce((s,d)=>s+d.amount,0)

  return { dividends, addDividend, removeDividend, byMonth, totalThisYear, totalAll }
}