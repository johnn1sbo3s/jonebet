<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { ensureChartRegistered } from '~/composables/useChartSetup'

const props = defineProps({
  chartData: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
})

const canvasRef = ref(null)
const chartInstance = shallowRef(null)

onMounted(async () => {
  await ensureChartRegistered()
  const { Chart } = await import('chart.js')
  chartInstance.value = new Chart(canvasRef.value, {
    type: 'line',
    data: props.chartData,
    options: props.options,
  })
})

watch(
  () => props.chartData,
  (newData) => {
    if (chartInstance.value) {
      chartInstance.value.data = newData
      chartInstance.value.update()
    }
  },
  { deep: true },
)

watch(
  () => props.options,
  (newOpts) => {
    if (chartInstance.value) {
      chartInstance.value.options = newOpts
      chartInstance.value.update()
    }
  },
  { deep: true },
)

onUnmounted(() => chartInstance.value?.destroy())

defineExpose({ resetZoom: () => chartInstance.value?.resetZoom() })
</script>

<template>
  <canvas ref="canvasRef" />
</template>
