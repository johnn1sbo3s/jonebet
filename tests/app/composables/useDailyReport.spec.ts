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

  it('marca erro quando a requisição falha', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'))
    const { state, load } = useDailyReport(fetchFn)
    await expect(load('2026-08-09')).rejects.toThrow('boom')
    expect(state.status).toBe('error')
    expect(state.error).toBeInstanceOf(Error)
  })
})
