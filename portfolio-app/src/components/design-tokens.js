// ─── design-tokens.js — Cartera v3 ──────────────────────────────────────────
// Sistema quasi-monocromàtic + neon accents
// Inspiració: Bloomberg Terminal · Linear · Vercel Dashboard

// ── Paleta base ───────────────────────────────────────────────────────────────
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

  // Neon accents — semàntics, mai decoratius
  neonGreen:  '#00ff88',   // profit / positiu / success
  neonRed:    '#ff3b3b',   // pèrdua / negatiu / danger
  neonPurple: '#7b61ff',   // brand / accent / actiu seleccionat
  neonCyan:   '#00d4ff',   // ETF / inversions / info
  neonAmber:  '#ff9500',   // crypto / warning / alert

  // Backgrounds neon (molt subtils)
  bgGreen:    'rgba(0,255,136,0.05)',
  bgRed:      'rgba(255,59,59,0.05)',
  bgPurple:   'rgba(123,97,255,0.08)',
  bgCyan:     'rgba(0,212,255,0.06)',
  bgAmber:    'rgba(255,149,0,0.06)',

  // Borders neon
  borderGreen:  'rgba(0,255,136,0.20)',
  borderRed:    'rgba(255,59,59,0.20)',
  borderPurple: 'rgba(123,97,255,0.25)',
  borderCyan:   'rgba(0,212,255,0.18)',
  borderAmber:  'rgba(255,149,0,0.20)',
}

// ── Tipografia ────────────────────────────────────────────────────────────────
export const FONTS = {
  sans: "'Geist',sans-serif",
  mono: "'Geist Mono','SF Mono','Menlo','Consolas',monospace",
}

// ── Spacing ───────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:  '3px',
  md:  '5px',
  lg:  '8px',
  xl:  '12px',
  pill:'20px',
}

// ── Color per categoria d'actiu ───────────────────────────────────────────────
export const TYPE_COLORS = {
  etf:     { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.18)'   },
  stock:   { color: '#7b61ff', bg: 'rgba(123,97,255,0.08)',  border: 'rgba(123,97,255,0.20)'  },
  robo:    { color: '#ff9500', bg: 'rgba(255,149,0,0.08)',   border: 'rgba(255,149,0,0.20)'   },
  crypto:  { color: '#ff9500', bg: 'rgba(255,149,0,0.08)',   border: 'rgba(255,149,0,0.20)'   },
  estalvi: { color: '#00ff88', bg: 'rgba(0,255,136,0.06)',   border: 'rgba(0,255,136,0.18)'   },
  efectiu: { color: '#888888', bg: 'rgba(136,136,136,0.06)', border: 'rgba(136,136,136,0.15)' },
}

// ── Colors per gràfics (ordre per pes visual) ─────────────────────────────────
export const CHART_COLORS = [
  '#00d4ff',  // cian  — ETF
  '#00ff88',  // verd  — estalvis
  '#7b61ff',  // lila  — stock/brand
  '#ff9500',  // ambre — crypto/robo
  '#ff3b3b',  // vermell — pèrdua
  '#888888',  // gris  — efectiu/neutre
]

