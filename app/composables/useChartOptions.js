// Chart.js options factory. The Chart.js plugins (zoom, annotation, registerables)
// are registered once in plugins/chartjs.client.js — do NOT re-register here.

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
    transitions: {
      zoom: { animation: { duration: 1000, easing: 'easeOutCubic' } },
    },
    scales: {
      x: { ticks: { color: ZINC_TICK }, grid: { color: ZINC_GRID } },
      y: { ticks: { color: ZINC_TICK }, grid: { color: ZINC_GRID } },
    },
    plugins: {
      legend: { position: 'top', display: true, labels: { color: ZINC_LABEL } },
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
 * @param {{ annotationIndex?: number }} [opts]
 */
export function usePerformanceChartOptions({ annotationIndex = -100 } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    transitions: { zoom: { animation: { duration: 1000, easing: 'easeOutCubic' } } },
    scales: { y: { beginAtZero: false }, x: { beginAtZero: false } },
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
          },
        },
      },
    },
  }
}
