<template>
  <LineChart class="h-64 w-full lg:h-96" :chart-data="chartData" :options="chartOptions" />
</template>

<script setup>
import { lineChartComponent } from '~/utils/chartSetup'
import { useBankrollChartOptions } from '~/composables/useChartOptions'

const LineChart = lineChartComponent()

const props = defineProps({
  bankrollData: {
    type: Object,
    required: true,
    default: () => {},
  },
})

const chartOptions = computed(() => useBankrollChartOptions())

const chartData = computed(() => {
  if (!props.bankrollData?.length) {
    return { labels: [], datasets: [] }
  }
  // A API já serve a série acumulada de lucro (começa em 0) — plotar direto,
  // sem re-derivar no cliente.
  const labels = props.bankrollData.map((item) => item.month)
  const data = props.bankrollData.map((item) => item.bankroll)

  return {
    labels: labels,
    datasets: [
      {
        label: 'Lucro acumulado',
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
