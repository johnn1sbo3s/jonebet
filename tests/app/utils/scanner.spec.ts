// tests/app/utils/scanner.spec.ts
import { describe, it, expect } from 'vitest'
import {
  isRecentNotification,
  formatUpdatedAgo,
  mergeHistories,
  loadLocalHistory,
  saveLocalHistory,
  pruneLocalHistory,
} from '~/utils/scanner.js'

const AT = '2026-08-07T23:55:03-03:00'
const NOW = Date.parse('2026-08-07T23:59:03-03:00')

describe('isRecentNotification', () => {
  it('true quando a notificação mais recente está dentro de 5 min', () => {
    expect(isRecentNotification([{ at: AT }], NOW)).toBe(true)
  })

  it('false quando está fora da janela', () => {
    expect(isRecentNotification([{ at: '2026-08-07T23:45:03-03:00' }], NOW)).toBe(false)
  })

  it('false sem notificações ou com horário inválido', () => {
    expect(isRecentNotification([], NOW)).toBe(false)
    expect(isRecentNotification([{ at: 'nao-e-data' }], NOW)).toBe(false)
    expect(isRecentNotification(null, NOW)).toBe(false)
  })

  it('usa a primeira notificação (mais recente) do histórico', () => {
    // contrato do backend: histórico vem mais recente primeiro (índice 0)
    const list = [{ at: AT }, { at: '2026-08-07T23:50:03-03:00' }]
    expect(isRecentNotification(list, NOW)).toBe(true)
  })
})

describe('formatUpdatedAgo', () => {
  it('formata segundos e minutos', () => {
    expect(formatUpdatedAgo(AT, NOW)).toBe('há 4m 0s')
    expect(formatUpdatedAgo(AT, NOW - 12_000)).toBe('há 3m 48s')
  })

  it('retorna vazio sem horário válido', () => {
    expect(formatUpdatedAgo(null, NOW)).toBe('')
    expect(formatUpdatedAgo('x', NOW)).toBe('')
  })
})

describe('mergeHistories', () => {
  it('deduplica por regra+horário e ordena do mais recente', () => {
    const backend = [
      { rule: 'a', at: AT },
      { rule: 'b', at: '2026-08-07T23:50:03-03:00' },
    ]
    const local = [
      { rule: 'a', at: AT },
      { rule: 'c', at: '2026-08-07T23:40:03-03:00' },
    ]
    expect(mergeHistories(backend, local).map((n) => n.rule)).toEqual(['a', 'b', 'c'])
  })

  it('backend vazio usa o cache local', () => {
    const local = [{ rule: 'x', at: AT }]
    expect(mergeHistories([], local)).toHaveLength(1)
  })

  it('limita a 10 eventos', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      rule: `r${i}`,
      at: new Date(Date.now() - i * 60_000).toISOString(),
    }))
    expect(mergeHistories([], many)).toHaveLength(10)
  })
})

describe('pruneLocalHistory', () => {
  it('mantém só os jogos visíveis no snapshot atual', () => {
    const games = [
      { id: 'm1', notifications: [{ rule: 'a', at: AT }] },
      { id: 'm2', notifications: [] },
    ]
    expect(pruneLocalHistory(games)).toEqual({
      m1: [{ rule: 'a', at: AT }],
      m2: [],
    })
  })

  it('sem jogos zera o cache', () => {
    expect(pruneLocalHistory([])).toEqual({})
  })
})

describe('histórico local', () => {
  it('salva e carrega por jogo no localStorage', () => {
    const byGame = { m1: [{ rule: 'a', at: AT }] }
    saveLocalHistory(byGame)
    expect(loadLocalHistory()).toEqual(byGame)
  })
})
