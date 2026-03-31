import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtEur, fmtPct } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const PERIODS = [
  { id: '1W',  label: '1S',  days: 7    },
  { id: '1M',  label: '1M',  days: 30   },
  { id: '3M',  label: '3M',  days: 90   },
  { id: '1Y',  label: '1A',  days: 365  },
  { id: 'ALL', label: 'Tot', days: 9999 },
]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

  .nwt { font-family:'Geist',sans-serif; display:flex; flex-direction:column; gap:12px; }

  .nwt-title { font-size:18px; font-weight:600; color:rgba(255,255,255,0.90); letter-spacing:-0.3px; margin-bottom:4px; }
  .nwt-sub { font-size:13px; color:rgba(255,255,255,0.35); margin-bottom:0; }

  /* Panel principal */
  .nwt-panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 22px 20px 18px;
  }

  .nwt-hdr { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; }

  /* Valor gran */
  .nwt-amount { display:flex; align-items:baseline; gap:5px; margin-bottom:8px; }
  .nwt-cur { font-size:16px; font-weight:400; color:rgba(255,255,255,0.38); padding-bottom:6px; }
  .nwt-total { font-size:clamp(34px,5vw,48px); font-weight:700; color:#fff; letter-spacing:-2px; line-height:1; font-variant-numeric:tabular-nums; }
  .nwt-total-dec { font-size:55%; font-weight:400; opacity:0.35; letter-spacing:-0.5px; }

  .nwt-change {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; font-family: 'Geist Mono', monospace;
    padding: 4px 10px; border-radius: 20px;
  }
  .nwt-change.pos { color:rgba(80,210,110,0.90); background:rgba(50,200,80,0.10); }
  .nwt-change.neg { color:rgba(255,90,70,0.90); background:rgba(255,60,40,0.10); }

  /* Period tabs */
  .nwt-tabs { display:flex; gap:2px; background:rgba(255,255,255,0.04); border-radius:20px; padding:3px; flex-shrink:0; align-self:flex-start; }
  .nwt-tab { padding:5px 12px; border-radius:16px; border:none; background:transparent; font-family:'Geist',sans-serif; font-size:12px; font-weight:600; color:rgba(255,255,255,0.30); cursor:pointer; transition:all 100ms; }
  .nwt-tab.on { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.85); }
  .nwt-tab:hover:not(.on) { color:rgba(255,255,255,0.55); }

  /* Empty */
  .nwt-empty { padding:48px 0; text-align:center; }
  .nwt-empty-main { font-size:13px; color:rgba(255,255,255,0.30); font-weight:500; margin-bottom:4px; }
  .nwt-empty-sub { font-size:11px; color:rgba(255,255,255,0.18); }

  /* Stats */
  .nwt-stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0; padding-top: 16px; margin-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .nwt-stat { position:relative; padding-right:16px; margin-bottom:4px; }
  .nwt-stat:not(:last-child)::after { content:''; position:absolute; right:8px; top:0; height:100%; width:1px; background:rgba(255,255,255,0.05); }
  .nwt-stat-l { font-size:10px; font-weight:500; color:rgba(255,255,255,0.26); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em; }
  .nwt-stat-v { font-size:13px; font-family:'Geist Mono',monospace; letter-spacing:-0.3px; font-weight:500; }
  .nwt-stat-v.pos { color:rgba(80,210,110,0.85); }
  .nwt-stat-v.neg { color:rgba(255,90,70,0.85); }
  .nwt-stat-v.neu { color:rgba(255,255,255,0.65); }

  /* Breakdown categories */
  .nwt-breakdown {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: rgba(255,255,255,0.05);
    border-radius: 16px; overflow: hidden;
  }
  .nwt-bk-card { background:#0d1117; padding:16px 14px; }
  .nwt-bk-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
  .nwt-bk-val { font-size:15px; font-weight:700; color:rgba(255,255,255,0.85); font-variant-numeric:tabular-nums; letter-spacing:-0.3px; margin-bottom:2px; }
  .nwt-bk-pct { font-size:11px; color:rgba(255,255,255,0.28); }
`

const NwtTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'9px 13px', fontFamily:"'Geist',sans-serif" }}>
      <p style={{ fontSize:10, color:'rgba(255,255,255,0.34)', marginBottom:5 }}>{label}</p>
      <p style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.88)', fontFamily:"'Geist Mono',monospace", letterSpacing:'-0.4px' }}>
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
        label: new Date(s.date).toLocaleDateString('ca-ES', { day:'2-digit', month:'short' }),
      }))
  }, [snapshots, period])

  const first      = filtered[0]?.total || currentTotal
  const change     = currentTotal - first
  const changePct  = first > 0 ? (change / first) * 100 : 0
  const isPos      = change >= 0

  const allTimeHigh  = Math.max(...snapshots.map(s => s.total), currentTotal)
  const totalGain    = currentTotal - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const monthlyChanges = useMemo(() => {
    if (snapshots.length < 2) return { best: null, worst: null }
    const byMonth = {}
    const sorted  = [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date))
    sorted.forEach(s => {
      const key = s.date.slice(0, 7)
      if (!byMonth[key]) byMonth[key] = { first: s.total, last: s.total }
      byMonth[key].last = s.total
    })
    const changes = Object.entries(byMonth).map(([, { first, last }]) => ({ change: last - first }))
    if (!changes.length) return { best: null, worst: null }
    return {
      best:  changes.reduce((a, b) => b.change > a.change ? b : a),
      worst: changes.reduce((a, b) => b.change < a.change ? b : a),
    }
  }, [snapshots])

  const volatility = useMemo(() => {
    if (filtered.length < 5) return null
    const returns  = filtered.slice(1).map((s, i) => (s.total - filtered[i].total) / filtered[i].total)
    const mean     = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
    return (Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(1)
  }, [filtered])

  const lastSnap  = [...snapshots].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const chartData = filtered.length > 0 ? filtered : [{ label: 'Avui', total: currentTotal }]
  const minVal    = Math.min(...chartData.map(s => s.total)) * 0.97
  const maxVal    = Math.max(...chartData.map(s => s.total)) * 1.02

  const [intPart, decPart] = fmtEur(currentTotal).replace('€','').trim().split(',')

  return (
    <div className="nwt">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div>
        <h2 className="nwt-title">Evolució del patrimoni</h2>
        <p className="nwt-sub">Historial diari del valor total del portfoli</p>
      </div>

      <div className="nwt-panel">
        <div className="nwt-hdr">
          <div>
            <div className="nwt-amount">
              <span className="nwt-cur">€</span>
              <span className="nwt-total">{intPart}<span className="nwt-total-dec">,{decPart}</span></span>
            </div>
            <span className={`nwt-change ${isPos ? 'pos' : 'neg'}`}>
              {isPos ? '▲' : '▼'} {fmtEur(Math.abs(change))} &nbsp;·&nbsp; {isPos ? '+' : ''}{fmtPct(Math.abs(changePct))} en el període
            </span>
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
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top:4, right:0, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="nwtG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPos ? 'rgba(80,210,110,0.22)' : 'rgba(255,90,70,0.18)'} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="label"
                tick={{ fontSize:10, fontFamily:'Geist', fill:'rgba(255,255,255,0.22)' }}
                axisLine={false} tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 5) - 1)}
              />
              <YAxis domain={[minVal, maxVal]}
                tick={{ fontSize:10, fontFamily:'Geist', fill:'rgba(255,255,255,0.22)' }}
                axisLine={false} tickLine={false} width={46}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`}
              />
              <ReferenceLine y={first} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" strokeWidth={1} />
              <Tooltip content={<NwtTooltip />} cursor={{ stroke:'rgba(255,255,255,0.10)', strokeWidth:1 }} />
              <Area
                type="monotone" dataKey="total"
                stroke={isPos ? 'rgba(80,210,110,0.80)' : 'rgba(255,90,70,0.80)'}
                strokeWidth={2} fill="url(#nwtG)" dot={false}
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

      {/* Breakdown categories */}
      {lastSnap && (
        <div className="nwt-breakdown">
          {[
            { label:'Inversions', val:lastSnap.invValue,    color:'rgba(100,155,255,0.85)' },
            { label:'Estalvis',   val:lastSnap.savValue,    color:'rgba(80,210,110,0.85)'  },
            { label:'Crypto',     val:lastSnap.cryptoValue, color:'rgba(255,170,70,0.85)'  },
          ].map(({ label, val, color }) => {
            const pct = currentTotal > 0 ? (val / currentTotal) * 100 : 0
            return (
              <div key={label} className="nwt-bk-card">
                <p className="nwt-bk-label" style={{ color }}>{label}</p>
                <p className="nwt-bk-val">{fmtEur(val || 0)}</p>
                <p className="nwt-bk-pct">{pct.toFixed(1)}%</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}