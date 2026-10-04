// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BetsTableCard from '~/components/betsTableCard.vue'

// Na tabela "Jogos reais" o único <span> dentro de uma <td> é o da coluna
// de resultado (data/casa/fora/odds/lucro são texto puro).
const resultSpans = (wrapper) => wrapper.findAll('tbody td span')

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

  it('renders the card list for mobile with the real bet fields', async () => {
    const realBets = [
      { date: '2026-08-14', home: 'Palmeiras', away: 'Internacional', odds: 1.85, profit: 2.15, result: 'green' },
    ]
    const wrapper = await mountSuspended(BetsTableCard, {
      props: { betsItems: realBets, betsTotal: 250, page: 1, betsTotalPages: 3, betsSize: 100 },
    })
    const cards = wrapper.findAllComponents({ name: 'BetsListCard' })
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('Palmeiras')
  })

  describe('cor da coluna de resultado', () => {
    const mountWithResults = (results) =>
      mountSuspended(BetsTableCard, {
        props: {
          betsItems: results.map((result, i) => ({
            date: '2026-10-0' + (i + 1),
            home: `Casa ${i}`,
            away: `Fora ${i}`,
            odds: 1.5,
            profit: 1,
            result,
          })),
          betsTotal: 4,
          page: 1,
          betsTotalPages: 1,
          betsSize: 100,
        },
      })

    it('green fica teal, PENDING/absente ficam neutros e negativo fica vermelho', async () => {
      const wrapper = await mountWithResults(['green', 'PENDING', null, 'red'])

      const [green, pending, absent, negative] = resultSpans(wrapper)

      expect(green.text()).toBe('Green')
      expect(green.classes()).toContain('text-teal-400')

      expect(pending.text()).toBe('PENDING')
      expect(pending.classes()).toContain('text-zinc-400')
      expect(pending.classes()).not.toContain('text-red-400')

      expect(absent.text()).toBe('—')
      expect(absent.classes()).toContain('text-zinc-400')
      expect(absent.classes()).not.toContain('text-red-400')

      expect(negative.text()).toBe('Red')
      expect(negative.classes()).toContain('text-red-400')
    })

    it('PENDING em caixa baixa também é neutro', async () => {
      const wrapper = await mountWithResults(['pending'])
      const [pending] = resultSpans(wrapper)
      expect(pending.classes()).toContain('text-zinc-400')
      expect(pending.classes()).not.toContain('text-red-400')
    })
  })
})
