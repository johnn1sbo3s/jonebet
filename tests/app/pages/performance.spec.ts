// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach, type MockInstance } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import PerformancePage from '~/pages/performance/[[model]].vue'
import { SP_TZ } from '~/utils/timezone'

// Ticket 15: "ontem" (playedOn) é calculado na timezone do app (SP_TZ), não na
// TZ da máquina — com a SO em UTC e o relógio perto da meia-noite de SP os dois
// dias divergem.
const modelsListCalls = vi.hoisted(() => ({ playedOn: [] as (string | null)[] }))

mockNuxtImport('useModelsList', () => (opts: { playedOn?: string }) => {
  modelsListCalls.playedOn.push(opts?.playedOn ?? null)
  return { data: ref({ items: [] }), status: ref('success') }
})
mockNuxtImport('useModelById', () => () => ({ data: ref(null), status: ref('success') }))
mockNuxtImport('useModelResults', () => () => ({ data: ref([]), pending: ref(false) }))
mockNuxtImport('useModelBets', () => () => ({ data: ref({ items: [], total: 0 }), status: ref('success') }))

// 2026-10-04T02:30Z = 2026-10-03 23:30 em São Paulo: "hoje" em SP é 03/10,
// mas na TZ da máquina (UTC) seria 04/10 — "ontem" diverge em exatamente 1 dia.
const INSTANT = new Date('2026-10-04T02:30:00Z')

describe('performance: playedOn usa o "ontem" de São Paulo', () => {
  let nowSpy: MockInstance<() => number> | null = null
  const originalTz = process.env.TZ

  afterEach(() => {
    nowSpy?.mockRestore()
    nowSpy = null
    if (originalTz === undefined) delete process.env.TZ
    else process.env.TZ = originalTz
    modelsListCalls.playedOn.length = 0
  })

  it('com a SO em UTC pede playedOn = ontem em SP (não ontem na TZ da máquina)', async () => {
    process.env.TZ = 'UTC'
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(INSTANT.getTime())

    await mountSuspended(PerformancePage)

    expect(modelsListCalls.playedOn).toEqual(['2026-10-02'])
    expect(SP_TZ).toBe('America/Sao_Paulo')
  })
})
