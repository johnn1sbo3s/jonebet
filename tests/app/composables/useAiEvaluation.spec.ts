// @vitest-environment nuxt
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAiEvaluation } from '~/composables/useAiEvaluation'

// O $fetch auto-importado NÃO é mockável neste stack (Nuxt 4 + vitest 4) — o
// composable recebe fetchFn injetável (default = $fetch). Estado do Map é de
// MÓDULO: cada teste usa um id único para não vazar estado entre testes.
const RESP = { jogo_id: 'abc', minuto: 63, leitura_geral: 'ok', estrategias: [] }

describe('useAiEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('busca e guarda a resposta', async () => {
    const fetchFn = vi.fn().mockResolvedValue(RESP)
    const { get, evaluate } = useAiEvaluation(fetchFn)
    await evaluate('g1')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('game=g1'))
    expect(get('g1').status).toBe('done')
    expect(get('g1').response.jogo_id).toBe('abc')
  })

  it('reusa resposta fresca sem nova requisição', async () => {
    const fetchFn = vi.fn().mockResolvedValue(RESP)
    const { get, evaluate } = useAiEvaluation(fetchFn)
    await evaluate('g2')
    await evaluate('g2')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('junta requisição em andamento (coalescing)', async () => {
    let resolve
    const fetchFn = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    const { get, evaluate } = useAiEvaluation(fetchFn)
    const p1 = evaluate('g3')
    const p2 = evaluate('g3') // em andamento → não dispara outra
    resolve(RESP)
    await Promise.all([p1, p2])
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(get('g3').status).toBe('done')
  })

  it('após 5 min faz nova requisição', async () => {
    const fetchFn = vi.fn().mockResolvedValue(RESP)
    const { evaluate } = useAiEvaluation(fetchFn)
    await evaluate('g4')
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    await evaluate('g4')
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
})
