// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlockMetricsPanel from '~/components/blockMetricsPanel.vue'

describe('BlockMetricsPanel', () => {
  const metricsTotal = {
    media: 1.5,
    desvpad: 2.3,
    med_dp: 0.65,
    diff_med_dp_um_96_raiz: 0.12,
    intervalo_confianca: [-0.5, 3.5],
    media_atual: 0.8,
    desvpad_atual: 1.2,
    qtd_jgs_atual: 73,
  }
  const blocksHistory = [{ profit: 10, qtd_jogos: 100, roi: 0.1, ult_dia: '2026-01-31' }]

  it('renders the block-metrics header', async () => {
    const wrapper = await mountSuspended(BlockMetricsPanel, {
      props: { metricsTotal, blocksHistory },
    })
    expect(wrapper.text()).toContain('Resultados por blocos de 100 jogos')
  })

  it('renders the history sub-header', async () => {
    const wrapper = await mountSuspended(BlockMetricsPanel, {
      props: { metricsTotal, blocksHistory },
    })
    expect(wrapper.text()).toContain('Histórico')
  })

  it('passes the metricsTotal prop to the inner cards', async () => {
    const wrapper = await mountSuspended(BlockMetricsPanel, {
      props: { metricsTotal, blocksHistory },
    })
    const blockMetrics = wrapper.findComponent({ name: 'BlockMetricsCard' })
    expect(blockMetrics.exists()).toBe(true)
    expect(blockMetrics.props('metricsData')).toBe(metricsTotal)
  })
})
