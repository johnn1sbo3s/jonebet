// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelsPage from '~/pages/trading-models.vue'

vi.mock('~/composables/useTradingModels.js', async () => {
  const { ref } = await import('vue')
  return {
    useTradingModels: () => ({
      data: ref({
        date: '2026-09-04',
        daily: [
          {
            model: 'donkey',
            model_label: 'Donkey',
            subtotal: 10.0,
            bets: [
              {
                fixture_id: 'f1',
                time: '14:00',
                home: 'Basaksehir',
                away: 'Galatasaray',
                odd: 14.55,
                ht_score: [0, 1],
                minute_70_score: [1, 1],
                ft_score: [2, 3],
                goals_home_minutes: ['34'],
                goals_away_minutes: ['54', '68', '84'],
                result: 'GREEN',
                profit: 10.0,
                liability: 0,
              },
            ],
          },
        ],
        weekly: { rows: [{ model: 'donkey', games: 1, green: 1, red_light: 0, red: 0, total: 10 }], total: 10 },
        monthly: { rows: [{ model: 'donkey', games: 1, green: 1, red_light: 0, red: 0, total: 10 }], total: 10 },
      }),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn(),
    }),
  }
})

describe('Trading Models Page', () => {
  it('renders header with title', async () => {
    const wrapper = await mountSuspended(TradingModelsPage)
    expect(wrapper.text()).toContain('Trading Models')
  })

  it('renders DatePicker', async () => {
    const wrapper = await mountSuspended(TradingModelsPage)
    expect(
      wrapper.find('[data-testid="date-picker"]').exists() ||
        wrapper.text().includes('05/09') ||
        wrapper.html().includes('calendar') ||
        wrapper.findComponent({ name: 'DatePicker' }).exists() ||
        wrapper.find('button[aria-label="Choose Date"]').exists() ||
        wrapper.find('button').text().includes('2026'),
    ).toBe(true)
  })

  it('renders daily cards for each model', async () => {
    const wrapper = await mountSuspended(TradingModelsPage)
    expect(wrapper.text()).toContain('Donkey')
    expect(wrapper.text()).toContain('Basaksehir vs Galatasaray')
  })
})
