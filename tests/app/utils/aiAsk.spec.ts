// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { aiQuestionState, gameLeft, halfOf, parseMinute } from '~/utils/aiAsk'

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

describe('gameLeft', () => {
  it('47’ sem status (fallback 1ºT) → 0, mas gol_20min segue habilitado no intervalo', () => {
    expect(gameLeft(game(47))).toBe(0)
  })

  it('65’ 2ºT → 27 restantes', () => {
    expect(gameLeft(game(65, '2nd Half'))).toBe(27)
  })

  it('92’ → 0 (fim de jogo)', () => {
    expect(gameLeft(game(92, '2nd Half'))).toBe(0)
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

  it('gol_20min sem hint e habilitada aos 64’', () => {
    const qs = aiQuestionState(game(64, '2nd Half'))
    const q = qs.find((x) => x.id === 'gol_20min')
    expect(q.disabled).toBe(false)
    expect(q.hint).toBe('')
  })

  it('gol_20min desabilitada só no fim (92’)', () => {
    const qs = aiQuestionState(game(92, '2nd Half'))
    expect(qs.find((q) => q.id === 'gol_20min').disabled).toBe(true)
  })
})
