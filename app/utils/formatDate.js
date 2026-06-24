import { DateTime } from 'luxon'

/**
 * Format an ISO date string (yyyy-mm-dd) to Brazilian format.
 * @param {string} iso  ISO date or yyyy-MM-dd string. Empty/falsy → ''.
 * @param {{ style?: 'long' | 'short' }} [opts]  'long' = dd/MM/yyyy (default), 'short' = dd/MM/yy
 * @returns {string}
 */
export function formatDate(iso, { style = 'long' } = {}) {
  if (!iso) return ''
  const dt = DateTime.fromISO(iso)
  if (!dt.isValid) return iso
  return style === 'short' ? dt.toFormat('dd/MM/yy') : dt.toFormat('dd/MM/yyyy')
}
