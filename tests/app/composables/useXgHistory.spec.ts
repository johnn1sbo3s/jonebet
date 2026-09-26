// @vitest-environment nuxt
// Contrato do composable de histórico de xG: sem cache entre chamadas (o card
// refaz o fetch a cada montagem — série velha era o que deixava bolinhas
// faltando no gráfico até o reload) e timeout no fetch (request pendurado vira
// erro e entra na fila de retry do card).
import { describe, it, expect, vi } from 'vitest'
import { useXgHistory } from '~/composables/useXgHistory'

const point = (minute) => ({
  minute,
  xg_home: 0.1 * minute,
  xg_away: 0,
  shot_events: [{ minute, half: 1, team: 'home', xg_delta: 0.1, tier: 'C3', label: 'Chance média' }],
})

describe('useXgHistory', () => {
  it('cada chamada rebusca o histórico', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ game_id: 'g1', series: [point(5)] })

    const { load } = useXgHistory(fetchFn)
    await load('g1-semcache')
    await load('g1-semcache')

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('passa timeout no fetch e propaga a falha marcando o estado como erro', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('rede'))
    const { load, get } = useXgHistory(fetchFn)

    await expect(load('g1-erro')).rejects.toThrow('rede')
    expect(fetchFn.mock.calls[0][1]).toBeTypeOf('object')
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      expect(fetchFn.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    }
    expect(get('g1-erro').status).toBe('error')
  })

  it('depois do erro tenta de novo, mas respeita o intervalo mínimo de retry', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('rede'))
      .mockResolvedValueOnce({ game_id: 'g1-recupera', series: [point(9)] })

    const { load, get } = useXgHistory(fetchFn)
    await expect(load('g1-recupera')).rejects.toThrow('rede')

    await expect(load('g1-recupera')).rejects.toThrow('rede')
    expect(fetchFn).toHaveBeenCalledTimes(1)

    const realNow = Date.now()
    vi.spyOn(Date, 'now').mockImplementation(() => realNow + 16_000)
    try {
      const data = await load('g1-recupera')
      expect(data.series).toHaveLength(1)
    } finally {
      vi.restoreAllMocks()
    }

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(get('g1-recupera').status).toBe('done')
  })
})

describe('requestRefresh', () => {
  it('avança o tick que os cards observam pra rebuscar o histórico', () => {
    const { refreshTick, requestRefresh } = useXgHistory(vi.fn())
    const before = refreshTick.value
    requestRefresh()
    expect(refreshTick.value).toBe(before + 1)
  })
})
