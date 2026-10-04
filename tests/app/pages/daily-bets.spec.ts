// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import DailyBetsPage from '~/pages/daily-bets.vue'

// Ticket 21: odds ausentes na lista de apostas do dia não podem virar "0.00"
// (odd real) — viram o placeholder "—".
const BETS = {
  date: '2026-10-03',
  bets: [
    {
      _id: 'b1',
      Date: '2026-10-03',
      Time: '21:00',
      Home: 'Flamengo',
      Away: 'Palmeiras',
      Modelo: 'modelo_1',
      Market: 'Match Odds',
      FT_Odds_H: 1.85,
      FT_Odds_D: 3.4,
      FT_Odds_A: 4.2,
    },
    {
      _id: 'b2',
      Date: '2026-10-03',
      Time: '21:00',
      Home: 'Corinthians',
      Away: 'São Paulo',
      Modelo: 'modelo_1',
      Market: 'BTTS',
      FT_Odds_H: undefined,
      FT_Odds_D: undefined,
      FT_Odds_A: undefined,
    },
  ],
  total: 2,
}

mockNuxtImport('useModelsList', () => () => ({ data: ref({ items: [{ id: 'modelo_1', name: 'modelo_1' }] }) }))
mockNuxtImport('useDailyBets', () => () => ({
  data: ref(BETS),
  pending: ref(false),
  error: ref(null),
}))

describe('daily-bets: odds ausentes', () => {
  it('renderiza "—" na aposta sem odds, sem fabricar 0.00', async () => {
    const wrapper = await mountSuspended(DailyBetsPage, {
      global: { stubs: { BackToTop: true, DatePicker: true, USelectMenu: true } },
    })
    const text = wrapper.text()
    // A primeira aposta tem odds reais (1.85) e não pode ser afetada.
    expect(text).toContain('1.85')
    // A segunda não tem FT_Odds_*: precisa de "—" em vez de 0.00.
    expect(text).toContain('—')
    expect(text).not.toContain('0.00')
  })
})
