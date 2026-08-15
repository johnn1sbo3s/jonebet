// Chart.js options factory. The Chart.js stack (zoom, annotation, registerables)
// is registered once in utils/chartSetup.js (ensureChartSetup) — do NOT re-register here.

const TEAL = 'rgb(20 184 166)'
const TEAL_BG = 'rgba(20, 184, 166, 0.15)'
const ZINC_TICK = '#a1a1aa'
const ZINC_GRID = '#27272a'
const ZINC_LABEL = '#d4d4d8'

/**
 * Options for a static line chart (no annotation, no zoom), e.g. drawdown.
 */
export function useStaticLineOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: { beginAtZero: true, display: false },
      x: { display: false },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }
}

/**
 * Options for the bankroll-evolution chart. Static annotation line at the start.
 */
export function useBankrollChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      // Eixo X com meses (ex.: "Janeiro/24"): limitar os ticks pra não poluir
      // com 30+ meses — autoSkip pega a cada N meses com espaçamento uniforme.
      x: {
        ticks: {
          color: ZINC_TICK,
          autoSkip: true,
          maxTicksLimit: 8,
          maxRotation: 0,
          minRotation: 0,
          autoSkipPadding: 16,
        },
        grid: { color: ZINC_GRID },
      },
      y: { beginAtZero: true, ticks: { color: ZINC_TICK }, grid: { color: ZINC_GRID } },
    },
    plugins: {
      legend: { position: 'top', display: true, labels: { color: ZINC_LABEL } },
      annotation: {
        annotations: {
          line1: { type: 'line', xMin: -100, xMax: -100, borderColor: TEAL, borderWidth: 2 },
        },
      },
    },
  }
}

/**
 * Options for the performance chart. The annotation x-position is supplied
 * per-render via `annotationIndex` (typically `chartPayload.annotationIndex`).
 *
 * @param {{ annotationIndex?: number, xAxisTitle?: string|null }} [opts]
 */
export function usePerformanceChartOptions({ annotationIndex = -100, xAxisTitle = null } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    transitions: { zoom: { animation: { duration: 1000, easing: 'easeOutCubic' } } },
    scales: {
      x: {
        beginAtZero: false,
        title: { display: Boolean(xAxisTitle), text: xAxisTitle, color: ZINC_LABEL },
        ticks: {
          color: ZINC_TICK,
          autoSkip: true,
          maxTicksLimit: 8,
          maxRotation: 0,
          minRotation: 0,
          autoSkipPadding: 16,
        },
        grid: { color: ZINC_GRID },
      },
      y: {
        beginAtZero: false,
        ticks: { color: ZINC_TICK },
        grid: { color: ZINC_GRID },
      },
    },
    plugins: {
      legend: { position: 'top', display: true },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
          drag: { enabled: true, borderColor: TEAL, borderWidth: 1, backgroundColor: TEAL_BG },
        },
        pan: { enabled: true, mode: 'x', modifierKey: 'ctrl' },
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            xMin: annotationIndex,
            xMax: annotationIndex,
            borderColor: TEAL,
            borderWidth: 2,
            label: {
              display: true,
              content: 'Início dos jogos reais',
              position: 'start',
              color: ZINC_LABEL,
              font: { size: 10 },
              xAdjust: 6,
            },
          },
        },
      },
    },
  }
}
