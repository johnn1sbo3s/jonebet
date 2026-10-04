// tests/app/utils/chartSetup.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// O lazy-load real importa chart.js + plugins dinamicamente. Aqui o
// 'chart.js' é mockado com um getter em `Chart` que lança enquanto `fail`
// estiver ligado — simula a rejeição do import por falha de rede, sem
// precisar trocar a stack de charts.
const state = vi.hoisted(() => {
  const chart = {
    register: (..._plugins: unknown[]) => {
      state.registers += 1
    },
  }
  return { fail: false, registers: 0, chart }
})

vi.mock('chart.js', () => ({
  get Chart() {
    if (state.fail) throw new Error('Failed to fetch dynamically imported module: chart.js')
    return state.chart
  },
  get registerables() {
    return [{ id: 'registerable' }]
  },
}))

vi.mock('chartjs-plugin-zoom', () => ({ default: { id: 'zoom' } }))
vi.mock('chartjs-plugin-annotation', () => ({ default: { id: 'annotation' } }))

// Import dinâmico de propósito: este teste exercita a fronteira de
// carregamento de módulo (memoização + reset da rejeição), então precisa de
// uma instância nova de `chartSetup` por teste — `vi.resetModules()` é o que
// isola a memoização que vive no escopo do módulo. Um import estático não
// faria esse papel.
const loadSetup = async () => (await import('~/utils/chartSetup.js')).ensureChartSetup

describe('ensureChartSetup', () => {
  beforeEach(() => {
    vi.resetModules()
    state.fail = false

    state.registers = 0
  })

  it('recupera de falha transitória: a rejeição não fica memoizada', async () => {
    const ensureChartSetup = await loadSetup()

    state.fail = true
    const failing = ensureChartSetup()
    await expect(failing).rejects.toThrow(/chart\.js/)

    // Rede de volta: a próxima chamada refaz o setup (promise nova) e resolve.
    state.fail = false
    const recovered = ensureChartSetup()
    expect(recovered).not.toBe(failing)
    await expect(recovered).resolves.toBe(state.chart)
    expect(state.registers).toBe(3)
  })

  it('memoiza o setup bem-sucedido: N chamadas rodam o registro uma vez só', async () => {
    const ensureChartSetup = await loadSetup()

    const first = ensureChartSetup()
    await expect(first).resolves.toBe(state.chart)
    expect(state.registers).toBe(3)

    const others = [ensureChartSetup(), ensureChartSetup(), ensureChartSetup()]
    expect(others).toEqual([first, first, first])
    await Promise.all(others)
    expect(state.registers).toBe(3)
  })
})
