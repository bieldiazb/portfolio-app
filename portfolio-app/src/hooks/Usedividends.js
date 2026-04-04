// ─── hooks/useDividends.js ────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'

function tsToDate(ts) {
  if (!ts) return null
  try { return new Date(ts * 1000).toISOString().split('T')[0] }
  catch { return null }
}

export function generateDividendDates(refDate, frequency, yearsAhead = 1) {
  if (!refDate || !frequency) return []
  const monthGap  = Math.round(12 / frequency)
  const refDt     = new Date(refDate + 'T12:00:00')
  const refDay    = refDt.getDate()
  const now       = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const limit     = new Date(now.getFullYear() + yearsAhead, 11, 31)
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
    // ── Dues crides en paral·lel ─────────────────────────────────────────────
    const [chartRes, summaryRes] = await Promise.all([
      fetch(`/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=dividends`,
            { signal: AbortSignal.timeout(10000) }),
      fetch(`/yahoo/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=calendarEvents,summaryDetail`,
            { signal: AbortSignal.timeout(10000) }),
    ])

    // ── Chart → historial pay dates reals ────────────────────────────────────
    let histDivs = [], dividendRate = null, dividendYield = null
    let metaExDate = null, metaPayDate = null

    if (chartRes.ok) {
      const j = await chartRes.json()
      const r = j?.chart?.result?.[0]
      if (r) {
        const m   = r.meta || {}
        dividendRate  = m.dividendRate  || null
        dividendYield = m.dividendYield || null
        // meta pot tenir exDividendDate i currentDividendDate
        if (m.exDividendDate)     metaExDate  = tsToDate(m.exDividendDate)
        if (m.currentDividendDate) metaPayDate = tsToDate(m.currentDividendDate)

        const raw = r.events?.dividends ? Object.values(r.events.dividends) : []
        histDivs = raw
          .map(d => ({ date: tsToDate(d.date), amount: d.amount, ts: d.date }))
          .filter(d => d.date)
          .sort((a, b) => b.ts - a.ts)
      }
    }

    // ── quoteSummary → earnings + ex/pay date confirmat ──────────────────────
    let earningsStart = null, epsEstimate = null
    let calExDate = null, calPayDate = null

    if (summaryRes.ok) {
      const j   = await summaryRes.json()
      const r   = j?.quoteSummary?.result?.[0] || {}
      const cal = r.calendarEvents || {}
      const sd  = r.summaryDetail  || {}

      // Ex-date i pay-date de calendarEvents (últim dividend confirmat per Yahoo)
      // Nota: Yahoo dona l'últim pagament, no el futur
      if (cal.exDividendDate?.raw)  calExDate  = tsToDate(cal.exDividendDate.raw)
      if (cal.dividendDate?.raw)    calPayDate = tsToDate(cal.dividendDate.raw)

      // EARNINGS: earningsDate és array [{raw: timestamp, fmt: "Apr 23, 2026"}]
      // NO filtrem per today — mostrem sempre el proper earnings call
      const eDates = (cal?.earnings?.earningsDate || [])
        .map(d => {
          const ts = typeof d === 'object' ? (d.raw ?? null) : d
          return typeof ts === 'number' ? tsToDate(ts) : null
        })
        .filter(Boolean)
        .sort()
      earningsStart = eDates[0] || null
      epsEstimate   = typeof cal?.earnings?.earningsAverage?.raw === 'number'
                      ? cal.earnings.earningsAverage.raw : null

      if (!dividendRate)  dividendRate  = sd?.dividendRate?.raw  || null
      if (!dividendYield) dividendYield = sd?.dividendYield?.raw || null
    }

    // Combinem: preferim calendarEvents, fallback a meta del chart
    const lastKnownExDate  = calExDate  || metaExDate  || null
    const lastKnownPayDate = calPayDate || metaPayDate || null

    // ── Actiu sense dividends ─────────────────────────────────────────────────
    if (!histDivs.length) {
      return {
        nextExDate: null, nextPayDate: null,
        lastExDate: lastKnownExDate, lastPayDate: lastKnownPayDate,
        earningsStart, epsEstimate,
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
      const avg = gaps.reduce((a,b)=>a+b,0) / gaps.length
      frequency = avg<=1.5?12 : avg<=2.5?6 : avg<=4.5?4 : avg<=7?2 : 1
    }

    // ── Dia del mes real (moda dels últims pagaments) ─────────────────────────
    const days = histDivs.slice(0, 8).map(d => new Date(d.date + 'T12:00:00').getDate())
    const dayCount = {}
    days.forEach(d => { dayCount[d] = (dayCount[d]||0)+1 })
    const realDay = parseInt(Object.entries(dayCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||'1')

    // ── Offset ex→pay REAL des de les dates de Yahoo ──────────────────────────
    let exPayOffset = ticker.includes('.') ? 15 : 26  // fallback
    if (lastKnownExDate && lastKnownPayDate) {
      const diff = Math.round((new Date(lastKnownPayDate) - new Date(lastKnownExDate)) / 86400000)
      if (diff > 0 && diff < 60) exPayOffset = diff
    }

    // ── Import per pagament ───────────────────────────────────────────────────
    const lastPaidDiv = histDivs.find(d => d.date < today)
    const perPayment  = lastPaidDiv?.amount || histDivs[0]?.amount || null

    // ── Projecta dates futures des del darrer pay date real ───────────────────
    const lastRealPayDate = lastPaidDiv?.date || histDivs[0]?.date
    if (!lastRealPayDate) return null

    // Ajustem la referència al dia del mes real
    const refDt   = new Date(lastRealPayDate + 'T12:00:00')
    const refDate = new Date(refDt.getFullYear(), refDt.getMonth(), realDay)
      .toISOString().split('T')[0]

    const payDates    = generateDividendDates(refDate, frequency, 2)
    const futureDates = payDates.filter(d => d.date > today)

    const allDates = futureDates.map(({ date, isExact }) => {
      const payDt = new Date(date + 'T12:00:00')
      const exDt  = new Date(payDt); exDt.setDate(exDt.getDate() - exPayOffset)
      return { date, exDate: exDt.toISOString().split('T')[0], isExact }
    })

    const nextEntry   = allDates[0] || null
    const nextPayDate = nextEntry?.date   || null
    const nextExDate  = nextEntry?.exDate || null

    return {
      nextExDate,          // proper ex-date PROJECTAT (basat en historial)
      nextPayDate,         // proper pay date PROJECTAT
      lastExDate:  lastKnownExDate,   // últim ex-date CONFIRMAT per Yahoo
      lastPayDate: lastKnownPayDate,  // últim pay date CONFIRMAT per Yahoo
      earningsStart,       // proper earnings call (Yahoo quoteSummary)
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
      histDivs: histDivs.slice(0, 12).map(d => ({ ...d, exDate: null })),
      refPayDate: refDate,
      source: 'yahoo-historial',
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