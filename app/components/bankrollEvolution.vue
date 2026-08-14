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
  // Série de lucro acumulado: começa em 0 e soma os profits mês a mês.
  // O campo `bankroll` da API inclui 100u de capital inicial — não usar aqui
  // para o acumulado bater com a soma dos resultados mensais do dashboard.
  let accumulated = 0
  const labels = ['']
  const data = [0]
  for (const item of props.bankrollData) {
    accumulated = Math.round((accumulated + item.profit) * 100) / 100
    labels.push(item.month)
    data.push(accumulated)
  }

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
