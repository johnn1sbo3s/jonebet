// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import DailyReportPage from '~/pages/daily-report.vue'

vi.mock('~/composables/useModelApi.js', async () => ({
  useDailyBets: () => ({ data: ref({ bets: [] }) }),
}))

const REPORT = {
  date: '2026-10-03',
  jogos: [{ jogo_id: 'abc', league: 'Série A', time: '21:30', home: 'Casa', away: 'Fora', tier: 0 }],
}

// O $fetch da página é auto-import (não globalThis), então o mock entra pelo
// módulo do composable — que aceita fetchFn injetável.
vi.mock('~/composables/useDailyReport.js', async () => {
  const real = await vi.importActual('~/composables/useDailyReport.js')
  return { useDailyReport: () => real.useDailyReport(() => Promise.resolve(REPORT)) }
})
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

let restore = null
afterEach(() => {
  restore?.()
  restore = null
})

async function flushReport() {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

describe('daily-report: viewMode persistido', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste a visualização escolhida com storage funcional', async () => {
    const w = await mountSuspended(DailyReportPage)
    await flushReport()

    const byHour = w.findAll('button').find((b) => b.text() === 'Por horário')
    await byHour.trigger('click')
    await flushReport()

    expect(localStorage.getItem('dailyReport.viewMode')).toBe('by_hour')
    w.unmount()
  })

  it('trocar a visualização não lança com storage bloqueado', async () => {
    restore = blockStorage()
    const w = await mountSuspended(DailyReportPage) // leitura do viewMode no setup
    await flushReport()

    const byHour = w.findAll('button').find((b) => b.text() === 'Por horário')
    await byHour.trigger('click') // watch(viewMode) grava: não pode propagar
    await flushReport()

    // Segue funcional na sessão: a troca de visualização refletiu na tela.
    const byHourActive = w.findAll('button').find((b) => b.text() === 'Por horário')
    expect(byHourActive.classes().join(' ')).toContain('bg-teal-500')
    w.unmount()
  })
})
