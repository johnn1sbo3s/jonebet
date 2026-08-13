import { defineAsyncComponent, defineComponent, h } from 'vue'

// Lazy registration of the Chart.js stack. Before 2026-08-13 this lived in a
// client plugin (app/plugins/chartjs.client.js), which put chart.js + zoom +
// annotation in the startup module graph — every visitor downloaded ~190KB
// (raw) of chart code before first paint, even on pages without charts. Now
// the stack downloads and registers only when the first chart mounts, after
// LCP. The memoized promise makes repeated calls safe (no double registration).
let setupPromise = null

export function ensureChartSetup() {
  if (!setupPromise) {
    setupPromise = Promise.all([
      import('chart.js'),
      import('chartjs-plugin-zoom'),
      import('chartjs-plugin-annotation'),
    ]).then(([{ Chart, registerables }, { default: zoomPlugin }, { default: annotationPlugin }]) => {
      Chart.register(zoomPlugin)
      Chart.register(annotationPlugin)
      Chart.register(...registerables)
      return Chart
    })
  }
  return setupPromise
}

// Reserves the chart's box in the SSR HTML and during the brief client-side
// chunk load. It renders a plain div carrying the same class/style the real
// chart root will receive, so mounting the chart after hydration doesn't
// shift the layout (CLS). Only class/style are mirrored — chart props
// (chart-data, options) are dropped, never leaked onto the DOM.
const ChartPlaceholder = defineComponent({
  inheritAttrs: false,
  render() {
    return h('div', { class: this.$attrs.class, style: this.$attrs.style })
  },
})

// Async component factory for vue-chart-3's LineChart. SSR-safe: on the server
// the loader resolves to the placeholder immediately, so hammerjs/chart.js are
// never imported in the server bundle (Nuxt renders async components inside
// Suspense on the server, which would otherwise execute the loader and crash).
export function lineChartComponent() {
  return defineAsyncComponent({
    loader: () => {
      if (import.meta.server) {
        return Promise.resolve(ChartPlaceholder)
      }
      return loadChartStack()
    },
    loadingComponent: ChartPlaceholder,
    delay: 0,
  })
}

async function loadChartStack() {
  await ensureChartSetup()
  const { LineChart: LineChartComp } = await import('vue-chart-3')
  return LineChartComp
}
