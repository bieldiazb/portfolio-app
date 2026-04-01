// ─── utils/format.js ─────────────────────────────────────────────────────────
// Substitueix el teu utils/format.js existent

export function fmtEur(n) {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}

export function fmtPct(n) {
  if (n == null || isNaN(n)) return '—'
  return `${Math.abs(n).toFixed(2)}%`
}

// ── getEffectiveValue ─────────────────────────────────────────────────────────
// Retorna el valor actual d'una inversió en EUR.
// Accepta opcionalment fxRates={ USD: 0.92, GBP: 1.17, ... }
// per fer la conversió amb la taxa live en lloc de la taxa hardcodejada.
export function getEffectiveValue(inv, fxRates = {}) {
  const qty      = inv.totalQty || inv.qty || 0
  const origCurr = inv.originalCurrency || inv.currency || 'EUR'

  // 1. Preu original en la seva moneda × taxa live → EUR (més precís)
  if (origCurr !== 'EUR' && inv.originalPrice != null && qty > 0 && fxRates[origCurr]) {
    return +(qty * inv.originalPrice * fxRates[origCurr]).toFixed(2)
  }

  // 2. currentPrice ja en EUR (guardat per usePriceFetcher)
  if (inv.currentPrice != null && qty > 0) {
    return +(qty * inv.currentPrice).toFixed(2)
  }

  // 3. Fallback: cost d'adquisició
  return inv.totalCost || inv.initialValue || 0
}