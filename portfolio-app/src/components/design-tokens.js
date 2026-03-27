// design-tokens.js — importa això als components que necessitin els colors
// o copia les variables CSS a globals.css

export const COLORS = {
  // text
  fg1:  'rgba(255,255,255,0.85)',
  fg2:  'rgba(255,255,255,0.60)',
  fg3:  'rgba(255,255,255,0.35)',
  fg4:  'rgba(255,255,255,0.20)',
  // surfaces
  bg:       '#080808',
  surface:  'rgba(255,255,255,0.02)',
  surface2: 'rgba(255,255,255,0.04)',
  // borders
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.10)',
  // accents
  green:     'rgba(80,210,110,0.85)',
  greenDim:  'rgba(80,200,110,0.10)',
  red:       'rgba(255,90,70,0.85)',
  redDim:    'rgba(255,70,50,0.10)',
}

// Per tipus d'actiu
export const TYPE_COLORS = {
  etf:     { bg: 'rgba(60,130,255,0.10)', color: 'rgba(100,160,255,0.85)' },
  stock:   { bg: 'rgba(80,200,120,0.10)', color: 'rgba(80,210,120,0.85)' },
  crypto:  { bg: 'rgba(255,160,60,0.10)', color: 'rgba(255,170,70,0.85)'  },
  robo:    { bg: 'rgba(180,120,255,0.10)', color: 'rgba(180,130,255,0.85)' },
  estalvi: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' },
  efectiu: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' },
}

// Paleta per gràfics (recharts / distribució)
export const CHART_COLORS = [
  'rgba(80,210,110,0.75)',
  'rgba(100,155,255,0.75)',
  'rgba(255,170,70,0.75)',
  'rgba(180,130,255,0.75)',
  'rgba(255,100,80,0.75)',
  'rgba(80,210,200,0.75)',
  'rgba(255,150,200,0.75)',
  'rgba(180,220,80,0.75)',
]

