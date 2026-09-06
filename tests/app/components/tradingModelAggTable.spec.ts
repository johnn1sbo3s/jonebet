// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TradingModelAggTable from '~/components/tradingModelAggTable.vue'

const mockAgg = {
  rows: [
    { model: 'lay_0x1_crash', model_label: '0x1', games: 4, green: 3, red_light: 0, red: 1, total: -5.54 },
    { model: 'lay_0x1_donkey', model_label: '0x1', games: 5, green: 2, red_light: 3, red: 0, total: 3.28 },
  ],
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
    expect(wrapper.text()).toContain('Crash')
    expect(wrapper.text()).toContain('Donkey')
    expect(wrapper.text()).not.toContain('lay_0x1_crash')
  })

  it('renders total row', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.text()).toContain('TOTAL')
  })

  it('computes TOTAL from rows when agg.total is absent', async () => {
    const wrapper = await mountSuspended(TradingModelAggTable, {
      props: { title: 'Semana', agg: mockAgg },
    })
    expect(wrapper.find('[data-testid="agg-total"]').text()).toContain('-2.26')
  })
})
