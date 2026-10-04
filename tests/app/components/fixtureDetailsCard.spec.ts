// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import FixtureDetailsCard from '~/components/fixtureDetailsCard.vue'

// Ticket 21: odd ausente (fonte exchange sem BTTS/O2.5) precisa virar o
// placeholder "—", não um "0.00" fabricado que parece odd real.
describe('FixtureDetailsCard: odds ausentes', () => {
  const baseFixture = {
    Date: '2026-10-03',
    Time: '21:00',
    League: 'Serie A',
    Home: 'Flamengo',
    Away: 'Palmeiras',
    Fixture_ID: 1,
    FT_Odds_H: 1.85,
    FT_Odds_D: 3.4,
    FT_Odds_A: 4.2,
    Odds_O25: undefined,
    Odds_U25: undefined,
    BTTS_Yes: undefined,
    BTTS_No: undefined,
  }

  function card(fixture: Record<string, unknown>) {
    return mountSuspended(FixtureDetailsCard, { props: { fixture, bets: [] } })
  }

  it('renderiza "—" nos mercados sem odd, sem zeros fabricados', async () => {
    const wrapper = await card(baseFixture)
    const text = wrapper.text()
    expect(text).toContain('—')
    expect(text).not.toContain('0.00')
  })

  it('odd presente mantém o formato atual', async () => {
    const wrapper = await card({ ...baseFixture, Odds_O25: 1.9, Odds_U25: 1.95 })
    const text = wrapper.text()
    expect(text).toContain('1.85')
    expect(text).toContain('1.90')
    expect(text).toContain('1.95')
  })

  it('odd zero real continua exibido como 0.00', async () => {
    const wrapper = await card({ ...baseFixture, Odds_O25: 0, Odds_U25: 0, BTTS_Yes: 0, BTTS_No: 0 })
    const text = wrapper.text()
    expect(text).toContain('0.00')
    expect(text).not.toContain('—')
  })
})
