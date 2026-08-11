// tests/app/utils/filterReportGames.spec.ts
import { describe, it, expect } from 'vitest'
import { ANY_STRATEGY, filterReportGames, normalizeSearchText } from '~/utils/filterReportGames.js'

const games = [
  {
    jogo_id: '1',
    home: 'São Paulo',
    away: 'Corinthians',
    league: 'Brasileirão Série A',
    estrategias: [{ estrategia: 'gol_1t' }],
  },
  {
    jogo_id: '2',
    home: 'Talleres Córdoba',
    away: 'Lanús',
    league: 'Argentina Liga Profesional',
    estrategias: [{ estrategia: 'lay_0x1' }, { estrategia: 'lay_1x0' }],
  },
  { jogo_id: '3', home: 'Avaí', away: 'CRB', league: 'Brasil Brasileirão Série B', estrategias: [] },
  {
    jogo_id: '4',
    home: 'Real Madrid',
    away: 'Betis',
    league: 'Espanha La Liga',
    estrategias: [{ estrategia: 'lay_zebra' }],
  },
]

describe('normalizeSearchText', () => {
  it('remove acentos e minúsculas', () => {
    expect(normalizeSearchText('São Paulo')).toBe('sao paulo')
  })
})

describe('filterReportGames', () => {
  it('sem filtro devolve todos os jogos', () => {
    expect(filterReportGames(games, {})).toHaveLength(4)
  })

  it('busca casa por nome com acento', () => {
    expect(filterReportGames(games, { query: 'sao' }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('busca ignora maiúsculas', () => {
    expect(filterReportGames(games, { query: 'SAO PAULO' }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('busca casa com a liga', () => {
    expect(filterReportGames(games, { query: 'série' }).map((g) => g.jogo_id)).toEqual(['1', '3'])
  })

  it('busca casa com o time visitante', () => {
    expect(filterReportGames(games, { query: 'lanus' }).map((g) => g.jogo_id)).toEqual(['2'])
  })

  it('busca sem correspondência devolve vazio', () => {
    expect(filterReportGames(games, { query: 'flamengo' })).toHaveLength(0)
  })

  it('busca só com espaços não filtra', () => {
    expect(filterReportGames(games, { query: '   ' })).toHaveLength(4)
  })

  it('busca com espaço à esquerda casa normalmente', () => {
    expect(filterReportGames(games, { query: ' sao' }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('estratégia única filtra pelos jogos daquela estratégia', () => {
    expect(filterReportGames(games, { selected: ['gol_1t'] }).map((g) => g.jogo_id)).toEqual(['1'])
  })

  it('múltiplas estratégias usam união (OR)', () => {
    expect(filterReportGames(games, { selected: ['lay_0x1', 'lay_zebra'] }).map((g) => g.jogo_id)).toEqual(['2', '4'])
  })

  it('Com recomendação mostra jogos com pelo menos 1 estratégia', () => {
    expect(filterReportGames(games, { selected: [ANY_STRATEGY] }).map((g) => g.jogo_id)).toEqual(['1', '2', '4'])
  })

  it('busca e estratégias combinam (interseção)', () => {
    expect(filterReportGames(games, { query: 'avai', selected: ['gol_1t'] })).toHaveLength(0)
  })

  it('seleção vazia não filtra', () => {
    expect(filterReportGames(games, { selected: [] })).toHaveLength(4)
  })
})
