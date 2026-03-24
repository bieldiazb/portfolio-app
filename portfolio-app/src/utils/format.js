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

export const getEffectiveValue = (inv) => {
  if (inv.qty && inv.currentPrice !== null && inv.currentPrice !== undefined) {
    return +(inv.qty * inv.currentPrice).toFixed(2)
  }
  return inv.initialValue
}

export const TYPE_META = {
  efectiu: { label: 'Efectiu', colorTw: 'text-slate-500',   bgTw: 'bg-slate-100'    },
  estalvi: { label: 'Estalvi', colorTw: 'text-emerald-600', bgTw: 'bg-emerald-50'   },
  etf:     { label: 'ETF',     colorTw: 'text-blue-600',    bgTw: 'bg-blue-50'      },
  stock:   { label: 'Acció',   colorTw: 'text-violet-600',  bgTw: 'bg-violet-50'    },
  robo:    { label: 'Robo',    colorTw: 'text-amber-600',   bgTw: 'bg-amber-50'     },
}