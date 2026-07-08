// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MetricsCard from '~/components/metricsCard.vue'

// Mock data shaped to match the current /models/:id contract:
//   - `roi` is already a percentage (e.g. 10.0 = 10%). The front renders it
//     with `formatPercent(roi)` directly — no * 100 anywhere.
//   - `wr` is still a decimal in the API; the front multiplies by 100.
//   - `plb`, `odds`, `medGain`, `medLoss`, `ev`, `dd` are raw values.
//   - `entradas` is an integer count.
const baseMetrics = {
  plb: 85.36,
  roi: 10.0, // 10% (percentage, not decimal)
  wr: 0.65, // 65% once the front multiplies by 100
  odds: 1.65,
  medGain: 0.64,
  medLoss: -1.0,
  ev: 0.07,
  dd: -24.78,
  entradas: 1313,
}

describe('MetricsCard', () => {
  it('renders the card title from prop', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, cardTitle: 'Métricas de validação' },
    })
    expect(wrapper.text()).toContain('Métricas de validação')
  })

  it('renders the Profit (PLB) label and the formatted value', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, cardTitle: 'x' },
    })
    expect(wrapper.text()).toContain('Profit (PLB)')
    // PLB is the first `text-xl` element (header row, left column).
    const plb = wrapper.findAll('p.text-xl')[0]
    expect(plb.text()).toBe('85.36u')
  })

  it('renders ROI as percentage directly from the API value', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, cardTitle: 'x' },
    })
    // ROI is the second `text-xl` element (header row, right column).
    const roi = wrapper.findAll('p.text-xl')[1]
    expect(roi.text()).toBe('10.00%')
  })

  it('applies text-teal-400 to PLB when positive', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, plb: 12.34 }, cardTitle: 'x' },
    })
    const plb = wrapper.findAll('p.text-xl')[0]
    expect(plb.classes()).toContain('text-teal-400')
    expect(plb.classes()).not.toContain('text-red-400')
  })

  it('applies text-red-400 to PLB when negative', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, plb: -7.5 }, cardTitle: 'x' },
    })
    const plb = wrapper.findAll('p.text-xl')[0]
    expect(plb.classes()).toContain('text-red-400')
    expect(plb.classes()).not.toContain('text-teal-400')
  })

  it('applies text-white to PLB when zero', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, plb: 0 }, cardTitle: 'x' },
    })
    const plb = wrapper.findAll('p.text-xl')[0]
    expect(plb.classes()).toContain('text-white')
    expect(plb.classes()).not.toContain('text-teal-400')
    expect(plb.classes()).not.toContain('text-red-400')
  })

  it('applies text-teal-400 to ROI when positive', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, roi: 15.0 }, cardTitle: 'x' },
    })
    const roi = wrapper.findAll('p.text-xl')[1]
    expect(roi.text()).toBe('15.00%')
    expect(roi.classes()).toContain('text-teal-400')
  })

  it('applies text-red-400 to ROI when negative', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, roi: -5.0 }, cardTitle: 'x' },
    })
    const roi = wrapper.findAll('p.text-xl')[1]
    expect(roi.text()).toBe('-5.00%')
    expect(roi.classes()).toContain('text-red-400')
  })

  it('applies text-white to ROI when zero', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, roi: 0 }, cardTitle: 'x' },
    })
    const roi = wrapper.findAll('p.text-xl')[1]
    expect(roi.text()).toBe('0.00%')
    expect(roi.classes()).toContain('text-white')
  })

  it('renders a small negative ROI as -0.50% (precision kept by the API percentage contract)', async () => {
    // The /models/:id API now ships roi already as a percentage, rounded
    // to 2 decimals. A -0.5 input is preserved as "-0.50%" instead of
    // collapsing into "-0.00%" the way the old decimal-contract path
    // did after `Number(-0.001 * 100).toFixed(2)`.
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, roi: -0.5 }, cardTitle: 'x' },
    })
    const roi = wrapper.findAll('p.text-xl')[1]
    expect(roi.text()).toBe('-0.50%')
    expect(roi.classes()).toContain('text-red-400')
  })

  it('still renders zero ROI as 0.00% with neutral color', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, roi: 0 }, cardTitle: 'x' },
    })
    const roi = wrapper.findAll('p.text-xl')[1]
    expect(roi.text()).toBe('0.00%')
    expect(roi.classes()).toContain('text-white')
  })

  it('renders the 8 metric fields with formatted values', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, cardTitle: 'x' },
    })
    const text = wrapper.text()
    expect(text).toContain('WR')
    expect(text).toContain('65%') // wr * 100, formatPercent(decimals=0) drops the .00
    expect(text).toContain('Odd média')
    expect(text).toContain('1.65')
    expect(text).toContain('Win médio')
    expect(text).toContain('0.64')
    expect(text).toContain('Loss médio')
    expect(text).toContain('-1.00')
    expect(text).toContain('EV')
    expect(text).toContain('0.07')
    expect(text).toContain('Máx DD')
    expect(text).toContain('-24.78')
    expect(text).toContain('Entradas')
    expect(text).toContain('1313')
  })

  it('formats WR with no decimals (whole percent)', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, wr: 0.8123 }, cardTitle: 'x' },
    })
    // 0.8123 * 100 = 81.23 -> formatPercent uses decimals=0 for WR -> "81%"
    expect(wrapper.text()).toContain('81%')
  })

  it('computes Lucro efetivo as (ev / -medLoss) * 100', async () => {
    // 0.07 / 1.0 * 100 = 7 -> "7.00%"
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, cardTitle: 'x' },
    })
    expect(wrapper.text()).toContain('Lucro efetivo')
    expect(wrapper.text()).toContain('7.00%')
  })

  it('computes Lucro efetivo as zero when medLoss is zero (avoids Infinity)', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, medLoss: 0 }, cardTitle: 'x' },
    })
    expect(wrapper.text()).toContain('Lucro efetivo')
    expect(wrapper.text()).toContain('0.00%')
    expect(wrapper.text()).not.toContain('Infinity%')
  })

  it('computes negative Lucro efetivo when ev is negative', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: { ...baseMetrics, ev: -0.05, medLoss: -1.0 }, cardTitle: 'x' },
    })
    // (-0.05 / 1.0) * 100 = -5 -> "-5.00%"
    expect(wrapper.text()).toContain('-5.00%')
  })

  it('does not render comparison indicators when compareWith is not provided', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, cardTitle: 'x' },
    })
    expect(wrapper.findAll('[data-metric]').length).toBe(0)
  })

  it('renders a negative delta when real ROI is worse than validation ROI', async () => {
    const real = { ...baseMetrics, roi: -0.05 }
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: real, compareWith: baseMetrics, cardTitle: 'x' },
    })
    const text = wrapper.text()
    expect(text).toContain('-10.05pp')
    // Red = real is worse than validation.
    const deltaSpan = wrapper.find('[data-metric="roi"]')
    expect(deltaSpan.classes()).toContain('text-red-400')
  })

  it('renders a positive delta when real WR is better than validation WR', async () => {
    const real = { ...baseMetrics, wr: 0.7 }
    const val = { ...baseMetrics, wr: 0.65 }
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: real, compareWith: val, cardTitle: 'x' },
    })
    const text = wrapper.text()
    expect(text).toContain('+5.00pp')
    // Green = real is better than validation.
    const deltaSpan = wrapper.find('[data-metric="wr"]')
    expect(deltaSpan.classes()).toContain('text-teal-400')
  })

  it('does not render comparison for PLB, Odd média, or Entradas', async () => {
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: baseMetrics, compareWith: baseMetrics, cardTitle: 'x' },
    })
    const text = wrapper.text()
    expect(text).toContain('Profit (PLB)')
    expect(text).toContain('Odd média')
    expect(text).toContain('Entradas')
    // Only the 7 comparable metrics render a comparison indicator.
    const comparisons = wrapper.findAll('[data-metric]')
    expect(comparisons.length).toBe(7)
  })

  it('renders comparison for Loss médio and Máx DD using the less-negative-is-better rule', async () => {
    const real = { ...baseMetrics, medLoss: -1.2, dd: -50.05 }
    const val = { ...baseMetrics, medLoss: -1.0, dd: -24.78 }
    const wrapper = await mountSuspended(MetricsCard, {
      props: { metricsData: real, compareWith: val, cardTitle: 'x' },
    })
    const text = wrapper.text()
    expect(text).toContain('-0.20u')
    expect(text).toContain('-25.27u')
    // Both deltas are negative (real is worse) -> red.
    const lossSpan = wrapper.find('[data-metric="medLoss"]')
    const ddSpan = wrapper.find('[data-metric="dd"]')
    expect(lossSpan.classes()).toContain('text-red-400')
    expect(ddSpan.classes()).toContain('text-red-400')
  })
})
