<template>
  <LineChart :chart-data="chartData" :options="chartOptions" :style="chartStyle" />
</template>

<script setup>
import { LineChart } from 'vue-chart-3'
import { useBankrollChartOptions } from '~/composables/useChartOptions'

const props = defineProps({
  bankrollData: {
    type: Object,
    required: true,
    default: () => {},
  },
})

const chartOptions = computed(() => useBankrollChartOptions())

const chartStyle = ref({
  height: '400px',
  width: '100%',
})

const chartData = computed(() => {
  if (!props.bankrollData?.length) {
    return { labels: [], datasets: [] }
  }
  const labels = props.bankrollData.map((item) => item.month)
  const data = props.bankrollData.map((item) => item.bankroll)

  return {
    labels: labels,
    datasets: [
      {
        label: 'Acúmulo de capital',
        data: data,
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        pointRadius: 3,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.2,
      },
    ],
  }
})
</script>

<style lang="scss" scoped></style>
