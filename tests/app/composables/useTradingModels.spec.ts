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

  it('refresh refetches summary after a failure and clears the error', async () => {
    let summaryCalls = 0
    const fetchFn = vi.fn(async (url) => {
      if (!url.includes('/summary')) return DAILY
      summaryCalls += 1
      if (summaryCalls === 1) throw new Error('summary boom')
      return SUMMARY
    })
    const { summary, summaryError, refresh } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await flush()
    expect(summaryError.value).toBeInstanceOf(Error)
    expect(summary.value.week).toBeNull()

    refresh()
    await flush()
    expect(summaryCalls).toBe(2)
    expect(summaryError.value).toBeNull()
    expect(summary.value.week.start_date).toBe('2026-08-31')
  })

  it('refresh failure surfaces the error and the next refresh recovers', async () => {
    let summaryCalls = 0
    const fetchFn = vi.fn(async (url) => {
      if (!url.includes('/summary')) return DAILY
      summaryCalls += 1
      if (summaryCalls === 2) throw new Error('summary boom again')
      return SUMMARY
    })
    const { summary, summaryError, refresh } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await flush()

    refresh()
    await flush()
    expect(summaryError.value).toBeInstanceOf(Error)

    refresh()
    await flush()
    expect(summaryCalls).toBe(3)
    expect(summaryError.value).toBeNull()
    expect(summary.value.week.start_date).toBe('2026-08-31')
  })

  it('refresh issues exactly one extra summary request, never two', async () => {
    const fetchFn = fetchFnFor()
    const { refresh } = useTradingModels({ date: ref('2026-09-05'), fetchFn })
    await flush()
    refresh()
    await flush()
    expect(fetchFn.mock.calls.filter(([u]) => u.includes('/summary')).length).toBe(2)
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

describe('useTradingModels: respostas fora de ordem', () => {
  function deferredFetch() {
    const pending: Record<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }> = {}
    const fetchFn = vi.fn((url) => {
      if (url.includes('/summary')) return Promise.resolve(SUMMARY)
      const requested = url.split('date=')[1]
      const { promise, resolve, reject } = Promise.withResolvers<unknown>()
      pending[requested] = { resolve, reject }
      return promise
    })
    return { fetchFn, pending }
  }

  it('ignora a resposta antiga que chega depois da nova', async () => {
    const { fetchFn, pending } = deferredFetch()
    const date = ref('2026-09-03')
    const { daily } = useTradingModels({ date, fetchFn })
    await flush()

    date.value = '2026-09-04'
    await flush()
    pending['2026-09-04'].resolve({ date: '2026-09-04', daily: [{ model: 'novo' }] })
    await flush()
    expect(daily.value.date).toBe('2026-09-04')

    pending['2026-09-03'].resolve({ date: '2026-09-03', daily: [{ model: 'antigo' }] })
    await flush()
    expect(daily.value.date).toBe('2026-09-04')
    expect(daily.value.daily[0].model).toBe('novo')
  })

  it('não deixa a resposta antiga marcar erro nem zerar o pending da nova', async () => {
    const { fetchFn, pending } = deferredFetch()
    const date = ref('2026-09-03')
    const { daily, dailyError, dailyPending } = useTradingModels({ date, fetchFn })
    await flush()

    date.value = '2026-09-04'
    await flush()
    pending['2026-09-04'].resolve({ date: '2026-09-04', daily: [{ model: 'novo' }] })
    await flush()

    pending['2026-09-03'].reject(new Error('antigo falhou'))
    await flush()
    expect(dailyError.value).toBeNull()
    expect(dailyPending.value).toBe(false)
    expect(daily.value.daily[0].model).toBe('novo')
  })

  it('mantém pending enquanto a requisição da data vigente está em voo', async () => {
    const { fetchFn, pending } = deferredFetch()
    const date = ref('2026-09-03')
    const { dailyPending } = useTradingModels({ date, fetchFn })
    await flush()
    date.value = '2026-09-04'
    await flush()
    pending['2026-09-03'].resolve({ date: '2026-09-03', daily: [] })
    await flush()
    expect(dailyPending.value).toBe(true)
    pending['2026-09-04'].resolve({ date: '2026-09-04', daily: [] })
    await flush()
    expect(dailyPending.value).toBe(false)
  })
})

describe('useTradingModels: encoding da query date', () => {
  it('codifica caracteres especiais da data sem injetar parâmetros extras', async () => {
    const fetchFn = fetchFnFor()
    useTradingModels({ date: ref('2026-09-05&evil=1 #x'), fetchFn })
    await flush()
    const url = fetchFn.mock.calls.find(([u]) => u.includes('/daily'))[0]
    expect(url).toContain('date=2026-09-05%26evil%3D1%20%23x')
    expect(new URL(url).searchParams.get('date')).toBe('2026-09-05&evil=1 #x')
    expect(new URL(url).searchParams.get('evil')).toBeNull()
  })
})
