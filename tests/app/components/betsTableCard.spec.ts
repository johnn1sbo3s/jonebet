// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BetsTableCard from '~/components/betsTableCard.vue'

describe('BetsTableCard', () => {
  const bets = [{ Date: '2026-02-28', Home: 'A', Away: 'B', Odds: 1.5, Resultado: 'W', Profit: 0.5 }]

  it('renders the bets total count', async () => {
    const wrapper = await mountSuspended(BetsTableCard, {
      props: { betsItems: bets, betsTotal: 250, page: 1, betsTotalPages: 3, betsSize: 100 },
    })
    expect(wrapper.text()).toContain('250 jogos')
  })

  it('disables "Previous" on page 1', async () => {
    const wrapper = await mountSuspended(BetsTableCard, {
      props: { betsItems: bets, betsTotal: 250, page: 1, betsTotalPages: 3, betsSize: 100 },
    })
    const prev = wrapper.find('button[aria-label="Previous Page"]')
    expect(prev.attributes('disabled')).toBeDefined()
  })

  it('disables "Next" on the last page', async () => {
    const wrapper = await mountSuspended(BetsTableCard, {
      props: { betsItems: bets, betsTotal: 250, page: 3, betsTotalPages: 3, betsSize: 100 },
    })
    const next = wrapper.find('button[aria-label="Next Page"]')
    expect(next.attributes('disabled')).toBeDefined()
  })

  it('emits update:page when "Next" is clicked', async () => {
    const wrapper = await mountSuspended(BetsTableCard, {
      props: { betsItems: bets, betsTotal: 250, page: 1, betsTotalPages: 3, betsSize: 100 },
    })
    const next = wrapper.find('button[aria-label="Next Page"]')
    await next.trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
  })
})
