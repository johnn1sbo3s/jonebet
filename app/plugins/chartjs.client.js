import { Chart, registerables } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'

export default defineNuxtPlugin(() => {
  Chart.register(zoomPlugin)
  Chart.register(annotationPlugin)
  Chart.register(...registerables)
})
