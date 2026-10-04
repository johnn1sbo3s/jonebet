// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DateTime } from 'luxon'
import { SP_TZ } from '~/utils/timezone'

const KEY = 'dataPlay.favorites'
const hoje = DateTime.now().setZone(SP_TZ).toFormat('yyyy-MM-dd')

// localStorage "bloqueado" (política de privacidade / Safari restrito):
// todo acesso lança, como acontece no navegador real nesse cenário.
function blockStorage() {
  const boom = () => {
    throw new Error('storage bloqueado')
  }
  const fake = { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, length: 0 }
  const original = globalThis.localStorage
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true, writable: true })
  return () =>
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true, writable: true })
}

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear()
    // O composable usa um singleton reativo por módulo — módulo novo por teste.
    vi.resetModules()
  })

  it('toggle adiciona e remove; persiste no localStorage', async () => {
    const { useFavorites } = await import('~/composables/useFavorites')
    const f = useFavorites()
    expect(f.isFavorite('abc123')).toBe(false)

    f.toggleFavorite('abc123')
    expect(f.isFavorite('abc123')).toBe(true)
    expect(JSON.parse(localStorage.getItem(KEY) || '{}')).toEqual({ abc123: hoje })

    f.toggleFavorite('abc123')
    expect(f.isFavorite('abc123')).toBe(false)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('favoritesOf separa por match id (jogo_id ou id) preservando a ordem', async () => {
    const { useFavorites } = await import('~/composables/useFavorites')
    const f = useFavorites()
    f.toggleFavorite('abc')
    const games = [
      { jogo_id: 'abc', time: '13:30' },
      { id: 'xyz', time: '16:00' },
      { jogo_id: 'outro', time: '21:30' },
    ]
    expect(f.favoritesOf(games).map((g) => g.jogo_id ?? g.id)).toEqual(['abc'])
  })

  it('hidrata do localStorage na criação', async () => {
    localStorage.setItem(KEY, JSON.stringify({ abc: hoje }))
    const { useFavorites } = await import('~/composables/useFavorites')
    expect(useFavorites().isFavorite('abc')).toBe(true)
  })

  it('purga favoritos de dias anteriores (jogos já acabaram) — do estado e do storage', async () => {
    localStorage.setItem(KEY, JSON.stringify({ velho: '2020-01-01', novo: hoje }))
    const { useFavorites } = await import('~/composables/useFavorites')
    const f = useFavorites()
    expect(f.isFavorite('velho')).toBe(false)
    expect(f.isFavorite('novo')).toBe(true)
    expect(JSON.parse(localStorage.getItem(KEY) || '{}')).toEqual({ novo: hoje })
  })

  it('storage corrompido não quebra — começa vazio', async () => {
    localStorage.setItem(KEY, 'não é json')
    const { useFavorites } = await import('~/composables/useFavorites')
    expect(useFavorites().isFavorite('abc')).toBe(false)
  })

  it('storage bloqueado: toggle não lança e reflete o estado na sessão', async () => {
    const restore = blockStorage()
    try {
      const { useFavorites } = await import('~/composables/useFavorites')
      const f = useFavorites()
      expect(f.isFavorite('abc')).toBe(false) // leitura bloqueada → default, sem lançar

      f.toggleFavorite('abc')
      expect(f.isFavorite('abc')).toBe(true)
      expect(f.favoritesOf([{ id: 'abc' }])).toHaveLength(1)

      f.toggleFavorite('abc')
      expect(f.isFavorite('abc')).toBe(false)
    } finally {
      restore()
    }
  })

  it('storage bloqueado: evento de storage de outra aba não derruba nada', async () => {
    const restore = blockStorage()
    try {
      const { useFavorites } = await import('~/composables/useFavorites')
      const f = useFavorites()
      expect(() => window.dispatchEvent(new StorageEvent('storage', { key: KEY }))).not.toThrow()
      expect(f.isFavorite('abc')).toBe(false)
    } finally {
      restore()
    }
  })
})
