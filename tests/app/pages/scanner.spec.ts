// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
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

// A página só precisa montar: o long polling fica pendente (nada de rede no teste).
vi.stubGlobal(
  '$fetch',
  vi.fn(() => new Promise(() => {})),
)

const GESTURES = ['pointerdown', 'keydown']

// Espiona o par add/remove de window para saber quais handlers de gesto estão
// vivos: Espia.add conta, Espia.remove desconta por referência.
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

beforeEach(() => {
  unlockSound.mockClear()
  localStorage.clear()
})

describe('scanner: listeners de window', () => {
  it('remove pointerdown/keydown no unmount, com a mesma referência', async () => {
    const spy = spyGestureListeners()
    const w = await mountSuspended(ScannerPage)

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
    const w = await mountSuspended(ScannerPage)

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
      const w = await mountSuspended(ScannerPage)
      w.unmount()
    }
    expect(spy.live).toHaveLength(0)
    expect(spy.added).toHaveLength(6)
    spy.restore()
  })
})
