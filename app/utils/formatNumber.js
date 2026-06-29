/**
 * Number formatting helpers. Centralized here so all components use the same
 * convention: dot as decimal separator, no thousands separator.
 *
 * Examples:
 *   formatNumber(1234.5)        // "1234.50"
 *   formatNumber(1234.5, 0)     // "1235"
 *   formatNumber(null)          // "0.00"
 *   formatPercent(12.345)       // "12.35%"
 *   formatPercent(75, 0)        // "75%"
 *   formatUnit(12.5)            // "12.50u"  (stake units)
 */

export function formatNumber(n, decimals = 2) {
  return Number(n ?? 0).toFixed(decimals)
}

export function formatPercent(n, decimals = 2) {
  return `${formatNumber(n, decimals)}%`
}

// Stake-unit formatter. Use for any monetary / bankroll value the app
// renders in units of stake (profit, invested, win/loss médio, EV, max
// DD, accumulated, std dev, etc.). The dashboard's framing is "stake =
// 1% da banca", so all profit-class values are unitless multiples of
// the stake — without `u` a number like `12.50` reads as BRL.
export function formatUnit(n, decimals = 2) {
  return `${formatNumber(n, decimals)}u`
}
