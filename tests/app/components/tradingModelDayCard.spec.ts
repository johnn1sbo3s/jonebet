// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelDayCard from '~/components/tradingModelDayCard.vue'

const mockModel = {
  model: 'lay_0x1_donkey',
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
      goals_home: ['34'],
      goals_away: ['54', '68', '84'],
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

  it('renders subtotal with green color when positive', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    const subtotal = wrapper.find('[data-testid="subtotal"]')
    expect(subtotal.classes()).toContain('text-green-400')
    expect(subtotal.classes()).toContain('font-bold')
    expect(subtotal.text()).toContain('10.00')
  })

  it('renders bet row with result badge', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: mockModel },
    })
    expect(wrapper.text()).toContain('Basaksehir vs Galatasaray')
    expect(wrapper.text()).toContain('GREEN')
  })

  it('applies red color when subtotal is negative', async () => {
    const negativeModel = { ...mockModel, subtotal: -23.17 }
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: negativeModel },
    })
    const subtotal = wrapper.find('[data-testid="subtotal"]')
    expect(subtotal.classes()).toContain('text-red-400')
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

  it('derives badge label from full model name', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: { model: { ...mockModel, model: 'lay_0x1_scorpion', model_label: '0x1' } },
    })
    expect(wrapper.text()).toContain('Scorpion')
  })

  it('renders dashes for PENDING bet without crashing', async () => {
    const pendingModel = {
      ...mockModel,
      model: 'lay_0x1_scorpion',
      bets: [
        {
          fixture_id: 'p1',
          home: 'Flu',
          away: 'Fla',
          time: '18:00',
          odd: 4.2,
          ht_score: null,
          minute_70_score: null,
          ft_score: null,
          goals_home: null,
          goals_away: null,
          result: 'PENDING',
          profit: 0,
        },
      ],
    }
    const wrapper = await mountSuspended(TradingModelDayCard, { props: { model: pendingModel } })
    expect(wrapper.text()).toContain('PENDING')
    expect(wrapper.text()).toContain('—')
  })

  it('renders goal minutes literally with comma separator', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: {
        model: { ...mockModel, bets: [{ ...mockModel.bets[0], goals_home: [], goals_away: ['53', '90+10'] }] },
      },
    })
    expect(wrapper.text()).toContain("53', 90+10'")
  })

  it('renders double dash when no goals', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: {
        model: { ...mockModel, bets: [{ ...mockModel.bets[0], goals_home: [], goals_away: [] }] },
      },
    })
    expect(wrapper.text()).toContain('--')
  })

  it('displays RED_LIGHT as AJUSTE', async () => {
    const wrapper = await mountSuspended(TradingModelDayCard, {
      props: {
        model: { ...mockModel, bets: [{ ...mockModel.bets[0], result: 'RED_LIGHT' }] },
      },
    })
    expect(wrapper.text()).toContain('AJUSTE')
    expect(wrapper.text()).not.toContain('RED_LIGHT')
  })
})
