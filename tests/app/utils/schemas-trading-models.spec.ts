import { describe, it, expect } from 'vitest'
import { endpointSchemas } from '~/utils/schemas'

describe('tradingModelsList schema', () => {
  it('has tradingModelsList entry', () => {
    expect(endpointSchemas.tradingModelsList).toBeDefined()
  })

  it('returns fallback on non-object input', () => {
    const result = endpointSchemas.tradingModelsList.schema.safeParse(null)
    expect(result.success).toBe(false)
  })

  it('passthrough preserves daily/weekly/monthly fields', () => {
    const input = {
      date: '2026-09-04',
      daily: [{ model: 'donkey', bets: [] }],
      weekly: { rows: [] },
      monthly: { rows: [] },
    }
    const result = endpointSchemas.tradingModelsList.schema.parse(input)
    expect(result.daily).toEqual(input.daily)
    expect(result.weekly).toEqual(input.weekly)
  })
})
