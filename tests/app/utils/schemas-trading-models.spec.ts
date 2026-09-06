import { describe, it, expect } from 'vitest'
import { endpointSchemas } from '~/utils/schemas'

describe('tradingDaily schema', () => {
  it('has tradingDaily entry and no monolithic entry', () => {
    expect(endpointSchemas.tradingDaily).toBeDefined()
    expect(endpointSchemas.tradingModelsList).toBeUndefined()
  })

  it('returns fallback on non-object input', () => {
    const result = endpointSchemas.tradingDaily.schema.safeParse(null)
    expect(result.success).toBe(false)
  })

  it('passthrough preserves the real daily shape', () => {
    const input = {
      date: '2026-09-05',
      daily: [{ model: 'lay_0x1_scorpion', model_label: '0x1', subtotal: -7.57, bets: [] }],
    }
    const result = endpointSchemas.tradingDaily.schema.parse(input)
    expect(result.daily).toEqual(input.daily)
  })
})

describe('tradingSummary schema', () => {
  it('passthrough preserves week/month rows', () => {
    const input = {
      week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] },
      month: { year: 2026, month: 9, rows: [] },
    }
    const result = endpointSchemas.tradingSummary.schema.parse(input)
    expect(result.week.rows).toEqual([])
    expect(result.month.year).toBe(2026)
  })
})
