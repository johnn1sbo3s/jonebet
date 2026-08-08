// tests/app/components/momentumChart.spec.ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MomentumChart from '~/components/momentumChart.vue'

describe('MomentumChart', () => {
  it('renderiza uma barra por minuto com dados', async () => {
    const wrapper = await mountSuspended(MomentumChart, {
      props: {
        bars: [
          { minute: 1, home: 0.5, away: 0 },
          { minute: 2, home: 0, away: 0.8 },
        ],
      },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('rect')).toHaveLength(2)
  })

  it('mostra placeholder sem barras', async () => {
    const wrapper = await mountSuspended(MomentumChart, { props: { bars: [] } })
    expect(wrapper.text()).toContain('aguardando dados do gráfico')
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
