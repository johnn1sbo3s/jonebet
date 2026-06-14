// @vitest-environment nuxt
// @vitest-environment nuxt
// (mountSuspended requires the nuxt runtime; the global config uses
// happy-dom, so this per-file directive opts the test into nuxt env)
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ResultsTablesGrid from '~/components/resultsTablesGrid.vue'

describe('ResultsTablesGrid', () => {
  const monthly = [
    { monthYear: '2026-01', profit: 10, gameCount: 50, accumulated: 10 },
    { monthYear: '2026-02', profit: -5, gameCount: 40, accumulated: 5 },
  ]
  const daily = [{ date: '2026-02-28', gain: 2, gameCount: 5, accumulated: 5 }]

  it('renders both table headers', async () => {
    const wrapper = await mountSuspended(ResultsTablesGrid, {
      props: { monthlyResults: monthly, dailyResults: daily },
    })
    expect(wrapper.text()).toContain('Resultados por mês')
    expect(wrapper.text()).toContain('Resultados por dia')
  })

  it('shows the correct row counts', async () => {
    const wrapper = await mountSuspended(ResultsTablesGrid, {
      props: { monthlyResults: monthly, dailyResults: daily },
    })
    expect(wrapper.text()).toContain('2 meses')
    expect(wrapper.text()).toContain('1 dias')
  })
})
