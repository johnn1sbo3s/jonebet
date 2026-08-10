// tests/app/composables/usePreGameAnalysis.spec.ts
// @vitest-environment nuxt
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { usePreGameAnalysis } from '~/composables/usePreGameAnalysis'

// Estado do composable é de MÓDULO (mapa por jogo + promises em andamento):
// cada teste usa ids de jogo únicos para não vazar estado entre testes.
// O composable resolve as datas (hoje/ontem em America/Sao_Paulo) internamente
// com luxon — vi.useFakeTimers congela o relógio para as asserts ficarem exatas.
function jogo(leitura) {
  return {
    jogo_id: 'g',
    time: '16:30',
    league: 'L',
    home: 'A',
    away: 'B',
    leitura_geral: leitura,
    estrategias: [],
  }
}

describe('usePreGameAnalysis', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-08-10T15:00:00-03:00') })
  })

  it('busca só o jogo pedido com date=hoje e casa pelo id', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ date: '2026-08-10', jogos: [jogo('ok')] })
    const { get, load } = usePreGameAnalysis(fetchFn)
    await load('g-today')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('date=2026-08-10'))
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('game=g-today'))
    expect(get('g-today').status).toBe('done')
    expect(get('g-today').response.leitura_geral).toBe('ok')
  })

  it('jogo sem análise hoje cai no relatório de ontem (meia-noite)', async () => {
    vi.setSystemTime(new Date('2026-08-20T00:30:00-03:00'))
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ date: '2026-08-20', jogos: [] })
      .mockResolvedValueOnce({ date: '2026-08-19', jogos: [jogo('ok ontem')] })
    const { get, load } = usePreGameAnalysis(fetchFn)
    await load('g-midnight')
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(fetchFn.mock.calls[1][0]).toContain('date=2026-08-19')
    expect(get('g-midnight').status).toBe('done')
    expect(get('g-midnight').response.leitura_geral).toBe('ok ontem')
  })

  it('sem análise nos dois dias → response null e sem refetch depois', async () => {
    vi.setSystemTime(new Date('2026-08-30T15:00:00-03:00'))
    const fetchFn = vi.fn().mockResolvedValue({ date: '2026-08-30', jogos: [] })
    const { get, load } = usePreGameAnalysis(fetchFn)
    await load('g-absent')
    expect(fetchFn).toHaveBeenCalledTimes(2) // hoje + ontem
    expect(get('g-absent').status).toBe('done')
    expect(get('g-absent').response).toBeNull()
    await load('g-absent')
    expect(fetchFn).toHaveBeenCalledTimes(2) // cache: não refaz
  })

  it('erro no fetch → status error; nova chamada refaz a requisição', async () => {
    vi.setSystemTime(new Date('2026-09-10T15:00:00-03:00'))
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ date: '2026-09-10', jogos: [jogo('ok retry')] })
    const { get, load } = usePreGameAnalysis(fetchFn)
    await expect(load('g-retry')).rejects.toThrow('offline')
    expect(get('g-retry').status).toBe('error')
    await load('g-retry')
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(get('g-retry').status).toBe('done')
    expect(get('g-retry').response.leitura_geral).toBe('ok retry')
  })

  it('junta requisições em andamento para o mesmo jogo', async () => {
    vi.setSystemTime(new Date('2026-09-20T15:00:00-03:00'))
    let resolve
    const fetchFn = vi.fn(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    const { get, load } = usePreGameAnalysis(fetchFn)
    const p1 = load('g-race')
    const p2 = load('g-race') // em andamento → junta na mesma promise
    resolve({ date: '2026-09-20', jogos: [jogo('ok race')] })
    await Promise.all([p1, p2])
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(get('g-race').status).toBe('done')
  })
})
