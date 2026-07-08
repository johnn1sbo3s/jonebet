// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StatisticalSignificanceCard from '~/components/statisticalSignificanceCard.vue'

const baseStats = {
  roiTStatistic: -0.21,
  roiPValue: 0.834,
  roiConfidenceInterval: [-0.52, 0.42],
  positiveEdgeProbability: 41.7,
  wrTStatistic: 0.65,
  wrPValue: 0.516,
  kellyCriterion: -0.02,
  minimumSampleSize: 3847,
  sampleSizeRemaining: 2805,
}

describe('StatisticalSignificanceCard', () => {
  it('renders the section title', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: baseStats },
    })
    expect(wrapper.text()).toContain('Significância Estatística')
  })

  it('renders all 8 metrics', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: baseStats },
    })
    const text = wrapper.text()
    expect(text).toContain('T-statistic ROI')
    expect(text).toContain('p-value ROI')
    expect(text).toContain('IC 95% ROI')
    expect(text).toContain('Prob. edge positivo')
    expect(text).toContain('T-statistic WR')
    expect(text).toContain('p-value WR')
    expect(text).toContain('Kelly Criterion')
    expect(text).toContain('Amostra mínima')
  })

  it('colors p-value red when above 0.05', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: baseStats },
    })
    const pValue = wrapper.findAll('p.text-base').find((el) => el.text() === '0.834')
    expect(pValue).toBeDefined()
    expect(pValue.classes()).toContain('text-red-400')
  })

  it('colors p-value green when below 0.05', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: { ...baseStats, roiPValue: 0.01 } },
    })
    const pValue = wrapper.findAll('p.text-base').find((el) => el.text() === '0.010')
    expect(pValue).toBeDefined()
    expect(pValue.classes()).toContain('text-teal-400')
  })

  it('colors Kelly red when negative or zero', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: baseStats },
    })
    const kelly = wrapper.findAll('p.text-base').find((el) => el.text() === '-0.02%')
    expect(kelly).toBeDefined()
    expect(kelly.classes()).toContain('text-red-400')
  })

  it('colors sample size green when no remaining samples are needed', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: { ...baseStats, sampleSizeRemaining: 0 } },
    })
    const sample = wrapper.findAll('p.text-base').find((el) => el.text() === '3847')
    expect(sample).toBeDefined()
    expect(sample.classes()).toContain('text-teal-400')
  })

  it('renders dashes when stats are null', async () => {
    const wrapper = await mountSuspended(StatisticalSignificanceCard, {
      props: { stats: null },
    })
    expect(wrapper.text()).toContain('—')
  })
})
