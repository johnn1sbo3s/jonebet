// @vitest-environment nuxt
import { describe, expect, it, vi, afterEach, type MockInstance } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import IndexPage from '~/pages/index.vue'
import YesterdayMetricsCard from '~/components/yesterdayMetricsCard.vue'

const DASHBOARD = {
  bankrollEvolution: [{ month: 'Julho/26', profit: 10, bankroll: 10 }],
  yesterday: {
    date: '2026-09-02',
    results: [{ id: 'seed-1' }],
    topModels: [],
    metrics: { profit: 1, invested: 10, roi: 10, bets: 1, models: 1 },
    positiveModels: 1,
  },
  month: { metrics: { profit: 3, invested: 30, roi: 10 }, topModels: [], results: [], positiveModels: 0 },
}

mockNuxtImport('useFetch', () => () => ({ data: ref(DASHBOARD), status: ref('success'), error: ref(null) }))

// `$fetch` na página vem de `#build/fetch.mjs` (auto-import do Nuxt), não do
// global — o controle por data precisa vir do import.
const net = vi.hoisted(() => {
  const pending: Record<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }> = {}
  const fetchMock = vi.fn((url: string) => {
    const { promise, resolve, reject } = Promise.withResolvers<unknown>()
    pending[url.split('/daily-results/')[1]] = { resolve, reject }
    return promise
  })
  return { pending, fetchMock }
})

mockNuxtImport('$fetch', () => net.fetchMock)

function dayPayload(date: string, profit: number) {
  return {
    date,
    results: [{ id: `${date}-1` }],
    topModels: [],
    metrics: { profit, invested: 10, roi: profit * 10, bets: 1, models: 1 },
    positiveModels: 1,
  }
}

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('home: resposta de data antiga não sobrescreve a vigente', () => {
  async function mountWithTwoDates() {
    const wrapper = await mountSuspended(IndexPage)
    await flush()

    const picker = wrapper.findComponent({ name: 'DatePicker' })
    picker.vm.$emit('update:modelValue', '2026-09-03')
    await flush()
    picker.vm.$emit('update:modelValue', '2026-09-04')
    await flush()
    return wrapper
  }

  it('mantém os dados da segunda data quando a primeira responde por último', async () => {
    const wrapper = await mountWithTwoDates()

    net.pending['2026-09-04'].resolve(dayPayload('2026-09-04', 42))
    await flush()
    net.pending['2026-09-03'].resolve(dayPayload('2026-09-03', 7))
    await flush()

    const dayCard = wrapper.findAllComponents(YesterdayMetricsCard)[0]
    expect(dayCard.props('items').find((i: { name: string }) => i.name === 'Profit').value).toBe(42)
  })

  it('falha da data antiga não apaga nem marca erro na data vigente', async () => {
    const wrapper = await mountWithTwoDates()

    net.pending['2026-09-04'].resolve(dayPayload('2026-09-04', 42))
    await flush()
    net.pending['2026-09-03'].reject(new Error('antigo falhou'))
    await flush()

    expect(wrapper.text()).not.toContain('Não foi possível carregar os resultados')
    const dayCard = wrapper.findAllComponents(YesterdayMetricsCard)[0]
    expect(dayCard.props('items').find((i: { name: string }) => i.name === 'Profit').value).toBe(42)
  })
})

// Ticket 15: a home e a página de performance produzem o mesmo "ontem" para o
// mesmo instante, e esse "ontem" é o de São Paulo (SP_TZ), não o da TZ da máquina.
describe('home: "ontem" do date picker segue a timezone do app', () => {
  const originalTz = process.env.TZ
  let nowSpy: MockInstance<() => number> | null = null

  // 2026-10-04T02:30Z = 2026-10-03 23:30 em SP: "ontem" em SP é 02/10, mas
  // "ontem" na TZ da máquina (UTC) seria 03/10.
  const INSTANT = new Date('2026-10-04T02:30:00Z')

  afterEach(() => {
    nowSpy?.mockRestore()
    nowSpy = null
    if (originalTz === undefined) delete process.env.TZ
    else process.env.TZ = originalTz
  })

  it('limita o picker no ontem de SP com a SO em UTC', async () => {
    process.env.TZ = 'UTC'
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(INSTANT.getTime())

    const wrapper = await mountSuspended(IndexPage)
    const picker = wrapper.findComponent({ name: 'DatePicker' })
    expect(picker.props('maxValue')).toBe('2026-10-02')
  })
})
