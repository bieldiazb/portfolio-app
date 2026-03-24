import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const PERIODS = [
  { id: '1W',  label: '1S',  days: 7   },
  { id: '1M',  label: '1M',  days: 30  },
  { id: '3M',  label: '3M',  days: 90  },
  { id: '1Y',  label: '1A',  days: 365 },
  { id: 'ALL', label: 'Tot', days: 9999 },
]

const styles = `
  .nwt { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .nwt-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }

  .nwt-hdr { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }

  .nwt-total { font-size: clamp(28px, 5vw, 42px); font-weight: 300; color: rgba(255,255,255,0.90); letter-spacing: -2px; line-height: 1; font-family: 'Geist', sans-serif; }
  .nwt-total-dec { font-size: 55%; opacity: 0.45; }
  .nwt-change { font-size: 12px; font-family: 'Geist Mono', monospace; margin-top: 5px; }
  .nwt-change.pos { color: rgba(80,210,110,0.85); }
  .nwt-change.neg { color: rgba(255,90,70,0.85); }

  .nwt-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; padding: 2px; flex-shrink: 0; }
  .nwt-tab { padding: 4px 10px; border-radius: 3px; border: none; background: transparent; font-family: 'Geist Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.28); cursor: pointer; transition: all 100ms; }
  .nwt-tab.on { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.72); }

  .nwt-empty { padding: 48px 0; text-align: center; }
  .nwt-empty-main { font-size: 12px; color: rgba(255,255,255,0.28); }
  .nwt-empty-sub { font-size: 10px; color: rgba(255,255,255,0.16); margin-top: 4px; }

  .nwt-stats { display: flex; flex-wrap: wrap; gap: 0; padding-top: 14px; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.05); }
  .nwt-stat { flex: 1; min-width: 80px; padding-right: 16px; position: relative; margin-bottom: 4px; }
  .nwt-stat:not(:last-child)::after { content: ''; position: absolute; right: 8px; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.05); }
  .nwt-stat-l { font-size: 10px; color: rgba(255,255,255,0.26); margin-bottom: 3px; }
  .nwt-stat-v { font-size: 12px; font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .nwt-stat-v.pos { color: rgba(80,210,110,0.80); }
  .nwt-stat-v.neg { color: rgba(255,90,70,0.80); }
  .nwt-stat-v.neu { color: rgba(255,255,255,0.58); }

  /* Mini sparklines per categoria */
  .nwt-breakdown { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  .nwt-bk-card { border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 12px 14px; background: rgba(255,255,255,0.02); }
  .nwt-bk-label { font-size: 10px; color: rgba(255,255,255,0.26); margin-bottom: 4px; letter-spacing: 0.03em; }
  .nwt-bk-val { font-size: 13px; font-weight: 400; font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; color: rgba(255,255,255,0.72); }
  .nwt-bk-pct { font-size: 10px; font-family: 'Geist Mono', monospace; margin-top: 2px; }
  .nwt-bk-pct.pos { color: rgba(80,210,110,0.72); }
  .nwt-bk-pct.neg { color: rgba(255,90,70,0.72); }
`

const NwtTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6, padding: '9px 12px', fontFamily: "'Geist', sans-serif" }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.34)', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.85)', fontFamily: "'Geist Mono', monospace", letterSpacing: '-0.4px' }}>
        {fmtEur(payload[0]?.value || 0)}
      </p>
    </div>
  )
}

