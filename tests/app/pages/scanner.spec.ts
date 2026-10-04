// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ScannerPage from '~/pages/scanner.vue'

const unlockSound = vi.fn(async () => true)
vi.mock('~/utils/alertSound.js', () => ({
  unlockSound: (...args) => unlockSound(...args),
  playPreset: vi.fn(),
  previewPreset: vi.fn(),
  isSoundReady: () => false,
}))

vi.mock('~/composables/useModelApi.js', async () => ({
  useDailyBets: () => ({ data: ref({ bets: [] }) }),
}))

vi.mock('~/composables/useXgHistory.js', () => ({
  useXgHistory: () => ({ requestRefresh: vi.fn() }),
}))

// Long polling: a 1ª requisição entrega um snapshot (a página precisa de jogos);
// as seguintes ficam pendentes — nada de rede no teste.
const GAME = {
  id: 'g1',
  finished: false,
  league: 'Série A',
  home: 'Casa',
  away: 'Fora',
  score: { home: 0, away: 0 },
  minute: 10,
  status: "10'",
  stats: {},
  momentum: [],
}
const h = vi.hoisted(() => ({ fetchMock: vi.fn(), polls: 0 }))
h.fetchMock.mockImplementation(() =>
  h.polls++ === 0
    ? Promise.resolve({ version: 1, generated_at: '2026-10-03T20:00:00-03:00', games: [GAME] })
    : new Promise(() => {}),
)
mockNuxtImport('$fetch', () => h.fetchMock)

// O poll é assíncrono: dá um macroturno para o snapshot ser aplicado.
async function flushSnapshot() {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

// O card não é o alvo: só a seção de favoritos da página interessa.
const STUBS = { ScannerCard: { template: '<div />' } }

const GESTURES = ['pointerdown', 'keydown']

// Espiona o par add/remove de window para saber quais handlers de gesto estão
// vivos: add conta, remove desconta por referência.
function spyGestureListeners() {
  const live = []
  const origAdd = window.addEventListener.bind(window)
  const origRemove = window.removeEventListener.bind(window)
  const added = []

  window.addEventListener = (type, handler, opts) => {
    if (GESTURES.includes(type)) {
      added.push({ type, handler })
      live.push({ type, handler })
    }
    return origAdd(type, handler, opts)
  }
  window.removeEventListener = (type, handler, opts) => {
    if (GESTURES.includes(type)) {
      const i = live.findIndex((l) => l.type === type && l.handler === handler)
      if (i >= 0) live.splice(i, 1)
    }
    return origRemove(type, handler, opts)
  }

  return {
    added,
    live,
    restore: () => {
      window.addEventListener = origAdd
      window.removeEventListener = origRemove
    },
  }
}

// localStorage "bloqueado" (política de privacidade / Safari restrito): todo
// acesso lança, como no navegador real nesse cenário.
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

beforeEach(() => {
  unlockSound.mockClear()
  h.polls = 0
  localStorage.clear()
})

describe('scanner: listeners de window', () => {
  it('remove pointerdown/keydown no unmount, com a mesma referência', async () => {
    const spy = spyGestureListeners()
    const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })

    // Registrados na montagem (comportamento atual, inalterado).
    expect(spy.added.map((l) => l.type)).toEqual(['pointerdown', 'keydown'])
    expect(spy.live).toHaveLength(2)

    w.unmount()

    expect(spy.live).toHaveLength(0)
    expect(spy.added.map((l) => l.type)).toEqual(['pointerdown', 'keydown'])
    spy.restore()
  })

  it('gesto na página continua destravando o áudio', async () => {
    localStorage.setItem('dataPlay.scanner.alertsSound', '1') // som ligado: o handler age
    const spy = spyGestureListeners()
    const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })

    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(unlockSound).toHaveBeenCalledTimes(2)

    unlockSound.mockClear()
    w.unmount()
    spy.restore()

    // Handler órfão não pode responder mais a gesto em outra página.
    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new KeyboardEvent('keydown'))
    expect(unlockSound).not.toHaveBeenCalled()
  })

  it('N idas/voltas não acumulam listeners', async () => {
    const spy = spyGestureListeners()
    for (let i = 0; i < 3; i++) {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      w.unmount()
    }
    expect(spy.live).toHaveLength(0)
    expect(spy.added).toHaveLength(6)
    spy.restore()
  })
})

describe('scanner: storage indisponível', () => {
  it('monta sem erro com storage bloqueado', async () => {
    const restore = blockStorage()
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      expect(w.exists()).toBe(true)
      w.unmount()
    } finally {
      restore()
    }
  })

  it('favoritar e colapsar favoritos funcionam na sessão com storage bloqueado', async () => {
    const restore = blockStorage()
    try {
      const { useFavorites } = await import('~/composables/useFavorites')
      const f = useFavorites()
      f.toggleFavorite(GAME.id) // escrita bloqueada: erro não pode escapar
      expect(f.isFavorite(GAME.id)).toBe(true)

      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await flushSnapshot()
      const header = w.find('header[aria-controls="favorites-collapse"]')
      expect(header.exists()).toBe(true)
      expect(header.attributes('aria-expanded')).toBe('true')

      await header.trigger('click') // persiste o colapso: idem, sem lançar
      expect(header.attributes('aria-expanded')).toBe('false')
      w.unmount()
    } finally {
      restore()
    }
  })
})
describe('scanner: relatório de amanhã reage ao relógio', () => {
  it('aba aberta às 22:59 ganha o link ao cruzar 23h, sem reload', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-03T22:59:00-03:00'))
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      expect(w.find('a[href*="date=2026-10-04"]').exists()).toBe(false)

      await vi.advanceTimersByTimeAsync(90_000) // 23:00:30
      const link = w.find('a[href*="date=2026-10-04"]')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Relatório de amanhã')
      w.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('aba montada depois das 23h já mostra o link (comportamento inalterado)', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-10-03T23:30:00-03:00'))
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      const link = w.find('a[href*="date=2026-10-04"]')
      expect(link.exists()).toBe(true)
      w.unmount()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('scanner: encoding do parâmetro v do long-polling', () => {
  it('codifica a version do snapshot sem injetar parâmetro na query', async () => {
    const original = h.fetchMock.getMockImplementation()
    h.fetchMock.mockClear()
    h.polls = 0
    // 1ª requisição entrega uma version com caracteres especiais; a 2ª fica
    // pendente, então a URL do 2º poll é a última chamada registrada.
    h.fetchMock.mockImplementation(() =>
      h.polls++ === 0
        ? Promise.resolve({ version: '7&evil=1 #x', generated_at: '2026-10-03T20:00:00-03:00', games: [GAME] })
        : Promise.withResolvers().promise,
    )
    try {
      const w = await mountSuspended(ScannerPage, { global: { stubs: STUBS } })
      await flushSnapshot()

      expect(h.fetchMock.mock.calls[0][0]).toBe('https://scanner.jonebet.xyz/live.json')
      const polled = h.fetchMock.mock.calls[1][0]
      expect(polled).toContain('v=7%26evil%3D1%20%23x')
      const parsed = new URL(polled)
      expect(parsed.searchParams.get('v')).toBe('7&evil=1 #x')
      expect(parsed.searchParams.get('evil')).toBeNull()
      w.unmount()
    } finally {
      h.fetchMock.mockImplementation(original)
    }
  })
})
