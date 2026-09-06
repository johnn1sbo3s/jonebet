<script setup>
import { useTradingModels } from '~/composables/useTradingModels'
import TradingModelDayCard from '~/components/tradingModelDayCard.vue'
import TradingModelAggTable from '~/components/tradingModelAggTable.vue'
import TradingModelsSkeleton from '~/components/tradingModelsSkeleton.vue'
import DataErrorCard from '~/components/DataErrorCard.vue'
import { yesterdayIso } from '~/utils/timezone'
import { formatDate } from '~/utils/formatDate'

const props = defineProps({
  initialDate: { type: String, default: null },
})

const selectedDate = ref(props.initialDate ?? yesterdayIso())

const { daily, summary, dailyPending, summaryPending, dailyError, summaryError } = useTradingModels({
  date: selectedDate,
})

const shortDay = (iso) => formatDate(iso, { style: 'short' }).slice(0, 5)

const weeklyTitle = computed(() => {
  if (!summary.value?.week?.start_date) return 'Semana'
  return `Semana (${shortDay(summary.value.week.start_date)} a ${shortDay(summary.value.week.end_date)})`
})

const monthlyTitle = computed(() => {
  if (!summary.value?.month?.year) return 'Mês'
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[summary.value.month.month - 1]} ${summary.value.month.year}`
})

const hasDailyModels = computed(() => (daily.value?.daily?.length ?? 0) > 0)

function onDateChange(newDate) {
  selectedDate.value = newDate
}
</script>

<template>
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-white">Resultados por modelo</h3>

      <p class="text-xs text-zinc-500">Stake de R$ 10,00</p>
    </div>

    <DatePicker :model-value="selectedDate" @update:model-value="onDateChange" />
  </div>

  <div class="grid grid-cols-1 gap-3">
    <TradingModelsSkeleton v-if="dailyPending" />

    <template v-else>
      <TradingModelDayCard v-for="model in daily?.daily ?? []" :key="model.model" :model="model" />

      <DataErrorCard v-if="dailyError" message="Não foi possível carregar as apostas do dia" />

      <DataErrorCard v-else-if="!hasDailyModels" message="Sem apostas neste dia" icon="i-lucide-calendar-x" />
    </template>

    <TradingModelsSkeleton v-if="summaryPending" />

    <template v-else>
      <DataErrorCard
        v-if="summaryError && !summary?.week && !summary?.month"
        message="Não foi possível carregar semana e mês"
      />

      <template v-else>
        <TradingModelAggTable v-if="summary?.week" :title="weeklyTitle" :agg="summary.week" />

        <TradingModelAggTable v-if="summary?.month" :title="monthlyTitle" :agg="summary.month" />
      </template>
    </template>
  </div>
</template>
