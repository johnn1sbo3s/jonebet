// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BetsListCard from '~/components/betsListCard.vue'

describe('BetsListCard', () => {
  const bet = {
    date: '2026-08-14',
    home: 'Palmeiras',
    away: 'Internacional',
    odds: 1.85,
    profit: 2.15,
    result: 'green',
  }

  it('renders date, teams, odds, result and profit', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet } })
    const text = wrapper.text()
    expect(text).toContain('14/08/26')
    expect(text).toContain('Palmeiras')
    expect(text).toContain('Internacional')
    expect(text).toContain('1.85')
    expect(text).toContain('Green')
    expect(text).toContain('2.15u')
  })

  it('colors profit teal for positive and red for negative', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet } })
    const positive = [...wrapper.findAll('span')].find((s) => s.text() === '2.15u')
    expect(positive.classes()).toContain('text-teal-400')

    const loss = await mountSuspended(BetsListCard, { props: { bet: { ...bet, profit: -1, result: 'red' } } })
    const negative = [...loss.findAll('span')].find((s) => s.text() === '-1.00u')
    expect(negative.classes()).toContain('text-red-400')
  })

  it('applies :title with the full team name and truncate class on both teams', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet } })
    const home = [...wrapper.findAll('span')].find((s) => s.text() === 'Palmeiras')
    const away = [...wrapper.findAll('span')].find((s) => s.text() === 'Internacional')
    expect(home.attributes('title')).toBe('Palmeiras')
    expect(home.classes()).toContain('truncate')
    expect(away.attributes('title')).toBe('Internacional')
    expect(away.classes()).toContain('truncate')
  })

  it('capitalizes the result pill (Green/Red)', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet: { ...bet, result: 'red' } } })
    const text = wrapper.text()
    expect(text).toContain('Red')
    expect(text).not.toContain('red')
  })

  it('shows a dash when result is missing', async () => {
    const wrapper = await mountSuspended(BetsListCard, { props: { bet: { ...bet, result: null } } })
    expect(wrapper.text()).toContain('—')
  })
})
