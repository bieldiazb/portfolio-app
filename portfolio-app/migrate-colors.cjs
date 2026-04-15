// migrate-colors.cjs — node migrate-colors.cjs
// v2: inclou tooltips inline, Recharts SVG props i tots els patterns que faltaven

const fs = require("fs");

const SUBS = [
  // ── Superfícies ──
  ["linear-gradient(135deg,#0f0f0f 0%,#141414 100%)", "linear-gradient(135deg,var(--c-bg) 0%,var(--c-overlay) 100%)"],
  ["linear-gradient(135deg, #0f0f0f 0%, #141414 100%)", "linear-gradient(135deg, var(--c-bg) 0%, var(--c-overlay) 100%)"],
  ["rgba(0,255,136,0.07) 0%,transparent", "var(--c-bg-green) 0%,transparent"],
  ["rgba(255,149,0,0.07) 0%,transparent", "var(--c-bg-amber) 0%,transparent"],
  ["background:#111;", "background:var(--c-surface);"],
  ["background: #111;", "background: var(--c-surface);"],
  ["background:#1a1a1a;", "background:var(--c-elevated);"],
  ["background: #1a1a1a;", "background: var(--c-elevated);"],
  ["background:#0e0e0e;", "background:var(--c-bg);"],
  ["background:rgba(255,255,255,0.015);", "background:var(--c-elevated);"],
  ["background: rgba(255,255,255,0.015);", "background: var(--c-elevated);"],
  ["background:rgba(255,255,255,0.02);", "background:var(--c-elevated);"],
  ["background: rgba(255,255,255,0.02);", "background: var(--c-elevated);"],
  ["background:rgba(255,255,255,0.03);", "background:var(--c-elevated);"],
  ["background:rgba(255,255,255,0.04);", "background:var(--c-elevated);"],
  ["background:rgba(255,255,255,0.05);", "background:var(--c-border);"],
  ["background: rgba(255,255,255,0.05);", "background: var(--c-border);"],
  ["background:rgba(255,255,255,0.06);", "background:var(--c-surface);"],
  ["background: rgba(255,255,255,0.06);", "background: var(--c-surface);"],
  ["background:rgba(255,255,255,0.07);", "background:var(--c-elevated);"],
  // ── Tooltip JSX inline (JS object syntax) ──
  ["background:'#1a1a1a'", "background:'var(--c-elevated)'"],
  ["background: '#1a1a1a'", "background: 'var(--c-elevated)'"],
  // ── Borders CSS ──
  ["border:1px solid rgba(255,255,255,0.04);", "border:1px solid var(--c-border);"],
  ["border:1px solid rgba(255,255,255,0.05);", "border:1px solid var(--c-border);"],
  ["border:1px solid rgba(255,255,255,0.06);", "border:1px solid var(--c-border);"],
  ["border:1px solid rgba(255,255,255,0.07);", "border:1px solid var(--c-border);"],
  ["border:1px solid rgba(255,255,255,0.08);", "border:1px solid var(--c-border);"],
  ["border:1px solid rgba(255,255,255,0.09);", "border:1px solid var(--c-border);"],
  ["border: 1px solid rgba(255,255,255,0.06);", "border: 1px solid var(--c-border);"],
  ["border-bottom:1px solid rgba(255,255,255,0.04);", "border-bottom:1px solid var(--c-border);"],
  ["border-bottom:1px solid rgba(255,255,255,0.05);", "border-bottom:1px solid var(--c-border);"],
  ["border-top:1px solid rgba(255,255,255,0.05);", "border-top:1px solid var(--c-border);"],
  ["border-top:1px solid rgba(255,255,255,0.06);", "border-top:1px solid var(--c-border);"],
  // ── Borders JSX inline ──
  ["border:`1px solid rgba(255,255,255,0.08)`", "border:`1px solid var(--c-border)`"],
  ["border:`1px solid rgba(255,255,255,0.06)`", "border:`1px solid var(--c-border)`"],
  ["border:`1px solid rgba(255,255,255,0.10)`", "border:`1px solid var(--c-border)`"],
  // ── Colors CSS ──
  ["color:#fff;", "color:var(--c-text-primary);"],
  ["color: #fff;", "color: var(--c-text-primary);"],
  ["color:rgba(255,255,255,0.80);", "color:var(--c-text-primary);"],
  ["color:rgba(255,255,255,0.65);", "color:var(--c-text-secondary);"],
  ["color:rgba(255,255,255,0.60);", "color:var(--c-text-secondary);"],
  ["color:rgba(255,255,255,0.55);", "color:var(--c-text-secondary);"],
  ["color:rgba(255,255,255,0.45);", "color:var(--c-text-secondary);"],
  ["color:rgba(255,255,255,0.40);", "color:var(--c-text-secondary);"],
  ["color:rgba(255,255,255,0.35);", "color:var(--c-text-secondary);"],
  ["color:rgba(255,255,255,0.30);", "color:var(--c-text-muted);"],
  ["color:rgba(255,255,255,0.28);", "color:var(--c-text-muted);"],
  ["color:rgba(255,255,255,0.25);", "color:var(--c-text-muted);"],
  ["color:rgba(255,255,255,0.22);", "color:var(--c-text-muted);"],
  ["color:rgba(255,255,255,0.20);", "color:var(--c-text-disabled);"],
  ["color:rgba(255,255,255,0.18);", "color:var(--c-text-disabled);"],
  ["color:rgba(255,255,255,0.15);", "color:var(--c-text-disabled);"],
  ["color:rgba(255,255,255,0.10);", "color:var(--c-text-disabled);"],
  // ── Colors JSX inline (single quotes) ──
  ["color:'#fff'", "color:'var(--c-text-primary)'"],
  ["color:'rgba(255,255,255,0.80)'", "color:'var(--c-text-primary)'"],
  ["color:'rgba(255,255,255,0.65)'", "color:'var(--c-text-secondary)'"],
  ["color:'rgba(255,255,255,0.60)'", "color:'var(--c-text-secondary)'"],
  ["color:'rgba(255,255,255,0.55)'", "color:'var(--c-text-secondary)'"],
  ["color:'rgba(255,255,255,0.45)'", "color:'var(--c-text-secondary)'"],
  ["color:'rgba(255,255,255,0.40)'", "color:'var(--c-text-secondary)'"],
  ["color:'rgba(255,255,255,0.35)'", "color:'var(--c-text-muted)'"],
  ["color:'rgba(255,255,255,0.30)'", "color:'var(--c-text-muted)'"],
  ["color:'rgba(255,255,255,0.25)'", "color:'var(--c-text-muted)'"],
  ["color:'rgba(255,255,255,0.22)'", "color:'var(--c-text-muted)'"],
  ["color:'rgba(255,255,255,0.20)'", "color:'var(--c-text-disabled)'"],
  ["color:'rgba(255,255,255,0.18)'", "color:'var(--c-text-disabled)'"],
  ["color:'rgba(255,255,255,0.15)'", "color:'var(--c-text-disabled)'"],
  // ── Recharts SVG props (fill/stroke attributes) ──
  ["fill: 'rgba(255,255,255,0.25)'", "fill: 'var(--c-text-muted)'"],
  ["fill: 'rgba(255,255,255,0.22)'", "fill: 'var(--c-text-muted)'"],
  ["fill: 'rgba(255,255,255,0.20)'", "fill: 'var(--c-text-disabled)'"],
  ["fill: 'rgba(255,255,255,0.30)'", "fill: 'var(--c-text-muted)'"],
  ["fill: 'rgba(255,255,255,0.03)'", "fill: 'var(--c-elevated)'"],
  ["fill: 'rgba(255,255,255,0.04)'", "fill: 'var(--c-elevated)'"],
  ['stroke="rgba(255,255,255,0.04)"', 'stroke="var(--c-border)"'],
  ['stroke="rgba(255,255,255,0.05)"', 'stroke="var(--c-border)"'],
  ['stroke="rgba(255,255,255,0.06)"', 'stroke="var(--c-border)"'],
  ['stroke="rgba(255,255,255,0.20)"', 'stroke="var(--c-text-disabled)"'],
  ["stroke: 'rgba(255,255,255,0.06)'", "stroke: 'var(--c-border)'"],
  ["stroke: 'rgba(255,255,255,0.10)'", "stroke: 'var(--c-border-hi)'"],
  ["stroke: 'rgba(255,255,255,0.08)'", "stroke: 'var(--c-border)'"],
  // ── Neon badge backgrounds ──
  ["background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.20);", "background:var(--c-bg-green); border:1px solid var(--c-border-green);"],
  ["background:rgba(0,255,136,0.10); border:1px solid rgba(0,255,136,0.15);", "background:var(--c-bg-green); border:1px solid var(--c-border-green);"],
];

