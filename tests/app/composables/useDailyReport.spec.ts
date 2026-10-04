// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { useDailyReport } from '~/composables/useDailyReport'

const REPORT = {
  date: '2026-08-09',
  jogos: [
    {
      jogo_id: 'abc',
      league: 'Brasileirão',
      time: '21:30',
      home: 'Flamengo',
      away: 'Palmeiras',
      leitura_geral: 'jogo equilibrado',
      estrategias: [{ estrategia: 'lay_0x1', recomendacao: 'entrar', confianca: 72, analise: 'ok' }],
    },
  ],
}

describe('useDailyReport', () => {
  it('busca o relatório do dia com a data na URL', async () => {
    const fetchFn = vi.fn().mockResolvedValue(REPORT)
    const { state, load } = useDailyReport(fetchFn)
    await load('2026-08-09')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('date=2026-08-09'))
    expect(state.status).toBe('done')
    expect(state.response.jogos.length).toBe(1)
  })

  it('descarta resposta fora de ordem: a da data antiga chega por último e não sobrescreve', async () => {
    const pending = {}
    const fetchFn = vi.fn((url) => {
      const { promise, resolve } = Promise.withResolvers()
      pending[url.includes('2026-08-09') ? 'a' : 'b'] = resolve
      return promise
    })
    const { state, load } = useDailyReport(fetchFn)

    const a = load('2026-08-09')
    const b = load('2026-08-10')

    pending.b({ date: '2026-08-10', jogos: [{ jogo_id: 'de-b' }] })
    await b
    expect(state.status).toBe('done')
    expect(state.response.date).toBe('2026-08-10')

    // A resposta antiga chega depois: não pode virar o conteúdo da tela.
    pending.a({ date: '2026-08-09', jogos: [{ jogo_id: 'de-a' }] })
    await a
    expect(state.response.date).toBe('2026-08-10')
    expect(state.response.jogos[0].jogo_id).toBe('de-b')
  })

  it('loading só encerra quando a busca vigente termina', async () => {
    const pending = {}
    const fetchFn = vi.fn((url) => {
      const { promise, resolve } = Promise.withResolvers()
      pending[url.includes('2026-08-09') ? 'a' : 'b'] = resolve
      return promise
    })
    const { state, load } = useDailyReport(fetchFn)

    const a = load('2026-08-09')
    const b = load('2026-08-10')

    // Resposta obsoleta chegando enquanto a vigente ainda está em voo:
    // a tela precisa continuar em loading (não virar 'done' com dado velho).
    pending.a({ date: '2026-08-09', jogos: [] })
    await a
    expect(state.status).toBe('loading')
    expect(state.response).toBeNull()

    pending.b({ date: '2026-08-10', jogos: [] })
    await b
    expect(state.status).toBe('done')
  })

  it('resposta obsoleta com erro não troca o estado da busca vigente', async () => {
    const pending = {}
    const fetchFn = vi.fn((url) => {
      const { promise, resolve, reject } = Promise.withResolvers()
      pending[url.includes('2026-08-09') ? 'a' : 'b'] = { resolve, reject }
      return promise
    })
    const { state, load } = useDailyReport(fetchFn)

    const a = load('2026-08-09')
    const b = load('2026-08-10')

    pending.b.resolve({ date: '2026-08-10', jogos: [] })
    await b
    pending.a.reject(new Error('boom na data antiga'))
    await expect(a).resolves.toBeNull()
    expect(state.status).toBe('done')
    expect(state.response.date).toBe('2026-08-10')
  })

  it('marca erro quando a requisição falha', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const { state, load } = useDailyReport(fetchFn)
    await expect(load('2026-08-09')).rejects.toThrow('boom')
    expect(state.status).toBe('error')
    expect(state.error).toBeInstanceOf(Error)
  })
})
