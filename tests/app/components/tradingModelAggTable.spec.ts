// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelAggTable from '~/components/tradingModelAggTable.vue'

const mockAgg = {
  rows: [
    { model: 'crash', games: 4, green: 3, red_light: 0, red: 1, total: -5.54 },
    { model: 'donkey', games: 5, green: 2, red_light: 3, red: 0, total: 3.28 },
  ],
  total: -2.26,
}

describe('TradingModelAggTable', () => {
  it('renders title', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.text()).toContain('Semana')
  })

  it('renders all rows', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.text()).toContain('crash')
    expect(wrapper.text()).toContain('donkey')
  })

  it('renders total row', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.text()).toContain('TOTAL')
  })
})
