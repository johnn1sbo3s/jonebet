/**
 * Number formatting helpers. Centralized here so all components use the same
 * convention: dot as decimal separator, no thousands separator.
 *
 * Ausência de dado (`undefined`/`null`) vira o placeholder "—" — o mesmo
 * marcador que o app usa para "sem dado". Antes o `?? 0` fabricava um zero:
 * uma odd inexistente (fonte exchange sem BTTS/O2.5) aparecia como odd real
 * 0.00. Zero legítimo (`0`) continua formatado como zero.
 *
 * Examples:
 *   formatNumber(1234.5)        // "1234.50"
 *   formatNumber(1234.5, 0)     // "1235"
 *   formatNumber(undefined)     // "—"
 *   formatNumber(0)             // "0.00"
 *   formatPercent(12.345)       // "12.35%"
 *   formatPercent(undefined)    // "—"
 *   formatPercent(75, 0)        // "75%"
 *   formatUnit(12.5)            // "12.50u"  (stake units)
 */

export const MISSING_PLACEHOLDER = '—'

export function formatNumber(n, decimals = 2) {
  if (n === null || n === undefined) return MISSING_PLACEHOLDER
  return Number(n).toFixed(decimals)
}

export function formatPercent(n, decimals = 2) {
  const base = formatNumber(n, decimals)
  return base === MISSING_PLACEHOLDER ? base : `${base}%`
}

// Stake-unit formatter. Use for any monetary / bankroll value the app
// renders in units of stake (profit, invested, win/loss médio, EV, max
// DD, accumulated, std dev, etc.). The dashboard's framing is "stake =
// 1% da banca", so all profit-class values are unitless multiples of
// the stake — without `u` a number like `12.50` reads as BRL.
export function formatUnit(n, decimals = 2) {
  const base = formatNumber(n, decimals)
  return base === MISSING_PLACEHOLDER ? base : `${base}u`
}
