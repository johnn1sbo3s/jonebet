// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlockMetricsPanel from '~/components/blockMetricsPanel.vue'

describe('BlockMetricsPanel', () => {
  const metricsTotal = {
    mean: 1.5,
    stdDev: 2.3,
    meanStdDev: 0.65,
    diffMeanStdDev96Sqrt: 0.12,
    confidenceInterval: [-0.5, 3.5],
    currentMean: 0.8,
    currentStdDev: 1.2,
    currentGameCount: 73,
  }
  const blocksHistory = [{ profit: 10, gameCount: 100, roi: 0.1, endDate: '2026-01-31' }]

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
