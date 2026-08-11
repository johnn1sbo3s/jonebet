// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReportGameCard from '~/components/reportGameCard.vue'

function game(overrides = {}) {
  return {
    jogo_id: 'abc123',
    league: 'Brasileirão',
    home: 'Flamengo',
    away: 'Palmeiras',
    time: '21:30',
    odds: { h: 1.8, d: 3.6, a: 4.5 },
    leitura_geral: 'Jogo equilibrado',
    estrategias: [{ estrategia: 'lay_1x0', recomendacao: 'entrar', confianca: 78, analise: '1-0 é raro no histórico' }],
    ...overrides,
  }
}

describe('ReportGameCard', () => {
  beforeEach(() => localStorage.clear())

  it('renderiza horário, times, odds e análise', async () => {
    const w = await mountSuspended(ReportGameCard, { props: { game: game() } })
    expect(w.text()).toContain('21:30')
    expect(w.text()).toContain('Flamengo x Palmeiras')
    expect(w.text()).toContain('1.8 / 3.6 / 4.5')
    expect(w.text()).toContain('Jogo equilibrado')
    expect(w.text()).toContain('Lay 1x0')
    expect(w.text()).toContain('entrar 78%')
  })

  it('estrela favorita/desfavorita e persiste no localStorage', async () => {
    const w = await mountSuspended(ReportGameCard, { props: { game: game() } })
    expect(w.find('button[aria-label="Favoritar jogo"]').exists()).toBe(true)

    await w.find('button[aria-label="Favoritar jogo"]').trigger('click')
    expect(w.find('button[aria-label="Remover dos favoritos"]').exists()).toBe(true)
    expect(JSON.parse(localStorage.getItem('dataPlay.favorites') || '{}')).toHaveProperty('abc123')

    await w.find('button[aria-label="Remover dos favoritos"]').trigger('click')
    expect(w.find('button[aria-label="Favoritar jogo"]').exists()).toBe(true)
    expect(localStorage.getItem('dataPlay.favorites')).toBeNull()
  })
})
