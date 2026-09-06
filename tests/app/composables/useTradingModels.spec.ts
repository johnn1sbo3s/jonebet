// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useTradingModels } from '~/composables/useTradingModels'

const DAILY = {
  date: '2026-09-05',
  daily: [{ model: 'lay_0x1_scorpion', model_label: '0x1', subtotal: 1.5, bets: [] }],
}
const SUMMARY = {
  week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] },
  month: { year: 2026, month: 9, rows: [] },
}

function fetchFnFor(daily = DAILY, summary = SUMMARY) {
  return vi.fn(async (url) => (url.includes('/summary') ? summary : daily))
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('useTradingModels', () => {
  it('fetches daily with date and summary without query', async () => {
    const fetchFn = fetchFnFor()
    const { daily, summary } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await flush()
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/trading-models/daily?date=2026-09-05'))
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('/trading-models/summary'))
    expect(daily.value.daily).toHaveLength(1)
    expect(summary.value.week.start_date).toBe('2026-08-31')
  })

  it('exposes fetch errors instead of mock data', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('boom')
    })
    const { daily, dailyError } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await flush()
    expect(dailyError.value).toBeInstanceOf(Error)
    expect(daily.value.daily).toEqual([])
  })

  it('date change reloads daily only, summary stays cached', async () => {
    const fetchFn = fetchFnFor()
    const date = ref('2026-09-05')
    useTradingModels({ date, fetchFn })
    await flush()
    date.value = '2026-09-04'
    await flush()
    expect(fetchFn.mock.calls.filter(([u]) => u.includes('/daily')).length).toBe(2)
    expect(fetchFn.mock.calls.filter(([u]) => u.includes('/summary')).length).toBe(1)
  })
})

it('daily failure does not block summary rendering', async () => {
  const fetchFn = vi.fn(async (url) => {
    if (url.includes('/summary')) return SUMMARY
    throw new Error('daily boom')
  })
  const { daily, summary, dailyError, summaryError } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
  await flush()
  expect(dailyError.value).toBeInstanceOf(Error)
  expect(summaryError.value).toBeNull()
  expect(summary.value.week.start_date).toBe('2026-08-31')
  expect(daily.value.daily).toEqual([])
})
