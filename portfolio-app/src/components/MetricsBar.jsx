// ─── MetricsBar.final.jsx — Cartera v3 ──────────────────────────────────────
import { SHARED_STYLES, COLORS, FONTS, RADIUS } from './design-tokens'

const styles = `
  .mb { font-family:${FONTS.sans}; display:flex; flex-direction:column; gap:1px; }

  /* Fila superior: valor gran + badge */
  .mb-hero {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.lg} ${RADIUS.lg} 0 0;
    padding: 22px 20px 18px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .mb-amount { display:flex; align-items:baseline; gap:6px; }
  .mb-cur {
    font-family: ${FONTS.mono};
    font-size: 14px;
    color: ${COLORS.textMuted};
    padding-bottom: 4px;
  }
  .mb-total {
    font-family: ${FONTS.mono};
    font-size: clamp(32px, 5vw, 44px);
    font-weight: 300;
    color: ${COLORS.textPrimary};
    letter-spacing: -2px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .mb-dec {
    font-size: 55%;
    color: ${COLORS.textMuted};
    letter-spacing: -0.5px;
  }

  .mb-pg-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: ${RADIUS.sm};
    font-family: ${FONTS.mono};
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
  }
  .mb-pg-badge.pos {
    color: ${COLORS.neonGreen};
    background: ${COLORS.bgGreen};
    border: 1px solid ${COLORS.borderGreen};
  }
  .mb-pg-badge.neg {
    color: ${COLORS.neonRed};
    background: ${COLORS.bgRed};
    border: 1px solid ${COLORS.borderRed};
  }
  .mb-pg-dot {
    width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  }

  /* Fila inferior: 3 stats */
  .mb-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: ${COLORS.border};
    border: 1px solid ${COLORS.border};
    border-top: none;
    border-radius: 0 0 ${RADIUS.lg} ${RADIUS.lg};
    overflow: hidden;
  }
  @media (max-width: 480px) {
    .mb-stats { grid-template-columns: 1fr 1fr; }
    .mb-stats .mb-stat:last-child { grid-column: 1 / -1; }
  }

  .mb-stat {
    background: ${COLORS.surface};
    padding: 13px 16px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    position: relative;
  }
  .mb-stat-l {
    font-size: 10px;
    font-weight: 500;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .mb-stat-dot {
    width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
  }
  .mb-stat-v {
    font-family: ${FONTS.mono};
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    color: ${COLORS.textPrimary};
    letter-spacing: -0.3px;
  }
  .mb-stat-sub {
    font-family: ${FONTS.mono};
    font-size: 10px;
    color: ${COLORS.textMuted};
  }
`

export default function MetricsBar({ total, totalInvCost, totalSav, numPositions, numAccounts, pg, pgPct }) {
  const isPos  = (pg ?? 0) >= 0
  const fmt    = (n) => {
    if (n == null || isNaN(n)) return '—'
    return new Intl.NumberFormat('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  }
  const fmtK   = (n) => {
    if (n == null || isNaN(n)) return '—'
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k'
    return fmt(n)
  }

  const [intPart, decPart] = fmt(total).split(',')

  return (
    <div className="mb">
      <style>{`${SHARED_STYLES}${styles}`}</style>

      <div className="mb-hero">
        <div>
          <div style={{ fontSize:10, fontWeight:500, color:COLORS.textMuted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
            Patrimoni total
          </div>
          <div className="mb-amount">
            <span className="mb-cur">€</span>
            <span className="mb-total">
              {intPart}<span className="mb-dec">,{decPart}</span>
            </span>
          </div>
        </div>

        {pg != null && (
          <div className={`mb-pg-badge ${isPos ? 'pos' : 'neg'}`}>
            <div className="mb-pg-dot" style={{ background: isPos ? COLORS.neonGreen : COLORS.neonRed }} />
            {isPos ? '+' : ''}{fmt(pg)} € &nbsp;·&nbsp; {isPos ? '+' : ''}{(pgPct ?? 0).toFixed(2)}%
          </div>
        )}
      </div>

      <div className="mb-stats">
        <div className="mb-stat">
          <div className="mb-stat-l">
            <div className="mb-stat-dot" style={{ background: COLORS.neonCyan }} />
            Invertit
          </div>
          <div className="mb-stat-v">{fmt(totalInvCost)} €</div>
          <div className="mb-stat-sub">{numPositions} posicions</div>
        </div>
        <div className="mb-stat">
          <div className="mb-stat-l">
            <div className="mb-stat-dot" style={{ background: COLORS.neonGreen }} />
            Estalvis
          </div>
          <div className="mb-stat-v">{fmt(totalSav)} €</div>
          <div className="mb-stat-sub">{numAccounts} comptes</div>
        </div>
        <div className="mb-stat">
          <div className="mb-stat-l">
            <div className="mb-stat-dot" style={{ background: isPos ? COLORS.neonGreen : COLORS.neonRed }} />
            P&amp;G
          </div>
          <div className="mb-stat-v" style={{ color: isPos ? COLORS.neonGreen : COLORS.neonRed }}>
            {isPos ? '+' : ''}{fmt(pg)} €
          </div>
          <div className="mb-stat-sub" style={{ color: isPos ? COLORS.neonGreen : COLORS.neonRed }}>
            {isPos ? '+' : ''}{(pgPct ?? 0).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}

