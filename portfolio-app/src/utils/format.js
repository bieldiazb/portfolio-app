export const fmtEur = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n)
}

export const fmtPct = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

export const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ca-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export const TYPE_META = {
  efectiu:  { label: 'EFECTIU',  colorVar: '--text-muted',    bgVar: '--bg-elevated' },
  estalvi:  { label: 'ESTALVI',  colorVar: '--green',         bgVar: '--green-dim'   },
  etf:      { label: 'ETF',      colorVar: '--gold',          bgVar: '--bg-elevated' },
  stock:    { label: 'ACCIÓ',    colorVar: '--blue',          bgVar: '--blue-dim'    },
  robo:     { label: 'ROBO',     colorVar: '--purple',        bgVar: '--purple-dim'  },
}

export const getEffectiveValue = (inv) =>
  inv.currentPrice !== null && inv.currentPrice !== undefined
    ? inv.currentPrice
    : inv.initialValue
