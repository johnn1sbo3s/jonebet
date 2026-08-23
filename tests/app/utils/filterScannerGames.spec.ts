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

describe('filterScannerGames — preset de odds', () => {
  const oddsGames = [
    {
      id: 'o1',
      home: 'São Paulo',
      away: 'Botafogo',
      league: 'Brasileirão',
      notifications: [],
      odds: { prematch: { home: 1.3, away: 4.2 } },
    },
    {
      id: 'o2',
      home: 'Corinthians',
      away: 'Flamengo',
      league: 'Brasileirão',
      notifications: [],
      odds: { prematch: { home: 2.4, away: 1.6 } },
    },
    {
      id: 'o3',
      home: 'Avaí',
      away: 'CRB',
      league: 'Série B',
      notifications: [],
      odds: { prematch: { home: 2.2, away: 2.4 } },
    },
    { id: 'o4', home: 'Ponte Preta', away: 'Guarani', league: 'Série B', notifications: [], odds: {} },
  ]

  it('super filtra pela menor odd ≤ 1.40', () => {
    expect(filterScannerGames(oddsGames, { oddsPreset: 'super' }).map((g) => g.id)).toEqual(['o1'])
  })

  it('favoritos pega o lado fora (min 1.41–2.05)', () => {
    expect(filterScannerGames(oddsGames, { oddsPreset: 'favoritos' }).map((g) => g.id)).toEqual(['o2'])
  })

  it('fav_por_odd pega jogos com os dois lados acima de 2.05', () => {
    expect(filterScannerGames(oddsGames, { oddsPreset: 'fav_por_odd' }).map((g) => g.id)).toEqual(['o3'])
  })

  it('jogo sem prematch sai com preset ativo', () => {
    expect(filterScannerGames(oddsGames, { oddsPreset: 'super' }).some((g) => g.id === 'o4')).toBe(false)
  })

  it('todos (default) mantém jogos sem odds', () => {
    expect(filterScannerGames(oddsGames, {})).toHaveLength(4)
  })

  it('combina com busca (interseção)', () => {
    expect(filterScannerGames(oddsGames, { query: 'avai', oddsPreset: 'fav_por_odd' }).map((g) => g.id)).toEqual(['o3'])
    expect(filterScannerGames(oddsGames, { query: 'flamengo', oddsPreset: 'fav_por_odd' })).toHaveLength(0)
  })

  it('combina com só notificados (interseção)', () => {
    const recent = [{ rule: 'r', label: 'l', minute: 1, at: '2026-08-11T19:59:00-03:00' }]
    const g = [
      {
        id: 'o5',
        home: 'A',
        away: 'B',
        league: 'L',
        notifications: recent,
        odds: { prematch: { home: 1.3, away: 4 } },
      },
    ]
    expect(filterScannerGames(g, { onlyNotified: true, oddsPreset: 'super', now: NOW })).toHaveLength(1)
    expect(filterScannerGames(g, { onlyNotified: true, oddsPreset: 'favoritos', now: NOW })).toHaveLength(0)
  })
})

describe('filterScannerGames — só com pré-live', () => {
  const baseGames = [
    { id: 'g1', home: 'São Paulo', away: 'Corinthians', league: 'Brasileirão', notifications: [] },
    { id: 'g2', home: 'Avaí', away: 'CRB', league: 'Série B', notifications: [] },
    { id: 'g3', home: 'Real Madrid', away: 'Betis', league: 'La Liga', notifications: [] },
  ]
  const setOf = (...ids) => new Set(ids)

  it('default (false) mantém todos os jogos', () => {
    expect(filterScannerGames(baseGames, { preLiveGameIds: setOf('g1') })).toHaveLength(3)
  })

  it('onlyPreLive mantém só os ids do Set', () => {
    const ids = filterScannerGames(baseGames, { onlyPreLive: true, preLiveGameIds: setOf('g1', 'g3') }).map((g) => g.id)
    expect(ids).toEqual(['g1', 'g3'])
  })

  it('onlyPreLive sem Set (ou vazio) esconde tudo', () => {
    expect(filterScannerGames(baseGames, { onlyPreLive: true })).toHaveLength(0)
    expect(filterScannerGames(baseGames, { onlyPreLive: true, preLiveGameIds: new Set() })).toHaveLength(0)
  })

  it('combina com busca (interseção)', () => {
    expect(
      filterScannerGames(baseGames, { query: 'avai', onlyPreLive: true, preLiveGameIds: setOf('g1', 'g2') }).map(
        (g) => g.id,
      ),
    ).toEqual(['g2'])
  })
})
