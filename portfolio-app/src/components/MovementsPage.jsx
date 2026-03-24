// ─── MovementsPage.v2.jsx ───────────────────────────────────────────────────
// Mostra l'historial de totes les inversions, estalvis i cryptos registrades,
// agrupades per mes, amb filtre per categoria.
//
// Props:
//   investments — array d'inversions (han de tenir .purchaseDate, .initialValue, .qty)
//   savings     — array d'estalvis (han de tenir .createdAt, .amount)
//   cryptos     — array de cryptos (han de tenir .purchaseDate, .initialValue, .qty)

import { useState, useMemo } from 'react'
import { fmtEur } from '../utils/format'
import { SHARED_STYLES, TYPE_COLORS } from './design-tokens'

const FILTERS = [
  { id: 'all',         label: 'Tots'       },
  { id: 'investments', label: 'Inversions' },
  { id: 'savings',     label: 'Estalvis'   },
  { id: 'crypto',      label: 'Crypto'     },
]

const TYPE_LABELS = {
  etf: 'ETF', stock: 'Acció', robo: 'Robo', efectiu: 'Efectiu', estalvi: 'Estalvi'
}

const movStyles = `
  .mv-page { font-family: 'Geist', sans-serif; display: flex; flex-direction: column; gap: 14px; }

  /* Filter tabs */
  .mv-tabs {
    display: flex; gap: 2px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 6px; padding: 3px;
  }
  .mv-tab {
    flex: 1; padding: 5px 0; border-radius: 4px;
    border: none; background: transparent;
    font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 400;
    color: rgba(255,255,255,0.30); cursor: pointer; transition: all 100ms; text-align: center;
  }
  .mv-tab.on {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.72); font-weight: 500;
  }

  /* Summary row */
  .mv-summary {
    display: flex; gap: 0;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 6px; overflow: hidden;
    background: rgba(255,255,255,0.015);
  }
  .mv-sum-item { flex: 1; padding: 12px 14px; position: relative; }
  .mv-sum-item:not(:last-child)::after {
    content: ''; position: absolute; right: 0; top: 15%; height: 70%;
    width: 1px; background: rgba(255,255,255,0.05);
  }
  .mv-sum-l { font-size: 10px; color: rgba(255,255,255,0.26); letter-spacing: 0.03em; margin-bottom: 4px; }
  .mv-sum-v { font-size: 14px; font-weight: 300; color: rgba(255,255,255,0.78); font-family: 'Geist Mono', monospace; letter-spacing: -0.4px; }

  /* Month group */
  .mv-group { margin-bottom: 18px; }
  .mv-group:last-child { margin-bottom: 0; }
  .mv-month {
    font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.24); letter-spacing: 0.06em; text-transform: uppercase;
    padding: 0 0 8px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    margin-bottom: 4px;
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .mv-month-total { font-family: 'Geist Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.28); font-weight: 400; }

  /* Movement row */
  .mv-row {
    display: flex; align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    cursor: default; transition: background 100ms;
  }
  .mv-row:last-child { border-bottom: none; }
  .mv-row:hover { background: rgba(255,255,255,0.015); border-radius: 4px; }

  .mv-date-col {
    font-family: 'Geist Mono', monospace;
    font-size: 10px; color: rgba(255,255,255,0.22);
    width: 28px; flex-shrink: 0; margin-right: 10px;
    text-align: center;
  }
  .mv-av {
    width: 26px; height: 26px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 600; flex-shrink: 0; margin-right: 9px;
    letter-spacing: 0.02em;
  }
  .mv-info { flex: 1; min-width: 0; }
  .mv-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.70); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mv-meta { font-size: 10px; color: rgba(255,255,255,0.24); margin-top: 1px; font-family: 'Geist Mono', monospace; }
  .mv-amount { font-family: 'Geist Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.68); text-align: right; flex-shrink: 0; min-width: 72px; }
  .mv-tag {
    font-size: 9px; font-weight: 500; padding: 1px 5px; border-radius: 3px;
    flex-shrink: 0; margin-left: 7px;
  }

  .mv-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); }
`

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return {
    day: d.getDate().toString().padStart(2, '0'),
    monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    monthLabel: d.toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' }),
  }
}

