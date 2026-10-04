// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { formatNumber, formatPercent, formatUnit, MISSING_PLACEHOLDER } from '~/utils/formatNumber'

// Ticket 21: valor ausente (undefined/null) não pode virar zero fabricado
// ("0.00"/"0.00%") — o app usa o placeholder "—" para "sem dado". Zero real
// continua formatado como zero.
describe('formatNumber distingue ausente de zero real', () => {
  it('ausente vira placeholder, não 0.00', () => {
    expect(MISSING_PLACEHOLDER).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
    expect(formatNumber(null)).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
    expect(formatPercent(null)).toBe('—')
    expect(formatUnit(undefined)).toBe('—')
  })

  it('zero real continua formatado como zero', () => {
    expect(formatNumber(0)).toBe('0.00')
    expect(formatNumber(0, 0)).toBe('0')
    expect(formatPercent(0)).toBe('0.00%')
    expect(formatUnit(0)).toBe('0.00u')
  })

  it('valores presentes mantêm o formato atual', () => {
    expect(formatNumber(1.85)).toBe('1.85')
    expect(formatNumber(12.345, 1)).toBe('12.3')
    expect(formatNumber('2.5')).toBe('2.50')
    expect(formatPercent(12.345)).toBe('12.35%')
    expect(formatPercent(75, 0)).toBe('75%')
    expect(formatUnit(12.5)).toBe('12.50u')
  })
})
