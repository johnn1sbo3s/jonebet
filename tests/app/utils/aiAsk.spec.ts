// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { aiQuestionState, halfOf, minutesLeft, parseMinute } from '~/utils/aiAsk'

const game = (minute, status = '') => ({ minute, status })

describe('parseMinute', () => {
  it('aceita número', () => {
    expect(parseMinute(30)).toBe(30)
  })

  it('soma acréscimo "45+2\'" → 47', () => {
    expect(parseMinute("45+2'")).toBe(47)
  })

  it('extrai "65\'" → 65', () => {
    expect(parseMinute("65'")).toBe(65)
  })

  it('não-numérico → null', () => {
    expect(parseMinute('HT')).toBeNull()
    expect(parseMinute(null)).toBeNull()
  })
})

describe('halfOf', () => {
  it('acréscimo do 1ºT (46’) ainda é 1ºT', () => {
    expect(halfOf(game(46), 46)).toBe(1)
  })

  it('status de 2º tempo vence o minuto', () => {
    expect(halfOf(game(30, '2nd Half'), 30)).toBe(2)
  })
})

describe('minutesLeft', () => {
  it('gol_20min limita a min(20, restante): 65’ → 20, não 27', () => {
    expect(minutesLeft(game(65), 'gol_20min')).toBe(20)
  })

  it('46’ no 1ºT → 1 (47−46), não 46', () => {
    expect(minutesLeft(game(46), 'gol_20min')).toBe(1)
  })
})

describe('aiQuestionState', () => {
  it('gol_1t desabilitada após 45’ (inclusive "45+2\'")', () => {
    const qs = aiQuestionState(game("45+2'"))
    expect(qs.find((q) => q.id === 'gol_1t').disabled).toBe(true)
  })

  it('gol_1t habilitada aos 30’', () => {
    const qs = aiQuestionState(game(30))
    expect(qs.find((q) => q.id === 'gol_1t').disabled).toBe(false)
  })
})