export default function MovementsPage({ investments = [], savings = [], cryptos = [] }) {
  const [filter, setFilter] = useState('all')

  // Normalitza tots els moviments en una llista plana
  const allMovements = useMemo(() => {
    const list = []

    investments.forEach(inv => {
      const dateStr = inv.purchaseDate || inv.createdAt || new Date().toISOString()
      const tc = TYPE_COLORS[inv.type] || TYPE_COLORS.etf
      list.push({
        id: `inv-${inv.id}`,
        category: 'investments',
        date: dateStr,
        name: inv.name,
        meta: [inv.qty && `${inv.qty} u.`, inv.ticker].filter(Boolean).join(' · '),
        amount: inv.initialValue,
        type: inv.type,
        typeLabel: TYPE_LABELS[inv.type] || inv.type,
        initials: inv.name.slice(0, 2).toUpperCase(),
        bg: tc.bg,
        color: tc.color,
      })
    })

    savings.forEach(s => {
      const dateStr = s.createdAt || s.purchaseDate || new Date().toISOString()
      list.push({
        id: `sav-${s.id}`,
        category: 'savings',
        date: dateStr,
        name: s.name,
        meta: s.rate ? `${s.rate}% TAE` : 'Sense interès',
        amount: s.amount,
        type: 'estalvi',
        typeLabel: 'Estalvi',
        initials: s.name.slice(0, 2).toUpperCase(),
        bg: 'rgba(80,200,110,0.10)',
        color: 'rgba(80,210,110,0.85)',
      })
    })

    cryptos.forEach(c => {
      const dateStr = c.purchaseDate || c.createdAt || new Date().toISOString()
      list.push({
        id: `cry-${c.id}`,
        category: 'crypto',
        date: dateStr,
        name: c.name,
        meta: [c.qty && `${c.qty} u.`, c.symbol].filter(Boolean).join(' · '),
        amount: c.initialValue || 0,
        type: 'crypto',
        typeLabel: c.symbol || 'Crypto',
        initials: (c.symbol || c.name).slice(0, 3).toUpperCase(),
        bg: 'rgba(255,160,60,0.10)',
        color: 'rgba(255,170,70,0.85)',
      })
    })

    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [investments, savings, cryptos])

  const filtered = filter === 'all'
    ? allMovements
    : allMovements.filter(m => m.category === filter)

  // Agrupa per mes
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(m => {
      const d = formatDate(m.date)
      if (!d) return
      if (!groups[d.monthKey]) groups[d.monthKey] = { label: d.monthLabel, items: [] }
      groups[d.monthKey].items.push({ ...m, day: d.day })
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  // Summary
  const totalInvested = filtered.reduce((s, m) => s + m.amount, 0)
  const countByType = {
    investments: filtered.filter(m => m.category === 'investments').length,
    savings:     filtered.filter(m => m.category === 'savings').length,
    crypto:      filtered.filter(m => m.category === 'crypto').length,
  }

  return (
    <div className="mv-page">
      <style>{`${SHARED_STYLES}${movStyles}`}</style>

      <div>
        <h2 className="sec-v2-title">Moviments</h2>
        <p className="sec-v2-sub">Historial de posicions registrades</p>
      </div>

      {/* Summary */}
      <div className="mv-summary">
        <div className="mv-sum-item">
          <p className="mv-sum-l">Total registrat</p>
          <p className="mv-sum-v">{fmtEur(totalInvested)}</p>
        </div>
        <div className="mv-sum-item">
          <p className="mv-sum-l">Inversions</p>
          <p className="mv-sum-v">{countByType.investments}</p>
        </div>
        <div className="mv-sum-item">
          <p className="mv-sum-l">Estalvis</p>
          <p className="mv-sum-v">{countByType.savings}</p>
        </div>
        <div className="mv-sum-item">
          <p className="mv-sum-l">Crypto</p>
          <p className="mv-sum-v">{countByType.crypto}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mv-tabs">
        {FILTERS.map(f => (
          <button key={f.id} className={`mv-tab${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="mv-empty">Cap moviment registrat</div>
      ) : (
        <div>
          {grouped.map(([key, group]) => {
            const monthTotal = group.items.reduce((s, m) => s + m.amount, 0)
            return (
              <div key={key} className="mv-group">
                <div className="mv-month">
                  <span style={{ textTransform: 'capitalize' }}>{group.label}</span>
                  <span className="mv-month-total">{fmtEur(monthTotal)}</span>
                </div>
                {group.items.map(m => (
                  <div key={m.id} className="mv-row">
                    <div className="mv-date-col">{m.day}</div>
                    <div className="mv-av" style={{ background: m.bg, color: m.color }}>
                      {m.initials}
                    </div>
                    <div className="mv-info">
                      <p className="mv-name">{m.name}</p>
                      {m.meta && <p className="mv-meta">{m.meta}</p>}
                    </div>
                    <div className="mv-amount">{fmtEur(m.amount)}</div>
                    <span className="mv-tag" style={{ background: m.bg, color: m.color }}>
                      {m.typeLabel}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}