const FILES = [
  "src/components/AllocationChart.jsx",
  "src/components/ProjectionsPage.jsx",
  "src/components/SavingsList.jsx",
  "src/components/CryptoPage.jsx",
  "src/components/CommoditiesPage.jsx",
  "src/components/MonthlyReport.jsx",
  "src/components/NetWorthTimeline.jsx",
  "src/components/BenchmarkPage.jsx",
  "src/components/MovementsPage.jsx",
  "src/components/RebalancingPage.jsx",
  "src/components/AlertsSystem.jsx",
  "src/components/BottomNav.jsx",
  "src/components/DividendsPage.jsx",
  "src/components/GoalsPage.jsx",
  "src/components/NewsPage.jsx",
  "src/components/Correlationmatrix.jsx",
  "src/components/LoginScreen.jsx",
  "src/components/Aianalyst.jsx",
];

let totalReplaced = 0;

FILES.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, "utf8");
  let count = 0;
  for (const [from, to] of SUBS) {
    let prev;
    do {
      prev = content;
      content = content.replaceAll(from, to);
      if (content !== prev) count++;
    } while (content !== prev);
  }
  if (count > 0) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✓ ${filePath}: ${count} canvis`);
    totalReplaced += count;
  } else {
    console.log(`  ${filePath}: ja migrat`);
  }
});

console.log(`\nTotal: ${totalReplaced} canvis en ${FILES.length} fitxers`);
