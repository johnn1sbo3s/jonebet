let chartReady = false

export async function ensureChartRegistered() {
  if (chartReady) return

  const [
    { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler },
    zoomPlugin,
    annotationPlugin,
  ] = await Promise.all([import('chart.js'), import('chartjs-plugin-zoom'), import('chartjs-plugin-annotation')])

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin.default ?? zoomPlugin,
    annotationPlugin.default ?? annotationPlugin,
  )

  chartReady = true
}
