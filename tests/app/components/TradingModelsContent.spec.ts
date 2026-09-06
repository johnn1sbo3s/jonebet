// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelsContent from '~/components/TradingModelsContent.vue'

vi.mock('~/composables/useTradingModels.js', () => ({ useTradingModels: vi.fn() }))

import { useTradingModels } from '~/composables/useTradingModels'

function mockReturn(overrides = {}) {
  useTradingModels.mockReturnValue({
    daily: ref({ date: '2026-09-05', daily: [] }),
    summary: ref({ week: null, month: null }),
    dailyPending: ref(false),
    summaryPending: ref(false),
    dailyError: ref(null),
    summaryError: ref(null),
    refresh: vi.fn(),
    ...overrides,
  })
}

describe('TradingModelsContent', () => {
  it('shows skeleton cards while daily is pending', async () => {
    mockReturn({ dailyPending: ref(true), pending: ref(true) })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.findComponent({ name: 'TradingModelsSkeleton' }).exists()).toBe(true)
  })

  it('shows error card on daily fetch failure', async () => {
    mockReturn({ dailyError: ref(new Error('boom')) })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('Não foi possível carregar as apostas do dia')
  })

  it('still renders summary tables when daily fails', async () => {
    mockReturn({
      dailyError: ref(new Error('boom')),
      summary: ref({
        week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] },
        month: null,
      }),
    })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('31/08')
  })

  it('shows empty-day message when daily has no models', async () => {
    mockReturn({})
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('Sem apostas neste dia')
  })

  it('renders week table from summary.week', async () => {
    mockReturn({
      summary: ref({
        week: { start_date: '2026-08-31', end_date: '2026-09-06', rows: [] },
        month: null,
      }),
    })
    const wrapper = await mountSuspended(TradingModelsContent)
    expect(wrapper.text()).toContain('31/08')
  })
})
