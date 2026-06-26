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
 */

export function formatNumber(n, decimals = 2) {
  return Number(n ?? 0).toFixed(decimals)
}

export function formatPercent(n, decimals = 2) {
  return `${formatNumber(n, decimals)}%`
}
