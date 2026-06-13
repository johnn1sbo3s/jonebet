// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PerformanceChartCard from '~/components/performanceChartCard.vue'

describe('PerformanceChartCard', () => {
  const chosenModelId = 'model_x'
  const dailyResults = [{ date: '2026-02-28', gain: 2, gameCount: 5, accumulated: 5 }]
  const dailyResultsPending = false

  it('renders the chart card header', async () => {
    const wrapper = await mountSuspended(PerformanceChartCard, {
      props: { chosenModelId, chartByDay: false, dailyResults, dailyResultsPending },
    })
    expect(wrapper.text()).toContain('Gráfico de acúmulo de capital')
  })

  it('renders the Exibição por dia switch', async () => {
    const wrapper = await mountSuspended(PerformanceChartCard, {
      props: { chosenModelId, chartByDay: false, dailyResults, dailyResultsPending },
    })
    expect(wrapper.text()).toContain('Exibição por dia')
  })

  it('renders the metric labels', async () => {
    const wrapper = await mountSuspended(PerformanceChartCard, {
      props: { chosenModelId, chartByDay: false, dailyResults, dailyResultsPending },
    })
    expect(wrapper.text()).toContain('R²')
    expect(wrapper.text()).toContain('Total acumulado')
    expect(wrapper.text()).toContain('Período')
    expect(wrapper.text()).toContain('Drawdown')
    expect(wrapper.text()).toContain('Sharpe')
    expect(wrapper.text()).toContain('Streak atual')
    expect(wrapper.text()).toContain('% dias negativos')
  })

  it('opens the Sharpe modal when its info button is clicked', async () => {
    const wrapper = await mountSuspended(PerformanceChartCard, {
      props: { chosenModelId, chartByDay: false, dailyResults, dailyResultsPending },
    })
    const button = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'O que é Sharpe anualizado?')
    expect(button).toBeTruthy()
    await button!.trigger('click')
    await wrapper.vm.$nextTick()
    // UModal portals its body to document.body, so wrapper.text() can't
    // see it — query the document directly.
    expect(document.body.textContent).toContain('retorno médio por unidade de risco')
  })

  it('does not error when Restaurar zoom is clicked', async () => {
    const wrapper = await mountSuspended(PerformanceChartCard, {
      props: { chosenModelId, chartByDay: false, dailyResults, dailyResultsPending },
    })
    const button = wrapper.findAll('button').find((b) => b.text() === 'Restaurar zoom')
    expect(button).toBeTruthy()
    await expect(button!.trigger('click')).resolves.not.toThrow()
  })
})