// ── CSS global compartit per tots els components ──────────────────────────────
export const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Títols de secció */
  .sec-title {
    font-family: ${FONTS.sans};
    font-size: 16px;
    font-weight: 400;
    color: ${COLORS.textPrimary};
    letter-spacing: -0.3px;
    margin-bottom: 2px;
  }
  .sec-sub {
    font-family: ${FONTS.sans};
    font-size: 12px;
    color: ${COLORS.textMuted};
    letter-spacing: 0.01em;
  }

  /* Panel base */
  .panel {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.lg};
    padding: 18px 16px;
  }
  .panel-title {
    font-family: ${FONTS.sans};
    font-size: 11px;
    font-weight: 500;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 14px;
  }

  /* Etiqueta uppercase */
  .lbl {
    font-family: ${FONTS.sans};
    font-size: 10px;
    font-weight: 500;
    color: ${COLORS.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: block;
    margin-bottom: 5px;
  }

  /* Valor numèric */
  .val-mono {
    font-family: ${FONTS.mono};
    font-variant-numeric: tabular-nums;
  }

  /* Badges pill */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: ${FONTS.mono};
    font-size: 11px; font-weight: 500;
    padding: 3px 8px; border-radius: ${RADIUS.sm};
  }
  .badge-green  { color: ${COLORS.neonGreen};  background: ${COLORS.bgGreen};  border: 1px solid ${COLORS.borderGreen};  }
  .badge-red    { color: ${COLORS.neonRed};    background: ${COLORS.bgRed};    border: 1px solid ${COLORS.borderRed};    }
  .badge-purple { color: ${COLORS.neonPurple}; background: ${COLORS.bgPurple}; border: 1px solid ${COLORS.borderPurple}; }
  .badge-cyan   { color: ${COLORS.neonCyan};   background: ${COLORS.bgCyan};   border: 1px solid ${COLORS.borderCyan};   }
  .badge-amber  { color: ${COLORS.neonAmber};  background: ${COLORS.bgAmber};  border: 1px solid ${COLORS.borderAmber};  }

  /* Inputs */
  .inp {
    width: 100%;
    background: ${COLORS.bg};
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.md};
    padding: 9px 11px;
    font-family: ${FONTS.sans};
    font-size: 14px;
    color: ${COLORS.textPrimary};
    outline: none;
    transition: border-color 120ms;
    touch-action: manipulation;
  }
  .inp:focus { border-color: ${COLORS.neonPurple}; }
  .inp::placeholder { color: ${COLORS.textMuted}; }
  .inp.mono { font-family: ${FONTS.mono}; text-align: right; }

  /* Select */
  .sel {
    width: 100%;
    background: ${COLORS.bg};
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.md};
    padding: 9px 11px;
    font-family: ${FONTS.sans};
    font-size: 14px;
    color: ${COLORS.textPrimary};
    outline: none;
    cursor: pointer;
    touch-action: manipulation;
  }
  .sel option { background: ${COLORS.surface}; }
  .sel:focus { border-color: ${COLORS.neonPurple}; }

  /* Botons */
  .btn-primary {
    background: ${COLORS.neonPurple};
    border: none;
    border-radius: ${RADIUS.md};
    padding: 9px 16px;
    font-family: ${FONTS.sans};
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    transition: opacity 100ms;
    white-space: nowrap;
  }
  .btn-primary:hover { opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-secondary {
    background: transparent;
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.md};
    padding: 9px 16px;
    font-family: ${FONTS.sans};
    font-size: 13px;
    color: ${COLORS.textSecondary};
    cursor: pointer;
    transition: all 120ms;
    white-space: nowrap;
  }
  .btn-secondary:hover { border-color: ${COLORS.borderHi}; color: ${COLORS.textPrimary}; }

  .btn-ghost {
    background: transparent; border: none;
    font-family: ${FONTS.sans};
    font-size: 12px;
    color: ${COLORS.textMuted};
    cursor: pointer;
    transition: color 100ms;
    padding: 4px 8px;
  }
  .btn-ghost:hover { color: ${COLORS.textPrimary}; }

  /* Tabs */
  .tabs {
    display: flex; gap: 0;
    border: 1px solid ${COLORS.border};
    border-radius: ${RADIUS.md};
    overflow: hidden;
    flex-shrink: 0;
  }
  .tab {
    padding: 5px 12px;
    border: none; background: transparent;
    font-family: ${FONTS.mono};
    font-size: 11px; font-weight: 500;
    color: ${COLORS.textMuted};
    cursor: pointer;
    transition: all 100ms;
    border-right: 1px solid ${COLORS.border};
  }
  .tab:last-child { border-right: none; }
  .tab:hover { color: ${COLORS.textPrimary}; background: ${COLORS.elevated}; }
  .tab.on { background: ${COLORS.elevated}; color: ${COLORS.textPrimary}; }

  /* Spinner */
  .spin {
    width: 13px; height: 13px;
    border: 1.5px solid ${COLORS.border};
    border-top-color: ${COLORS.textSecondary};
    border-radius: 50%;
    animation: spin360 .7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin360 { to { transform: rotate(360deg); } }

  /* Tooltip */
  .tooltip-box {
    background: ${COLORS.elevated};
    border: 1px solid ${COLORS.borderMid};
    border-radius: ${RADIUS.md};
    padding: 8px 12px;
    font-family: ${FONTS.sans};
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.borderMid}; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: ${COLORS.borderHi}; }
`