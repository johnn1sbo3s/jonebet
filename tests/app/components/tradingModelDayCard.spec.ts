// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelDayCard from '~/components/tradingModelDayCard.vue'

const mockModel = {
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
}

describe('TradingModelDayCard', () => {
  it('renders model badge', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    expect(wrapper.text()).toContain('Donkey')
  })

  it('renders subtotal with pnl-pos class when positive', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    const subtotal = wrapper.find('[data-testid="subtotal"]')
    expect(subtotal.classes()).toContain('pnl-pos')
    expect(subtotal.text()).toContain('10.00')
  })

  it('renders bet row with result badge', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    expect(wrapper.text()).toContain('Basaksehir vs Galatasaray')
    expect(wrapper.text()).toContain('GREEN')
  })

  it('applies pnl-neg class when subtotal is negative', async () => {
    const negativeModel = { ...mockModel, subtotal: -23.17 }
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: negativeModel },
    })
    const subtotal = wrapper.find('[data-testid="subtotal"]')
    expect(subtotal.classes()).toContain('pnl-neg')
  })

  it('renders profit cell with green color when positive', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    const profitCells = wrapper.findAll('.text-green-400')
    expect(profitCells.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('10.00u')
  })

  it('renders profit cell with red color when negative', async () => {
    const negativeBetModel = {
      ...mockModel,
      bets: [{ ...mockModel.bets[0], profit: -33.17 }],
    }
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: negativeBetModel },
    })
    const redCells = wrapper.findAll('.text-red-400')
    expect(redCells.length).toBeGreaterThan(0)
  })
})
