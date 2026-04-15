// ─── design-tokens.js — Cartera v4 · Light/Dark mode ──────────────────────
// Tots els colors referencien variables CSS → el tema canvia globalment
// amb data-theme="light" | "dark" al <html>

export const COLORS = {
  // Fons
  bg:          'var(--c-bg)',
  surface:     'var(--c-surface)',
  elevated:    'var(--c-elevated)',
  overlay:     'var(--c-overlay)',

  // Borders
  border:      'var(--c-border)',
  borderMid:   'var(--c-border-mid)',
  borderHi:    'var(--c-border-hi)',

  // Text
  textPrimary:   'var(--c-text-primary)',
  textSecondary: 'var(--c-text-secondary)',
  textMuted:     'var(--c-text-muted)',
  textDisabled:  'var(--c-text-disabled)',

  // Neon accents — iguals en tots dos modes
  neonGreen:  '#00c970',
  neonRed:    '#ff3b3b',
  neonPurple: '#7b61ff',
  neonCyan:   '#00b8d9',
  neonAmber:  '#ff9500',

  // Backgrounds neon
  bgGreen:    'var(--c-bg-green)',
  bgRed:      'var(--c-bg-red)',
  bgPurple:   'var(--c-bg-purple)',
  bgCyan:     'var(--c-bg-cyan)',
  bgAmber:    'var(--c-bg-amber)',

  // Borders neon
  borderGreen:  'var(--c-border-green)',
  borderRed:    'var(--c-border-red)',
  borderPurple: 'var(--c-border-purple)',
  borderCyan:   'var(--c-border-cyan)',
  borderAmber:  'var(--c-border-amber)',
}

export const FONTS = {
  sans: "'Geist', sans-serif",
  mono: "'Geist Mono', 'SF Mono', 'Menlo', 'Consolas', monospace",
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
  etf:     { color: 'var(--c-cyan)',   bg: 'var(--c-bg-cyan)',   border: 'var(--c-border-cyan)'   },
  stock:   { color: 'var(--c-purple)', bg: 'var(--c-bg-purple)', border: 'var(--c-border-purple)' },
  robo:    { color: 'var(--c-amber)',  bg: 'var(--c-bg-amber)',  border: 'var(--c-border-amber)'  },
  crypto:  { color: 'var(--c-amber)',  bg: 'var(--c-bg-amber)',  border: 'var(--c-border-amber)'  },
  estalvi: { color: 'var(--c-green)',  bg: 'var(--c-bg-green)',  border: 'var(--c-border-green)'  },
  efectiu: { color: 'var(--c-text-secondary)', bg: 'var(--c-elevated)', border: 'var(--c-border)' },
}

export const CHART_COLORS = [
  '#00c970', '#00b8d9', '#7b61ff', '#ff9500', '#ff3b3b', '#888888',
]

