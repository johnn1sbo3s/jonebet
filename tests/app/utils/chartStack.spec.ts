// tests/app/utils/chartStack.spec.ts
// Comportamento da stack de gráficos (ticket 40): chart.js 4 + vue-chart-3 4 +
// plugins compatíveis. Este teste importa os pacotes REAIS (sem mock) — é o que
// prova que os quatro pacotes são compatíveis entre si na linha 4. O mock do
// chartSetup.spec continua sendo o lugar para a fronteira de carregamento.
import { describe, it, expect, vi } from 'vitest'

// O setup global (app/test.setup.ts) substitui a stack por stubs para os outros
// specs renderizarem rápido. Aqui o ponto é o oposto: exercitar os pacotes
// reais. `vi.unmock` tem escopo de arquivo, então o resto da suíte não muda.
vi.unmock('chart.js')
vi.unmock('chartjs-plugin-annotation')
vi.unmock('chartjs-plugin-zoom')
vi.unmock('vue-chart-3')

import { Chart, registerables } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import { LineChart } from 'vue-chart-3'
import {
  useBankrollChartOptions,
  usePerformanceChartOptions,
  useStaticLineOptions,
} from '~/composables/useChartOptions'

type ChartLike = Chart & { $plugins?: unknown }

// Import dinâmico de propósito: o registro dos plugins vive no escopo de módulo
// de utils/chartSetup.js, e o teste quer a fronteira real de carregamento —
// um import estático não a exercitaria.
const loadSetup = async () => (await import('~/utils/chartSetup.js')).ensureChartSetup

// `ensureChartSetup` registra zoom + annotation + os registerables na instância
// real do Chart — é esse registro que os três gráficos abaixo exercitam.
async function registerStack() {
  const ensureChartSetup = await loadSetup()
  await ensureChartSetup()
}

describe('chart stack', () => {
  it('runs chart.js on the 4.x line', () => {
    expect(Chart.version.startsWith('4.')).toBe(true)
  })

  it('registers zoom and annotation on chart.js 4 without throwing', () => {
    Chart.register(zoomPlugin)
    Chart.register(annotationPlugin)
    Chart.register(...registerables)

    // Se algum plugin usasse API removida na 4 ou declarasse id duplicado, o
    // registry rebuilt aqui acusaria — estas são as leituras que um chart real
    // faz no boot.
    expect(Chart.registry.plugins.get('zoom')).toBeTruthy()
    expect(Chart.registry.plugins.get('annotation')).toBeTruthy()
    expect(Chart.registry.getController('line')).toBeTruthy()
  })

  it('exposes vue-chart-3 4 LineChart as a component', () => {
    expect(LineChart).toBeTruthy()
  })

  it('renders the bankroll chart: labels and series survive the v4 migration', async () => {
    await registerStack()

    const chart = buildChart(useBankrollChartOptions(), {
      labels: ['Janeiro/24', 'Fevereiro/24'],
      datasets: [
        {
          label: 'Lucro acumulado',
          data: [0, 120],
          borderColor: '#14B8A6',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          pointRadius: 3,
          fill: true,
          tension: 0.2,
        },
      ],
    })

    expect(chart.data.labels).toEqual(['Janeiro/24', 'Fevereiro/24'])
    expect(chart.data.datasets[0].label).toBe('Lucro acumulado')
    // Scales de verdade: se a 4 recusasse alguma opção de `scales`, o update
    // deixaria de criar o eixo.
    expect(Object.keys(chart.scales).sort()).toEqual(['x', 'y'])
    expect(chart.scales.x.ticks.length).toBeGreaterThan(0)
    expect(chart.getDatasetMeta(0).type).toBe('line')
    chart.destroy()
  })

  it('renders the performance chart: both phases and the annotation survive', async () => {
    await registerStack()

    const chart = buildChart(usePerformanceChartOptions({ annotationIndex: 1, xAxisTitle: 'Data' }), {
      labels: ['2026-02-27', '2026-02-28', '2026-03-01'],
      datasets: [
        {
          label: 'Validação',
          data: [0, 5, null],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.14)',
          pointRadius: 1,
          fill: true,
          tension: 0.2,
        },
        {
          label: 'Real',
          data: [null, 5, 9],
          borderColor: '#2dd4bf',
          backgroundColor: 'rgba(45, 212, 191, 0.14)',
          pointRadius: 1,
          fill: true,
          tension: 0.2,
        },
        {
          label: 'Linha de tendência',
          data: [0.5, 5, 9.5],
          borderColor: 'rgba(212, 212, 216, 0.45)',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.2,
        },
      ],
    })

    expect(chart.data.datasets.map((d) => d.label)).toEqual(['Validação', 'Real', 'Linha de tendência'])
    expect(Object.keys(chart.scales).sort()).toEqual(['x', 'y'])
    // Zoom e annotation são plugins registrados: o `beforeUpdate` deles roda no
    // update, então um formato de opção incompatível estoura aqui.
    expect(chart.options.plugins.zoom.zoom.wheel.enabled).toBe(true)
    const annotations = chart.options.plugins.annotation.annotations
    expect(annotations.line1.xMin).toBe(1)
    expect(annotations.line1.label.content).toBe('Início dos jogos reais')
    chart.destroy()
  })

  it('renders the drawdown chart: hidden axes stay hidden under v4', async () => {
    await registerStack()

    const chart = buildChart(useStaticLineOptions(), {
      labels: ['a', 'b'],
      datasets: [
        {
          label: 'Drawdown',
          data: [0, 3],
          borderColor: 'rgb(248, 113, 113)',
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          pointRadius: 0,
          borderWidth: 1.5,
          fill: 'origin',
          tension: 0.2,
        },
      ],
    })

    expect(chart.scales.x.options.display).toBe(false)
    expect(chart.scales.y.options.display).toBe(false)
    expect(chart.scales.y.options.beginAtZero).toBe(true)
    chart.destroy()
  })
})

