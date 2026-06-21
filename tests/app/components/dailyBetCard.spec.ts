// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DailyBetCard from '~/components/dailyBetCard.vue'

describe('DailyBetCard', () => {
  const bet = {
    Date: '2026-06-21',
    Time: '16:00',
    Home: 'Flamengo',
    Away: 'Palmeiras',
    FT_Odds_H: '2.10',
    FT_Odds_D: '3.40',
    FT_Odds_A: '3.25',
    Modelo: 'Lay favorite home',
  }

  it('renders the date badge with abbreviated month and day', async () => {
    const wrapper = await mountSuspended(DailyBetCard, { props: { bet } })
    const text = wrapper.text()
    expect(text).toContain('Jun')
    expect(text).toContain('21')
  })

  it('renders the time and model on the header line', async () => {
    const wrapper = await mountSuspended(DailyBetCard, { props: { bet } })
    const text = wrapper.text()
    expect(text).toContain('Horário · Modelo')
    expect(text).toContain('16:00')
    expect(text).toContain('Lay favorite home')
  })

  it('renders the match with Home and Away split into two rows', async () => {
    const wrapper = await mountSuspended(DailyBetCard, { props: { bet } })
    const text = wrapper.text()
    expect(text).toContain('Flamengo')
    expect(text).toContain('Palmeiras')
    expect(text).toContain('Casa')
    expect(text).toContain('Fora')
  })

  it('renders the three odds cells with H/D/A labels and values', async () => {
    const wrapper = await mountSuspended(DailyBetCard, { props: { bet } })
    const text = wrapper.text()
    expect(text).toContain('H')
    expect(text).toContain('D')
    expect(text).toContain('A')
    expect(text).toContain('2.10')
    expect(text).toContain('3.40')
    expect(text).toContain('3.25')
  })

  it('applies the card container classes (rounded-2xl, zinc surface)', async () => {
    const wrapper = await mountSuspended(DailyBetCard, { props: { bet } })
    const root = wrapper.element
    expect(root.className).toContain('rounded-2xl')
    expect(root.className).toContain('border')
    expect(root.className).toContain('border-zinc-800')
    expect(root.className).toContain('bg-zinc-900')
  })
})