export const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sec-title {
    font-family: ${FONTS.sans}; font-size: 16px; font-weight: 400;
    color: var(--c-text-primary); letter-spacing: -0.3px; margin-bottom: 2px;
  }
  .sec-sub {
    font-family: ${FONTS.sans}; font-size: 12px;
    color: var(--c-text-muted); letter-spacing: 0.01em;
  }

  .panel {
    background: var(--c-surface); border: 1px solid var(--c-border);
    border-radius: 8px; padding: 18px 16px;
  }
  .panel-title {
    font-family: ${FONTS.sans}; font-size: 11px; font-weight: 500;
    color: var(--c-text-muted); text-transform: uppercase;
    letter-spacing: 0.12em; margin-bottom: 14px;
  }

  .lbl {
    font-family: ${FONTS.sans}; font-size: 10px; font-weight: 500;
    color: var(--c-text-muted); text-transform: uppercase;
    letter-spacing: 0.12em; display: block; margin-bottom: 5px;
  }

  .val-num  { font-family: ${FONTS.num};  font-variant-numeric: tabular-nums; font-weight: 400; }
  .val-mono { font-family: ${FONTS.mono}; font-variant-numeric: tabular-nums; }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: ${FONTS.mono}; font-size: 11px; font-weight: 500;
    padding: 3px 8px; border-radius: 3px;
  }
  .badge-green  { color: var(--c-green);  background: var(--c-bg-green);  border: 1px solid var(--c-border-green);  }
  .badge-red    { color: var(--c-red);    background: var(--c-bg-red);    border: 1px solid var(--c-border-red);    }
  .badge-purple { color: var(--c-purple); background: var(--c-bg-purple); border: 1px solid var(--c-border-purple); }
  .badge-cyan   { color: var(--c-cyan);   background: var(--c-bg-cyan);   border: 1px solid var(--c-border-cyan);   }
  .badge-amber  { color: var(--c-amber);  background: var(--c-bg-amber);  border: 1px solid var(--c-border-amber);  }

  .inp {
    width: 100%; background: var(--c-bg);
    border: 1px solid var(--c-border); border-radius: 5px;
    padding: 9px 11px; font-family: ${FONTS.sans}; font-size: 16px;
    color: var(--c-text-primary); outline: none;
    transition: border-color 120ms; touch-action: manipulation;
    -webkit-appearance: none;
  }
  .inp:focus { border-color: var(--c-green); }
  .inp::placeholder { color: var(--c-text-muted); }
  .inp.mono { font-family: ${FONTS.mono}; text-align: right; }

  .sel {
    width: 100%; background: var(--c-bg);
    border: 1px solid var(--c-border); border-radius: 5px;
    padding: 9px 11px; font-family: ${FONTS.sans}; font-size: 16px;
    color: var(--c-text-primary); outline: none; cursor: pointer;
    touch-action: manipulation;
  }
  .sel option { background: var(--c-surface); color: var(--c-text-primary); }
  .sel:focus  { border-color: var(--c-green); }

  .btn-primary {
    background: var(--c-green); border: none; border-radius: 5px;
    padding: 9px 16px; font-family: ${FONTS.sans}; font-size: 13px;
    font-weight: 600; color: #fff; cursor: pointer;
    transition: opacity 100ms; white-space: nowrap;
  }
  .btn-primary:hover    { opacity: 0.85; }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-secondary {
    background: transparent; border: 1px solid var(--c-border); border-radius: 5px;
    padding: 9px 16px; font-family: ${FONTS.sans}; font-size: 13px;
    color: var(--c-text-secondary); cursor: pointer; transition: all 120ms; white-space: nowrap;
  }
  .btn-secondary:hover { border-color: var(--c-border-hi); color: var(--c-text-primary); }

  .btn-ghost {
    background: transparent; border: none; font-family: ${FONTS.sans};
    font-size: 12px; color: var(--c-text-muted); cursor: pointer;
    transition: color 100ms; padding: 4px 8px;
  }
  .btn-ghost:hover { color: var(--c-text-primary); }

  .tabs {
    display: flex; border: 1px solid var(--c-border);
    border-radius: 5px; overflow: hidden; flex-shrink: 0;
  }
  .tab {
    padding: 5px 12px; border: none; background: transparent;
    font-family: ${FONTS.mono}; font-size: 11px; font-weight: 500;
    color: var(--c-text-muted); cursor: pointer; transition: all 100ms;
    border-right: 1px solid var(--c-border);
  }
  .tab:last-child { border-right: none; }
  .tab:hover { color: var(--c-text-primary); background: var(--c-elevated); }
  .tab.on    { background: var(--c-elevated); color: var(--c-text-primary); }

  .spin {
    width: 13px; height: 13px;
    border: 1.5px solid var(--c-border);
    border-top-color: var(--c-green);
    border-radius: 50%; animation: spin360 .7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin360 { to { transform: rotate(360deg); } }

  .tooltip-box {
    background: var(--c-elevated); border: 1px solid var(--c-border-mid);
    border-radius: 5px; padding: 8px 12px; font-family: ${FONTS.sans};
  }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--c-border-mid); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--c-border-hi); }
`