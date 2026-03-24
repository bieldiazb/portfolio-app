// ─── NetWorthTimeline.v2.jsx ────────────────────────────────────────────────
//
// Guarda un snapshot diari del patrimoni total a Firestore i el mostra
// com un gràfic de línia amb àrea gradient.
//
// Firestore path: users/{uid}/snapshots/{YYYY-MM-DD}
//   { date, total, invValue, savValue, cryptoValue }
//
// Props:
//   snapshots   — array de { date, total, invValue, savValue, cryptoValue }
//   currentTotal — valor actual del portfoli (per mostrar el número gran)
//   totalCost    — capital total aportat
//
// useNetWorthSnapshots hook (al final del fitxer):
//   Crida des d'App per desar un snapshot quan les dades canvien

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const PERIODS = [
  { id: '1W', label: '1S', days: 7   },
  { id: '1M', label: '1M', days: 30  },
  { id: '3M', label: '3M', days: 90  },
  { id: '1Y', label: '1A', days: 365 },
  { id: 'ALL',label: 'Tot',days: 9999 },
]

const tlStyles = `
  .nwt { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  .nwt-panel { border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; background: rgba(255,255,255,0.015); }

  .nwt-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }

  .nwt-total { font-size: clamp(28px, 4vw, 38px); font-weight: 300; color: rgba(255,255,255,0.90); letter-spacing: -1.8px; line-height: 1; }
  .nwt-total-dec { font-size: 55%; opacity: 0.45; }
  .nwt-change { font-size: 12px; font-family: 'Geist Mono', monospace; margin-top: 5px; }
  .nwt-change.pos { color: rgba(80,210,110,0.85); }
  .nwt-change.neg { color: rgba(255,90,70,0.85); }

  .nwt-period-tabs { display: flex; gap: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; padding: 2px; flex-shrink: 0; }
  .nwt-ptab { padding: 4px 10px; border-radius: 3px; border: none; background: transparent; font-family: 'Geist Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.28); cursor: pointer; transition: all 100ms; }
  .nwt-ptab.on { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.72); }

  .nwt-stats { display: flex; gap: 0; padding-top: 14px; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; }
  .nwt-stat { flex: 1; padding-right: 16px; position: relative; min-width: 80px; margin-bottom: 4px; }
  .nwt-stat:not(:last-child)::after { content: ''; position: absolute; right: 8px; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.05); }
  .nwt-stat-l { font-size: 10px; color: rgba(255,255,255,0.26); margin-bottom: 3px; letter-spacing: 0.02em; }
  .nwt-stat-v { font-size: 12px; font-weight: 400; font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .nwt-stat-v.pos { color: rgba(80,210,110,0.80); }
  .nwt-stat-v.neg { color: rgba(255,90,70,0.80); }
  .nwt-stat-v.neu { color: rgba(255,255,255,0.60); }

  .nwt-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
  .nwt-empty-sub { font-size: 10px; color: rgba(255,255,255,0.14); margin-top: 4px; }
`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#121212', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 6, padding: '10px 13px', fontFamily: "'Geist', sans-serif",
      pointerEvents: 'none',
    }}>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', marginBottom: 6 }}>{label}</p>
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
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const list = snapshots
      .filter(s => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    // Format dates per display
    return list.map(s => ({
      ...s,
      label: new Date(s.date).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }),
    }))
  }, [snapshots, period])

  const first = filtered[0]?.total || currentTotal
  const change = currentTotal - first
  const changePct = first > 0 ? (change / first) * 100 : 0
  const isPos = change >= 0

  const maxVal = Math.max(...filtered.map(s => s.total), currentTotal)
  const minVal = Math.min(...filtered.map(s => s.total), currentTotal)
  const allTimeHigh = Math.max(...snapshots.map(s => s.total), currentTotal)
  const totalGain = currentTotal - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  // Volatilitat simple (desv. estàndard de retorns diaris)
  const volatility = useMemo(() => {
    if (filtered.length < 5) return null
    const returns = filtered.slice(1).map((s, i) => (s.total - filtered[i].total) / filtered[i].total)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
    return (Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(1)
  }, [filtered])

  const chartData = filtered.length > 0 ? filtered : [{ label: 'Avui', total: currentTotal }]

  const [intPart, decPart] = fmtEur(currentTotal).split(',')

  return (
    <div className="nwt">
      <style>{`${SHARED_STYLES}${tlStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Evolució del patrimoni</h2>
        <p className="sec-v2-sub">Historial del valor total del portfoli</p>
      </div>

      <div className="nwt-panel">
        <div className="nwt-header">
          <div>
            <div className="nwt-total">
              {intPart}<span className="nwt-total-dec">,{decPart}</span>
            </div>
            <div className={`nwt-change ${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '▲' : '▼'} {fmtEur(Math.abs(change))} ({fmtPct(Math.abs(changePct))}) en el període
            </div>
          </div>
          <div className="nwt-period-tabs">
            {PERIODS.map(p => (
              <button key={p.id} className={`nwt-ptab${period === p.id ? ' on' : ''}`} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {snapshots.length < 2 ? (
          <div className="nwt-empty">
            <p>Les dades s'acumulen amb l'ús</p>
            <p className="nwt-empty-sub">El gràfic apareixerà quan hi hagi més d'un dia de dades</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPos ? 'rgba(80,210,110,0.20)' : 'rgba(255,90,70,0.18)'} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.22)' }}
                axisLine={false} tickLine={false}
                interval={Math.floor(chartData.length / 5)} />
              <YAxis domain={[minVal * 0.97, maxVal * 1.02]}
                tick={{ fontSize: 9, fontFamily: 'Geist', fill: 'rgba(255,255,255,0.22)' }}
                axisLine={false} tickLine={false} width={48}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="total" stroke={isPos ? 'rgba(80,210,110,0.75)' : 'rgba(255,90,70,0.75)'}
                strokeWidth={1.5} fill="url(#nwtGrad)" dot={false} />
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
          {volatility && (
            <div className="nwt-stat">
              <p className="nwt-stat-l">Volatilitat anual</p>
              <p className="nwt-stat-v neu">{volatility}%</p>
            </div>
          )}
          <div className="nwt-stat">
            <p className="nwt-stat-l">Snapshots</p>
            <p className="nwt-stat-v neu">{snapshots.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

