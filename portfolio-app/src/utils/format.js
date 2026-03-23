export const fmtEur = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n)
}

export const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

export const getEffectiveValue = (inv) =>
  inv.currentPrice !== null && inv.currentPrice !== undefined
    ? inv.currentPrice
    : inv.initialValue

export const TYPE_META = {
  efectiu: { label: 'Efectiu', colorTw: 'text-slate-600',   bgTw: 'bg-slate-100'   },
  estalvi: { label: 'Estalvi', colorTw: 'text-emerald-700', bgTw: 'bg-emerald-50'  },
  etf:     { label: 'ETF',     colorTw: 'text-blue-700',    bgTw: 'bg-blue-50'     },
  stock:   { label: 'Acció',   colorTw: 'text-violet-700',  bgTw: 'bg-violet-50'   },
  robo:    { label: 'Robo',    colorTw: 'text-amber-700',   bgTw: 'bg-amber-50'    },
}
