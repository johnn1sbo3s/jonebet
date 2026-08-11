// tests/app/utils/filterScannerGames.spec.ts
import { describe, it, expect } from 'vitest'
import { filterScannerGames } from '~/utils/filterScannerGames.js'

const NOW = Date.parse('2026-08-11T20:00:00-03:00')

const notif = (at) => [{ rule: 'regra_jogo_quente', label: 'Jogo quente', minute: 62, at }]

const games = [
  {
    id: 'g1',
    home: 'São Paulo',
    away: 'Corinthians',
    league: 'Brasileirão Série A',
    notifications: notif('2026-08-11T19:59:00-03:00'), // 1 min atrás — recente
  },
  {
    id: 'g2',
    home: 'Talleres Córdoba',
    away: 'Lanús',
    league: 'Argentina Liga Profesional',
    notifications: notif('2026-08-11T19:49:00-03:00'), // 11 min atrás — antiga
  },
  { id: 'g3', home: 'Avaí', away: 'CRB', league: 'Brasil Brasileirão Série B', notifications: [] },
  {
    id: 'g4',
    home: 'Real Madrid',
    away: 'Betis',
    league: 'Espanha La Liga',
    notifications: notif('2026-08-11T19:55:00-03:00'), // exatamente 5 min — na janela (<=)
  },
]

describe('filterScannerGames', () => {
  it('sem filtro devolve todos os jogos', () => {
    expect(filterScannerGames(games, {})).toHaveLength(4)
  })

  it('busca casa por nome com acento', () => {
    expect(filterScannerGames(games, { query: 'sao' }).map((g) => g.id)).toEqual(['g1'])
  })

  it('busca ignora maiúsculas', () => {
    expect(filterScannerGames(games, { query: 'SAO PAULO' }).map((g) => g.id)).toEqual(['g1'])
  })

  it('busca pela liga', () => {
    expect(filterScannerGames(games, { query: 'série' }).map((g) => g.id)).toEqual(['g1', 'g3'])
  })

  it('busca casa com o time visitante', () => {
    expect(filterScannerGames(games, { query: 'lanus' }).map((g) => g.id)).toEqual(['g2'])
  })

  it('busca sem correspondência devolve vazio', () => {
    expect(filterScannerGames(games, { query: 'flamengo' })).toHaveLength(0)
  })

  it('busca só com espaços não filtra', () => {
    expect(filterScannerGames(games, { query: '   ' })).toHaveLength(4)
  })

  it('só notificados mantém notificação recente (≤5 min) e exclui antiga/sem notificação', () => {
    const ids = filterScannerGames(games, { onlyNotified: true, now: NOW }).map((g) => g.id)
    expect(ids).toEqual(['g1', 'g4'])
  })

  it('fronteira de 5 min: exatamente 5 min entra, 5 min + 1s sai', () => {
    const only = (at) => [{ rule: 'r', label: 'l', minute: 1, at }]
    const onWindow = filterScannerGames(
      [{ id: 'a', home: 'A', away: 'B', league: 'L', notifications: only(new Date(NOW - 5 * 60_000).toISOString()) }],
      { onlyNotified: true, now: NOW },
    )
    const offWindow = filterScannerGames(
      [
        {
          id: 'b',
          home: 'A',
          away: 'B',
          league: 'L',
          notifications: only(new Date(NOW - 5 * 60_000 - 1000).toISOString()),
        },
      ],
      { onlyNotified: true, now: NOW },
    )
    expect(onWindow).toHaveLength(1)
    expect(offWindow).toHaveLength(0)
  })

  it('busca e só notificados combinam (interseção)', () => {
    expect(filterScannerGames(games, { query: 'avai', onlyNotified: true, now: NOW })).toHaveLength(0)
  })
})
