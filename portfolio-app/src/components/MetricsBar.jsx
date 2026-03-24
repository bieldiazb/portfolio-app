// ─── MetricsBar.v2.jsx ──────────────────────────────────────────────────────

import { fmtEur, fmtPct, getEffectiveValue } from '../utils/format'
import { SHARED_STYLES } from './design-tokens'

const mbStyles = `
  .mb-v2 {
    padding: 24px 28px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-family: 'Geist', sans-serif;
    flex-shrink: 0;
  }
  .mb-eyebrow {
    font-size: 10px; font-weight: 400;
    color: rgba(255,255,255,0.24);
    letter-spacing: 0.10em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  .mb-main { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
  .mb-total {
    font-size: clamp(32px, 4.5vw, 44px);
    font-weight: 300; color: rgba(255,255,255,0.90);
    letter-spacing: -2px; font-family: 'Geist', sans-serif; line-height: 1;
  }
  .mb-total-dec { font-size: 60%; opacity: 0.5; }
  .mb-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'Geist Mono', monospace;
    font-size: 11.5px; font-weight: 400;
    padding: 3px 8px; border-radius: 4px;
    letter-spacing: -0.1px;
  }
  .mb-badge.pos { color: rgba(80,210,110,0.85); background: rgba(60,200,90,0.08); border: 1px solid rgba(60,200,90,0.14); }
  .mb-badge.neg { color: rgba(255,90,70,0.85);  background: rgba(255,60,40,0.08); border: 1px solid rgba(255,60,40,0.14); }
  .mb-stats { display: flex; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; flex-wrap: wrap; gap: 0; }
  .mb-stat { flex: 1; padding-right: 20px; position: relative; min-width: 0; }
  .mb-stat:not(:last-child)::after {
    content: ''; position: absolute; right: 10px; top: 0;
    height: 100%; width: 1px; background: rgba(255,255,255,0.05);
  }
  .mb-stat-l { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.26); letter-spacing: 0.03em; margin-bottom: 4px; }
  .mb-stat-v { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.68); font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; white-space: nowrap; }
`

export function MetricsBar({ investments, savings, cryptos = [] }) {
  const invValue   = investments.reduce((s, i) => s + getEffectiveValue(i), 0)
  const invCost    = investments.reduce((s, i) => s + i.initialValue, 0)
  const savValue   = savings.reduce((s, sv) => s + sv.amount, 0)
  const cryptoVal  = cryptos.reduce((s, c) => s + (c.qty && c.currentPrice ? c.qty * c.currentPrice : c.initialValue || 0), 0)
  const cryptoCost = cryptos.reduce((s, c) => s + (c.initialValue || 0), 0)
  const total      = invValue + savValue + cryptoVal
  const totalCost  = invCost + cryptoCost
  const pg         = (invValue + cryptoVal) - (invCost + cryptoCost)
  const pgPct      = totalCost > 0 ? (pg / totalCost) * 100 : 0
  const isPos      = pg >= 0

  const [intPart, decPart] = fmtEur(total).split(',')

  return (
    <div className="mb-v2">
      <style>{`${SHARED_STYLES}${mbStyles}`}</style>
      <p className="mb-eyebrow">Valor total del portfoli</p>
      <div className="mb-main">
        <span className="mb-total">
          {intPart}<span className="mb-total-dec">,{decPart}</span>
        </span>
        <span className={`mb-badge ${isPos ? 'pos' : 'neg'}`}>
          {isPos ? '▲' : '▼'} {fmtEur(Math.abs(pg))} {fmtPct(pgPct)}
        </span>
      </div>
      <div className="mb-stats">
        <div className="mb-stat"><p className="mb-stat-l">Cost total</p><p className="mb-stat-v">{fmtEur(totalCost)}</p></div>
        <div className="mb-stat"><p className="mb-stat-l">Estalvis</p><p className="mb-stat-v">{fmtEur(savValue)}</p></div>
        <div className="mb-stat"><p className="mb-stat-l">Posicions</p><p className="mb-stat-v">{investments.length + cryptos.length}</p></div>
        <div className="mb-stat"><p className="mb-stat-l">Comptes</p><p className="mb-stat-v">{savings.length}</p></div>
      </div>
    </div>
  )
}

export default MetricsBar


