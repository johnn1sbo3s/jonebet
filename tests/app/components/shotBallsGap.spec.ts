// @vitest-environment nuxt
// Bolinhas de chute do gráfico de momentum: elas montam como
// (histórico /xg-history) ∪ (deltas ao vivo acumulados no card). Os testes
// guardam os buracos que só o reload da página consertava: histórico servido
// de um cache velho quando o card remonta, fetch do histórico que falha e
// nunca mais é tentado, e snapshot perdido (o shot_events daquele ciclo nunca
// é reenviado). O contrato do composable fica em
// tests/app/composables/useXgHistory.spec.ts (aqui ele é mockado).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { reactive, ref } from 'vue'
import ScannerCard from '~/components/scannerCard.vue'

const ev = (minute, xg_delta) => ({
  minute,
  half: 1,
  team: 'home',
  xg_delta,
  tier: 'C3',
  label: 'Chance média',
})

const point = (minute, events) => ({ minute, xg_home: 0.1 * minute, xg_away: 0, shot_events: events })

const server = { series: [] }
const state = reactive({ status: 'done', response: { series: [] }, fetchedAt: 0, error: null })
const loadMock = vi.fn()
const refreshTick = ref(0)

vi.mock('~/composables/useXgHistory', () => ({
  useXgHistory: () => ({
    get: () => state,
    load: async (...args) => {
      state.status = 'loading'
      try {
        await loadMock(...args)
        state.status = 'done'
        state.response = { series: server.series }
        state.fetchedAt = Date.now()
        return state.response
      } catch (e) {
        state.status = 'error'
        state.error = e
        throw e
      }
    },
    refreshTick,
    requestRefresh: () => {
      refreshTick.value += 1
    },
  }),
}))

const mountCard = (options) =>
  mountSuspended(ScannerCard, {
    ...options,
    global: {
      stubs: {
        UTooltip: { name: 'UTooltip', props: ['text'], template: '<span><slot /></span>' },
        UPopover: { name: 'UPopover', template: '<div><slot /><slot name="content" /></div>' },
      },
    },
  })

function game(minute, events) {
  return {
    id: 'abc123',
    flashscore_url: 'https://www.flashscore.com/match/abc123/',
    league: 'Brasileirão',
    home: 'Palmeiras',
    away: 'Flamengo',
    score: { home: 0, away: 0 },
    minute,
    status: `${minute}'`,
    momentum: [{ minute: 1, home: 0.5, away: 0 }],
    goals: [],
    notifications: [],
    shot_events: events,
    stats: {
      xg: { home: 0.1 * minute, away: 0 },
      possession: { home: 50, away: 50 },
      shots: { home: 3, away: 0 },
      big_chances: { home: 0, away: 0 },
      box_touches: { home: 0, away: 0 },
    },
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('card do scanner: bolinhas não dependem do cache nem de um único fetch', () => {
  beforeEach(async () => {
    server.series = []
    state.status = 'done'
    state.response = { series: [] }
    state.error = null
    refreshTick.value = 0
    loadMock.mockReset()
    loadMock.mockImplementation(async () => {})
    await flush()
  })

  it('mantém as bolas depois de desmontar e remontar', async () => {
    const first = await mountCard({ props: { game: game(5, [ev(5, 0.1)]) } })
    await first.setProps({ game: game(20, [ev(20, 0.1)]) })
    await first.setProps({ game: game(35, [ev(35, 0.1)]) })
    expect(first.findAll('.lane-shot')).toHaveLength(3)
    first.unmount()

    server.series = [point(5, [ev(5, 0.1)]), point(20, [ev(20, 0.1)]), point(35, [ev(35, 0.1)])]

    const second = await mountCard({ props: { game: game(36, []) } })
    await flush()
    await second.vm.$nextTick()
    expect(second.findAll('.lane-shot')).toHaveLength(3)
  })

  it('tenta de novo o histórico quando o primeiro fetch falha', async () => {
    server.series = [point(5, [ev(5, 0.1)]), point(20, [ev(20, 0.1)]), point(35, [ev(35, 0.1)])]
    loadMock.mockImplementationOnce(async () => {
      throw new Error('rede')
    })

    const wrapper = await mountCard({ props: { game: game(5, [ev(5, 0.1)]) } })
    await flush()
    await wrapper.setProps({ game: game(20, [ev(20, 0.1)]) })
    await flush()
    await wrapper.setProps({ game: game(35, [ev(35, 0.1)]) })
    await flush()
    await wrapper.vm.$nextTick()

    expect(loadMock.mock.calls.length).toBeGreaterThan(1)
    expect(wrapper.findAll('.lane-shot')).toHaveLength(3)
  })

  it('rebusca o histórico quando a página avisa que perdeu um snapshot', async () => {
    const wrapper = await mountCard({ props: { game: game(5, []) } })
    await flush()
    loadMock.mockClear()

    server.series = [point(5, [ev(5, 0.1)]), point(20, [ev(20, 0.1)])]
    refreshTick.value += 1
    await flush()
    await wrapper.vm.$nextTick()

    expect(loadMock).toHaveBeenCalledWith('abc123')
    expect(wrapper.findAll('.lane-shot')).toHaveLength(2)
  })
})
