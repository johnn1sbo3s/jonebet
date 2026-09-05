<script setup>
import { useTradingModels } from '~/composables/useTradingModels'
import TradingModelDayCard from '~/components/tradingModelDayCard.vue'
import TradingModelAggTable from '~/components/tradingModelAggTable.vue'
import DataErrorCard from '~/components/DataErrorCard.vue'
import { yesterdayIso } from '~/utils/timezone'

const route = useRoute()
const selectedDate = ref(route.query.date ?? yesterdayIso())

const { data, pending, error } = useTradingModels({ date: selectedDate })

const weeklyTitle = computed(() => {
  if (!data.value?.weekly?.start_date) return 'Semana'
  return `Semana (${data.value.weekly.start_date} a ${data.value.weekly.end_date})`
})

const monthlyTitle = computed(() => {
  if (!data.value?.monthly?.year) return 'Mês'
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[data.value.monthly.month - 1]} ${data.value.monthly.year}`
})

function onDateChange(newDate) {
  selectedDate.value = newDate
}
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">📊 Trading Models</h1>

        <p class="text-xs text-zinc-500">Stake 10u · Green +10 · RL −5% liability · Red −30%</p>
      </div>

      <DatePicker :model-value="selectedDate" @update:model-value="onDateChange" />
    </div>

    <div v-if="pending" class="grid grid-cols-1 gap-3">
      <div v-for="i in 5" :key="i" class="h-32 animate-pulse rounded-2xl bg-zinc-900"></div>
    </div>

    <DataErrorCard v-else-if="error" message="Erro ao carregar dados" />

    <div v-else class="grid grid-cols-1 gap-3">
      <TradingModelDayCard v-for="model in data?.daily ?? []" :key="model.model" :model="model" />

      <TradingModelAggTable v-if="data?.weekly" :title="weeklyTitle" :agg="data.weekly" />

      <TradingModelAggTable v-if="data?.monthly" :title="monthlyTitle" :agg="data.monthly" />
    </div>
  </div>
</template>
