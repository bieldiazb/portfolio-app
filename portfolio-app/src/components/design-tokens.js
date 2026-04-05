// ─── design-tokens.js — Cartera v4 ──────────────────────────────────────────
// Color principal: Neon Green (#00ff88)
// Accent secundari: Purple (#7b61ff)
// Font numèrica: DM Sans (per valors monetaris i estadístiques)

export const COLORS = {
  // Fons
  bg:          '#0a0a0a',
  surface:     '#111111',
  elevated:    '#1a1a1a',
  overlay:     '#141414',

  // Borders
  border:      '#1e1e1e',
  borderMid:   '#2a2a2a',
  borderHi:    '#333333',

  // Text
  textPrimary:   '#e8e8e8',
  textSecondary: '#888888',
  textMuted:     '#444444',
  textDisabled:  '#2a2a2a',

  // Neon accents
  neonGreen:  '#00ff88',   // color PRINCIPAL — brand / profit / positiu
  neonRed:    '#ff3b3b',   // pèrdua / negatiu / danger
  neonPurple: '#7b61ff',   // accent secundari / brand
  neonCyan:   '#00d4ff',   // ETF / inversions / info
  neonAmber:  '#ff9500',   // crypto / warning / alert

  // Backgrounds neon — valors actualitzats per ser més vistosos
  bgGreen:    'rgba(0,255,136,0.08)',
  bgRed:      'rgba(255,59,59,0.07)',
  bgPurple:   'rgba(123,97,255,0.10)',
  bgCyan:     'rgba(0,212,255,0.08)',
  bgAmber:    'rgba(255,149,0,0.08)',

  // Borders neon — lleugerament més visibles
  borderGreen:  'rgba(0,255,136,0.25)',
  borderRed:    'rgba(255,59,59,0.22)',
  borderPurple: 'rgba(123,97,255,0.28)',
  borderCyan:   'rgba(0,212,255,0.22)',
  borderAmber:  'rgba(255,149,0,0.22)',
}

export const FONTS = {
  sans: "'Geist', sans-serif",
  mono: "'Geist Mono', 'SF Mono', 'Menlo', 'Consolas', monospace",
  // DM Sans — per valors monetaris, estadístiques, números grans
  // Ús: font-family: ${FONTS.num}; font-variant-numeric: tabular-nums;
  num:  "'DM Sans', 'Inter', system-ui, sans-serif",
}

export const RADIUS = {
  sm:  '3px',
  md:  '5px',
  lg:  '8px',
  xl:  '12px',
  pill:'20px',
}

export const TYPE_COLORS = {
  etf:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.20)'   },
  stock:   { color: '#7b61ff', bg: 'rgba(123,97,255,0.08)',  border: 'rgba(123,97,255,0.22)'  },
  robo:    { color: '#ff9500', bg: 'rgba(255,149,0,0.08)',   border: 'rgba(255,149,0,0.22)'   },
  crypto:  { color: '#ff9500', bg: 'rgba(255,149,0,0.08)',   border: 'rgba(255,149,0,0.22)'   },
  estalvi: { color: '#00ff88', bg: 'rgba(0,255,136,0.08)',   border: 'rgba(0,255,136,0.22)'   },
  efectiu: { color: '#888888', bg: 'rgba(136,136,136,0.06)', border: 'rgba(136,136,136,0.15)' },
}

export const CHART_COLORS = [
  '#00ff88',  // verd  — principal / profit
  '#00d4ff',  // cian  — ETF / inversions
  '#7b61ff',  // lila  — stock / brand
  '#ff9500',  // ambre — crypto / robo
  '#ff3b3b',  // vermell — pèrdua
  '#888888',  // gris  — efectiu / neutre
]