export default function NetWorthTimeline({ snapshots = [], currentTotal, totalCost }) {
  const [period, setPeriod] = useState('1Y')

  const filtered = useMemo(() => {
    const days = PERIODS.find(p => p.id === period)?.days ?? 365
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
    return [...snapshots]
      .filter(s => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        ...s,
        label: new Date(s.date).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }),
      }))
  }, [snapshots, period])

  const first    = filtered[0]?.total || currentTotal
  const change   = currentTotal - first
  const changePct = first > 0 ? (change / first) * 100 : 0
  const isPos    = change >= 0

  const allTimeHigh = Math.max(...snapshots.map(s => s.total), currentTotal)
  const totalGain   = currentTotal - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  // Millor i pitjor mes
  const monthlyChanges = useMemo(() => {
    if (snapshots.length < 2) return { best: null, worst: null }
    const byMonth = {}
    const sorted  = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date))
    sorted.forEach(s => {
      const key = s.date.slice(0, 7) // YYYY-MM
      if (!byMonth[key]) byMonth[key] = { first: s.total, last: s.total }
      byMonth[key].last = s.total
    })
    const changes = Object.entries(byMonth).map(([month, { first, last }]) => ({
      month,
      change: last - first,
    }))
    if (!changes.length) return { best: null, worst: null }
    return {
      best:  changes.reduce((a, b) => b.change > a.change ? b : a),
      worst: changes.reduce((a, b) => b.change < a.change ? b : a),
    }
  }, [snapshots])

  const volatility = useMemo(() => {
    if (filtered.length < 5) return null
    const returns = filtered.slice(1).map((s, i) => (s.total - filtered[i].total) / filtered[i].total)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
    return (Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(1)
  }, [filtered])

  // Últim snapshot per breakdown categories
  const lastSnap = snapshots.sort((a, b) => new Date(b.date) - new Date(a.date))[0]

  const [intPart, decPart] = fmtEur(currentTotal).split(',')
  const chartData = filtered.length > 0 ? filtered : [{ label: 'Avui', total: currentTotal }]
  const minVal = Math.min(...chartData.map(s => s.total)) * 0.97
  const maxVal = Math.max(...chartData.map(s => s.total)) * 1.02

  return (
    <div className="nwt">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="sec-v2-title">Evolució del patrimoni</h2>
        <p className="sec-v2-sub">Historial diari del valor total del portfoli</p>
      </div>

      <div className="nwt-panel">
        <div className="nwt-hdr">
          <div>
            <div className="nwt-total">
              {intPart}<span className="nwt-total-dec">,{decPart}</span>
            </div>
            <div className={`nwt-change ${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '▲' : '▼'} {fmtEur(Math.abs(change))} ({fmtPct(Math.abs(changePct))}) en el període
            </div>
          </div>
          <div className="nwt-tabs">
            {PERIODS.map(p => (
              <button key={p.id} className={`nwt-tab${period === p.id ? ' on' : ''}`} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {snapshots.length < 2 ? (
          <div className="nwt-empty">
            <p className="nwt-empty-main">Les dades s'acumulen automàticament cada dia</p>
            <p className="nwt-empty-sub">El gràfic apareixerà demà amb el primer punt d'historial</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwtG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPos ? 'rgba(80,210,110,0.22)' : 'rgba(255,90,70,0.18)'} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="label"
                tick={{ fontSize: 9, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.22)' }}
                axisLine={false} tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 5) - 1)}
              />
              <YAxis domain={[minVal, maxVal]}
                tick={{ fontSize: 9, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.22)' }}
                axisLine={false} tickLine={false} width={46}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              />
              <ReferenceLine
                y={first}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Tooltip content={<NwtTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="total"
                stroke={isPos ? 'rgba(80,210,110,0.75)' : 'rgba(255,90,70,0.75)'}
                strokeWidth={1.5} fill="url(#nwtG)" dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="nwt-stats">
          <div className="nwt-stat">
            <p className="nwt-stat-l">Màxim històric</p>
            <p className="nwt-stat-v neu">{fmtEur(allTimeHigh)}</p>
          </div>
          <div className="nwt-stat">
            <p className="nwt-stat-l">Guany total</p>
            <p className={`nwt-stat-v ${totalGain >= 0 ? 'pos' : 'neg'}`}>
              {totalGain >= 0 ? '+' : ''}{fmtEur(totalGain)} ({fmtPct(totalGainPct)})
            </p>
          </div>
          {monthlyChanges.best && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Millor mes</p>
              <p className="nwt-stat-v pos">+{fmtEur(monthlyChanges.best.change)}</p>
            </div>
          )}
          {monthlyChanges.worst && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Pitjor mes</p>
              <p className="nwt-stat-v neg">{fmtEur(monthlyChanges.worst.change)}</p>
            </div>
          )}
          {volatility && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Volatilitat</p>
              <p className="nwt-stat-v neu">{volatility}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown per categoria */}
      {lastSnap && (
        <div className="nwt-breakdown">
          {[
            { label: 'Inversions', val: lastSnap.invValue, color: 'rgba(100,155,255,0.80)' },
            { label: 'Estalvis',   val: lastSnap.savValue, color: 'rgba(80,210,110,0.80)' },
            { label: 'Crypto',     val: lastSnap.cryptoValue, color: 'rgba(255,170,70,0.80)' },
          ].map(({ label, val, color }) => {
            const pct   = currentTotal > 0 ? (val / currentTotal) * 100 : 0
            return (
              <div key={label} className="nwt-bk-card">
                <p className="nwt-bk-label" style={{ color }}>{label}</p>
                <p className="nwt-bk-val">{fmtEur(val || 0)}</p>
                <p className={`nwt-bk-pct neu`} style={{ color: 'rgba(255,255,255,0.28)' }}>{pct.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}