// happy-dom não implementa canvas 2D; um stub do contexto é o suficiente para o
// Chart.js 4 percorrer o caminho real de criação de scales, ticks e legend.
// Sem isto o teste mediria o happy-dom, não a migration.
function stubContext2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const noop = () => undefined
  return {
    // DomPlatform (chart.js 4) só aceita o contexto quando `context.canvas`
    // aponta de volta para o elemento — sem essa referência o Chart aborta com
    // "can't acquire context" antes de criar qualquer scale.
    canvas,
    // O legend mede o label com `ctx.font` + `measureText`; sem `font` o
    // plugin de legend do 4 quebra no layout.
    font: '12px sans-serif',
    fontKerning: 'auto',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    lineCap: 'butt',
    lineJoin: 'miter',
    lineDashOffset: 0,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    imageSmoothingEnabled: true,
    filter: 'none',
    shadowBlur: 0,
    shadowColor: 'transparent',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineWidth: 1,
    miterLimit: 10,
    save: noop,
    restore: noop,
    scale: noop,
    rotate: noop,
    translate: noop,
    transform: noop,
    setTransform: noop,
    resetTransform: noop,
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    arc: noop,
    arcTo: noop,
    rect: noop,
    fill: noop,
    stroke: noop,
    clip: noop,
    isPointInPath: () => false,
    isPointInStroke: () => false,
    measureText: (text: string) => ({
      width: String(text).length * 6,
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
    }),
    fillText: noop,
    strokeText: noop,
    drawImage: noop,
    drawFocusIfNeeded: noop,
    setLineDash: noop,
    getLineDash: () => [],
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createConicGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: noop,
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  } as unknown as CanvasRenderingContext2D
}

function buildChart(options: unknown, data: unknown): ChartLike {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 400
  // happy-dom dá área 0 a um canvas solto, e o Chart.js só faz o layout
  // (scales, ticks, legend) quando o elemento está no documento.
  document.body.appendChild(canvas)
  ;(canvas as unknown as { getContext: (t: string) => unknown }).getContext = () => stubContext2d(canvas)

  const chart = new Chart(canvas as unknown as HTMLCanvasElement, {
    type: 'line',
    data: data as never,
    options: options as never,
  }) as ChartLike

  chart.update()
  canvas.remove()
  return chart
}
