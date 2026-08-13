import { vi } from 'vitest'

// Stub the chart stack globally so tests don't try to render real charts.
// `chart.js` is CJS-only and vitest can't always interop its named
// exports (`registerables`, `Element`, etc.), so we replace the whole
// module with harmless stubs. `utils/chartSetup.js` imports internals from
// `chart.js` dynamically, so they're stubbed too. `LineChart` from `vue-chart-3`
// instantiates a real `Chart` on mount, which is also stubbed. None of
// this affects chart logic — these stubs just let the test renderer run.
vi.mock('chart.js', () => ({
  Chart: { register: () => undefined },
  registerables: [],
}))

vi.mock('chartjs-plugin-annotation', () => ({
  default: { id: 'annotation' },
}))

vi.mock('chartjs-plugin-zoom', () => ({
  default: { id: 'zoom' },
}))

vi.mock('vue-chart-3', () => ({
  LineChart: {
    name: 'LineChart',
    template: '<div data-testid="line-chart-stub"></div>',
    props: ['chartData', 'options', 'style'],
  },
}))

// Stub the model API composables. `vi.stubGlobal` is not enough for
// Nuxt auto-imports — the Vite plugin resolves them at compile time, so
// the global is bypassed. Mocking the source module directly intercepts
// the import the auto-import expands to. `useModelChart` and
// `useModelTrend` return a small two-point series so the chart-derived
// computeds (r², totalAccumulated, trend line) are non-null and the
// component renders the full set of metric labels.
vi.mock('~/composables/useModelApi.js', async () => {
  const { ref } = await import('vue')
  const ok = <T>(value: T) => ({
    data: ref(value),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
    execute: vi.fn(),
    status: ref('success'),
  })
  return {
    useModelsList: () => ok({ items: [] }),
    useModelById: () => ok(null),
    useModelResults: () => ok([]),
    useModelChart: () => ok({ labels: ['2026-02-27', '2026-02-28'], data: [3, 5], annotationIndex: 0 }),
    useModelTrend: () => ok({ slope: 1, intercept: 2, line: [3, 4], distance: 0 }),
    useModelBets: () => ok({ items: [], total: 0, page: 1, size: 25 }),
  }
})

// Stub Nuxt auto-imports that aren't covered by the composable mock.
// `vi.stubGlobal` works for these because the components touch them via
// `useRoute()` / `useRuntimeConfig()` style calls, which the Nuxt
// runtime looks up dynamically in the test env.
vi.stubGlobal('useRoute', () => ({ params: {} }))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { API_URL: 'http://test' } }))