// CSS shared per tots els components v2
export const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

  /* Botó primari — blanc sobre negre */
  .btn-v2-primary {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 0 11px; height: 28px;
    background: rgba(255,255,255,0.92); color: #080808;
    border: none; border-radius: 5px;
    font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background 100ms;
    white-space: nowrap; flex-shrink: 0; letter-spacing: -0.1px;
  }
  .btn-v2-primary:hover { background: #fff; }

  /* Botó icona */
  .btn-v2-ico {
    width: 28px; height: 28px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.08); background: transparent;
    border-radius: 5px; color: rgba(255,255,255,0.32); cursor: pointer;
    transition: all 100ms; flex-shrink: 0;
  }
  .btn-v2-ico:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.12); }
  .btn-v2-ico:disabled { opacity: 0.28; pointer-events: none; }

  /* Spin */
  .v2-spin { display: inline-block; animation: v2spin .7s linear infinite; }
  @keyframes v2spin { to { transform: rotate(360deg); } }

  /* Section header */
  .sec-v2-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .sec-v2-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.72); letter-spacing: -0.2px; font-family: 'Geist', sans-serif; }
  .sec-v2-sub   { font-size: 11px; color: rgba(255,255,255,0.24); margin-top: 2px; font-family: 'Geist', sans-serif; }
  .sec-v2-btns  { display: flex; gap: 5px; align-items: center; }

  /* Row */
  .row-v2 {
    display: flex; align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    cursor: default; transition: background 100ms;
    position: relative;
  }
  .row-v2:last-child { border-bottom: none; }
  .row-v2:hover { background: rgba(255,255,255,0.02); border-radius: 4px; }
  .row-v2:hover .row-v2-acts { opacity: 1; }

  /* Avatar */
  .av-v2 {
    width: 30px; height: 30px; border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; flex-shrink: 0; margin-right: 10px;
    letter-spacing: 0.02em;
  }

  /* Row info */
  .row-v2-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.80); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Geist', sans-serif; }
  .row-v2-meta { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
  .row-v2-badge { font-size: 10px; font-weight: 500; padding: 1px 5px; border-radius: 3px; }
  .row-v2-ticker { font-size: 10px; color: rgba(255,255,255,0.24); font-family: 'Geist Mono', monospace; }
  .row-v2-dot { font-size: 9px; color: rgba(255,255,255,0.12); }

  /* Values */
  .row-v2-val { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.80); font-family: 'Geist Mono', monospace; letter-spacing: -0.3px; }
  .row-v2-pg { font-size: 10px; font-family: 'Geist Mono', monospace; margin-top: 2px; font-weight: 400; }
  .row-v2-pg.pos { color: rgba(80,210,110,0.78); }
  .row-v2-pg.neg { color: rgba(255,90,70,0.78); }

  /* Price col */
  .row-v2-price { font-size: 11px; color: rgba(255,255,255,0.36); font-family: 'Geist Mono', monospace; letter-spacing: -0.2px; }
  .row-v2-price-lbl { font-size: 10px; color: rgba(255,255,255,0.16); margin-top: 1px; }

  /* Actions */
  .row-v2-acts { display: flex; gap: 1px; opacity: 0; transition: opacity 100ms; flex-shrink: 0; margin-left: 4px; }
  .row-v2-btn {
    width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; border-radius: 4px; cursor: pointer;
    color: rgba(255,255,255,0.20); transition: all 100ms;
  }
  .row-v2-btn:hover { color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.05); }
  .row-v2-btn.del:hover { color: rgba(255,80,60,0.65); background: rgba(255,50,30,0.06); }

  /* Empty */
  .v2-empty { padding: 48px 0; text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); font-family: 'Geist', sans-serif; }

  /* Panel */
  .v2-panel {
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 6px; padding: 14px 16px;
    background: rgba(255,255,255,0.015);
  }
  .v2-panel-title { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.50); margin-bottom: 12px; font-family: 'Geist', sans-serif; }

  /* Modal overlay */
  .v2-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px;
  }

  .v2-modal {
    background: #0f0f0f;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    width: 100%; padding: 22px;
    max-height: 92vh; overflow-y: auto;
    font-family: 'Geist', sans-serif;
  }
  @media (min-width: 640px) { .v2-modal { max-width: 420px; } }

  .v2-modal-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .v2-modal-title { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.85); letter-spacing: -0.3px; }
  .v2-modal-close {
    width: 26px; height: 26px; border-radius: 5px;
    background: rgba(255,255,255,0.06); border: none;
    color: rgba(255,255,255,0.40); font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 100ms; font-family: inherit; line-height: 1;
  }
  .v2-modal-close:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }

  .v2-field-label {
    display: block; font-size: 10px; font-weight: 500;
    color: rgba(255,255,255,0.28); text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 6px;
  }
  .v2-input {
    width: 100%;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px; padding: 9px 11px;
    font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 400;
    color: rgba(255,255,255,0.82); outline: none; transition: border-color 100ms;
  }
  .v2-input:focus { border-color: rgba(255,255,255,0.20); }
  .v2-input::placeholder { color: rgba(255,255,255,0.18); }
  .v2-input.mono { font-family: 'Geist Mono', monospace; text-align: right; }

  .v2-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .v2-space { display: flex; flex-direction: column; gap: 12px; }
  .v2-error { font-size: 12px; color: rgba(255,90,70,0.8); background: rgba(255,60,40,0.08); border: 1px solid rgba(255,60,40,0.14); border-radius: 5px; padding: 8px 11px; }

  .v2-modal-footer { display: flex; gap: 8px; margin-top: 20px; }
  .v2-btn-cancel {
    flex: 1; border: 1px solid rgba(255,255,255,0.08); background: transparent;
    color: rgba(255,255,255,0.36); padding: 11px; border-radius: 6px;
    font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 400;
    cursor: pointer; transition: all 100ms;
  }
  .v2-btn-cancel:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); }
  .v2-btn-submit {
    flex: 1; background: rgba(255,255,255,0.92); border: none;
    color: #080808; padding: 11px; border-radius: 6px;
    font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 100ms;
  }
  .v2-btn-submit:hover { background: #fff; }

  /* Pulse */
  @keyframes v2pulse { 0%,100%{opacity:1} 50%{opacity:0.15} }
  .v2-pulse { animation: v2pulse 1.4s ease-in-out infinite; }
`