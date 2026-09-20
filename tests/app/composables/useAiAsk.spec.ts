// @vitest-environment nuxt
import { describe, expect, it, vi, beforeEach } from 'vitest'

const ANSWER = { noul: 0.8, similares_N: 10, question_id: 'gol_1t' }

// O setup global mocka ~/composables/useAiAsk (cenário p/ cards) — aqui
// testamos o módulo REAL via importOriginal do mock registrado.
async function realUseAiAsk() {
  const mod = await vi.importActual('~/composables/useAiAsk')
  return mod.useAiAsk
}

describe('useAiAsk', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('faz POST game_id+question_id no /ask-ai e guarda por pergunta', async () => {
    const useAiAsk = await realUseAiAsk()
    const fetchFn = vi.fn().mockResolvedValue(ANSWER)
    const { get, load } = useAiAsk(fetchFn)
    const out = await load('t1-m1', 'gol_1t')
    expect(out).toEqual(ANSWER)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchFn.mock.calls[0]
    expect(url).toContain('/ask-ai')
    expect(opts.method).toBe('POST')
    expect(opts.body).toMatchObject({ game_id: 't1-m1', question_id: 'gol_1t' })
    expect(get('t1-m1', 'gol_1t').status).toBe('done')
  })

  it('perguntas diferentes têm estado separado', async () => {
    const useAiAsk = await realUseAiAsk()
    const fetchFn = vi.fn().mockResolvedValue(ANSWER)
    const { get, load } = useAiAsk(fetchFn)
    await load('t2-m1', 'gol_1t')
    expect(get('t2-m1', 'gol_20min').status).toBe('idle')
  })

  it('marca erro quando a requisição falha', async () => {
    const useAiAsk = await realUseAiAsk()
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const { get, load } = useAiAsk(fetchFn)
    await expect(load('t3-m1', 'gol_1t')).rejects.toThrow('boom')
    expect(get('t3-m1', 'gol_1t').status).toBe('error')
  })
})
