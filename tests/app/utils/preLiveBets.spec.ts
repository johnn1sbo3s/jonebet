// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { filterBetsForGame } from '~/utils/preLiveBets'

describe('filterBetsForGame', () => {
  const bets = [
    { Home: 'Flamengo', Away: 'Palmeiras', Modelo: 'lay_away_v1', Odd: 3.5 },
    { Home: 'Flamengo', Away: 'Palmeiras', Modelo: 'back_home_v2', Odd: 1.8 },
    { Home: 'Santos', Away: 'Corinthians', Modelo: 'ltd_v1', Odd: 4.2 },
  ]

  it('returns bets matching Home and Away', () => {
    const game = { Home: 'Flamengo', Away: 'Palmeiras' }
    const result = filterBetsForGame(bets, game)
    expect(result).toHaveLength(2)
    expect(result[0].Modelo).toBe('lay_away_v1')
    expect(result[1].Modelo).toBe('back_home_v2')
  })

  it('returns empty array when no match', () => {
    const game = { Home: 'Botafogo', Away: 'Vasco' }
    const result = filterBetsForGame(bets, game)
    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty bets', () => {
    const game = { Home: 'Flamengo', Away: 'Palmeiras' }
    expect(filterBetsForGame([], game)).toHaveLength(0)
  })

  it('returns empty array when bets is null/undefined', () => {
    const game = { Home: 'Flamengo', Away: 'Palmeiras' }
    expect(filterBetsForGame(null, game)).toHaveLength(0)
    expect(filterBetsForGame(undefined, game)).toHaveLength(0)
  })
})
