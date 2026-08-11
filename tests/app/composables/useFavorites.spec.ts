// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DateTime } from 'luxon'
import { SP_TZ } from '~/utils/timezone'

const KEY = 'dataPlay.favorites'
const hoje = DateTime.now().setZone(SP_TZ).toFormat('yyyy-MM-dd')

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
})