export const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sec-title {
    font-family: ${FONTS.sans};
    font-size: 16px; font-weight: 400;
    color: ${COLORS.textPrimary};
    letter-spacing: -0.3px; margin-bottom: 2px;
  }
  .sec-sub {
    font-family: ${FONTS.sans};
    font-size: 12px; color: ${COLORS.textMuted};
    letter-spacing: 0.01em;
  }

  .panel {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.lg}; padding: 18px 16px;
  }
  .panel-title {
    font-family: ${FONTS.sans}; font-size: 11px; font-weight: 500;
    color: ${COLORS.textMuted}; text-transform: uppercase;
    letter-spacing: 0.12em; margin-bottom: 14px;
  }

  .lbl {
    font-family: ${FONTS.sans}; font-size: 10px; font-weight: 500;
    color: ${COLORS.textMuted}; text-transform: uppercase;
    letter-spacing: 0.12em; display: block; margin-bottom: 5px;
  }

  /* Classe utilitària per a valors numèrics (€, %, xifres) */
  .val-num {
    font-family: ${FONTS.num};
    font-variant-numeric: tabular-nums;
    font-weight: 400;
  }
  .val-mono {
    font-family: ${FONTS.mono};
    font-variant-numeric: tabular-nums;
  }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: ${FONTS.mono}; font-size: 11px; font-weight: 500;
    padding: 3px 8px; border-radius: ${RADIUS.sm};
  }
  .badge-green  { color: ${COLORS.neonGreen};  background: ${COLORS.bgGreen};  border: 1px solid ${COLORS.borderGreen};  }
  .badge-red    { color: ${COLORS.neonRed};    background: ${COLORS.bgRed};    border: 1px solid ${COLORS.borderRed};    }
  .badge-purple { color: ${COLORS.neonPurple}; background: ${COLORS.bgPurple}; border: 1px solid ${COLORS.borderPurple}; }
  .badge-cyan   { color: ${COLORS.neonCyan};   background: ${COLORS.bgCyan};   border: 1px solid ${COLORS.borderCyan};   }
  .badge-amber  { color: ${COLORS.neonAmber};  background: ${COLORS.bgAmber};  border: 1px solid ${COLORS.borderAmber};  }

  .inp {
    width: 100%; background: ${COLORS.bg};
    border: 1px solid ${COLORS.border}; border-radius: ${RADIUS.md};
    padding: 9px 11px; font-family: ${FONTS.sans}; font-size: 14px;
    color: ${COLORS.textPrimary}; outline: none;
    transition: border-color 120ms; touch-action: manipulation;
  }
  .inp:focus { border-color: ${COLORS.neonGreen}; }
  .inp::placeholder { color: ${COLORS.textMuted}; }
  .inp.mono { font-family: ${FONTS.mono}; text-align: right; }

  .sel {
    width: 100%; background: ${COLORS.bg};
    border: 1px solid ${COLORS.border}; border-radius: ${RADIUS.md};
    padding: 9px 11px; font-family: ${FONTS.sans}; font-size: 14px;
    color: ${COLORS.textPrimary}; outline: none; cursor: pointer;
    touch-action: manipulation;
  }
  .sel option { background: ${COLORS.surface}; }
  .sel:focus { border-color: ${COLORS.neonGreen}; }

  .btn-primary {
    background: ${COLORS.neonGreen}; border: none;
    border-radius: ${RADIUS.md}; padding: 9px 16px;
    font-family: ${FONTS.sans}; font-size: 13px; font-weight: 600;
    color: #000; cursor: pointer; transition: opacity 100ms; white-space: nowrap;
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-secondary {
    background: transparent; border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.md}; padding: 9px 16px;
    font-family: ${FONTS.sans}; font-size: 13px;
    color: ${COLORS.textSecondary}; cursor: pointer; transition: all 120ms; white-space: nowrap;
  }
  .btn-secondary:hover { border-color: ${COLORS.borderHi}; color: ${COLORS.textPrimary}; }

  .btn-ghost {
    background: transparent; border: none; font-family: ${FONTS.sans};
    font-size: 12px; color: ${COLORS.textMuted}; cursor: pointer;
    transition: color 100ms; padding: 4px 8px;
  }
  .btn-ghost:hover { color: ${COLORS.textPrimary}; }

  .tabs {
    display: flex; border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.md}; overflow: hidden; flex-shrink: 0;
  }
  .tab {
    padding: 5px 12px; border: none; background: transparent;
    font-family: ${FONTS.mono}; font-size: 11px; font-weight: 500;
    color: ${COLORS.textMuted}; cursor: pointer; transition: all 100ms;
    border-right: 1px solid ${COLORS.border};
  }
  .tab:last-child { border-right: none; }
  .tab:hover { color: ${COLORS.textPrimary}; background: ${COLORS.elevated}; }
  .tab.on { background: ${COLORS.elevated}; color: ${COLORS.textPrimary}; }

  .spin {
    width: 13px; height: 13px;
    border: 1.5px solid ${COLORS.border};
    border-top-color: ${COLORS.neonGreen};
    border-radius: 50%; animation: spin360 .7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin360 { to { transform: rotate(360deg); } }

  .tooltip-box {
    background: ${COLORS.elevated}; border: 1px solid ${COLORS.borderMid};
    border-radius: ${RADIUS.md}; padding: 8px 12px; font-family: ${FONTS.sans};
  }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.borderMid}; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: ${COLORS.borderHi}; }
`