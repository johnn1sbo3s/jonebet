<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-start justify-between">
      <PageHeader title="Bem-vindo(a) ao DataPlay!" />
    </div>

    <USkeleton v-if="status === 'pending'" class="h-112.5 w-full rounded-2xl" />

    <DataErrorCard v-else-if="dashboardError" message="Não foi possível carregar o dashboard" />

    <DataErrorCard
      v-else-if="!data?.bankrollEvolution?.length"
      icon="i-lucide-info"
      message="Nenhum resultado disponível ainda"
    />

    <div v-else class="flex flex-col gap-3 lg:flex-row">
      <UCard class="w-full border border-zinc-800 bg-zinc-900 lg:w-[70%]">
        <template #header>
          <div>
            <p class="font-semibold text-white">Lucro acumulado</p>

            <p class="text-xs text-zinc-400">Acúmulo de lucro mês a mês desde Janeiro de 2024</p>
          </div>
        </template>

        <div class="w-full">
          <BankrollEvolution :bankroll-data="data?.bankrollEvolution || []" />
        </div>
      </UCard>

      <UCard class="w-full border border-zinc-800 bg-zinc-900 lg:w-[30%]">
        <template #header>
          <div class="flex items-center justify-between font-semibold">
            <p class="text-white">Resultados por mês</p>

            <p class="text-sm font-bold xl:text-base" :class="totalProfit > 0 ? 'text-teal-500' : 'text-red-500'">
              {{ totalProfit > 0 ? '+' : '' }}{{ formatUnit(totalProfit) }}
            </p>
          </div>
        </template>

        <div class="relative">
          <div
            class="grid max-h-112.5 grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2 overflow-y-scroll p-0.5 pb-6"
          >
            <UCard
              v-for="item in resultsByMonth"
              :key="item.month"
              class="border bg-zinc-950/80"
              :class="
                item.profit >= 0
                  ? 'border-l-2 border-teal-500/20 border-l-teal-500'
                  : 'border-l-2 border-red-500/20 border-l-red-500'
              "
            >
              <div class="items-center justify-center text-center text-sm sm:flex sm:justify-between">
                <p class="text-zinc-300">{{ item.month }}</p>

                <p class="font-semibold" :class="item.profit >= 0 ? 'text-teal-500' : 'text-red-500'">
                  {{ formatUnit(item.profit) }}
                </p>
              </div>
            </UCard>
          </div>

          <div
            class="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-linear-to-t from-zinc-900 to-transparent"
          />
        </div>
      </UCard>
    </div>

    <USkeleton v-if="status === 'pending'" class="h-112.5 w-full rounded-2xl lg:h-44" />

    <UCard v-else-if="!dashboardError" id="yesterday-metrics" class="border border-zinc-800 bg-zinc-900">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-white">Resultados de {{ formatDate(chosenDateIso) }}</p>

          <div class="flex items-center gap-1">
            <DatePicker v-model="chosenDateIso" :max-value="maxDateIso" />
          </div>
        </div>
      </template>

      <DataErrorCard
        v-if="yesterdayData === null && !dayLoading"
        :message="`Não foi possível carregar os resultados de ${formatDate(chosenDateIso)}`"
      />

      <DataErrorCard
        v-else-if="!yesterdayData?.results?.length && !dayLoading"
        icon="i-lucide-info"
        :message="`Nenhum resultado disponível para ${formatDate(chosenDateIso)}`"
      />

      <template v-else>
        <USkeleton v-if="dayLoading" class="h-112.5 w-full rounded-2xl lg:h-44" />

        <div v-else class="flex w-full flex-col items-stretch gap-2 lg:flex-row">
          <div class="min-w-0 flex-1">
            <YesterdayMetricsCard :items="dayMetrics" />
          </div>

          <div v-if="yesterdayData?.topModels?.length" class="min-w-0 flex-1">
            <RankingModels
              :title="'Top 3 modelos'"
              :items="yesterdayData.topModels"
              :all-results-data="yesterdayData.results"
            />
          </div>

          <div class="min-w-0 flex-1">
            <YesterdayDetailsCard
              :number-bets="yesterdayData?.metrics?.bets"
              :number-models="yesterdayData?.metrics?.models"
              :positive-models="yesterdayData?.positiveModels || 0"
            />
          </div>
        </div>
      </template>
    </UCard>

    <USkeleton v-if="status === 'pending'" class="h-112.5 w-full rounded-2xl lg:h-44" />

    <DataErrorCard
      v-else-if="!dashboardError && !data?.month?.results?.length"
      icon="i-lucide-info"
      :message="`Nenhum resultado disponível para ${currentMonthLabel} ainda`"
    />

    <UCard v-else-if="!dashboardError" id="month-metrics" class="border border-zinc-800 bg-zinc-900">
      <template #header>
        <p class="font-semibold text-white">Resultados do mês</p>
      </template>

      <div class="flex w-full flex-col items-stretch gap-2 lg:flex-row">
        <div class="min-w-0 flex-1">
          <YesterdayMetricsCard :items="monthMetrics" />
        </div>

        <div v-if="data?.month?.topModels?.length" class="min-w-0 flex-1">
          <RankingModels
            :title="'Top 3 modelos'"
            :items="data.month.topModels"
            :all-results-data="data.month.results"
          />
        </div>

        <div class="min-w-0 flex-1">
          <YesterdayDetailsCard
            :number-bets="data?.month?.metrics?.bets"
            :number-models="data?.month?.metrics?.models"
            :positive-models="data?.month?.positiveModels || 0"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const runtimeConfig = useRuntimeConfig()
const apiUrl = runtimeConfig.public.API_URL

const {
  data: rawData,
  status,
  error: dashboardError,
} = await useFetch(`${apiUrl}/dashboard`, {
  onResponse({ response }) {
    if (response?.ok && response._data) {
      const parsed = safeParse('dashboard', response._data)
      response._data = parsed
    }
  },
})

// Clean undefined properties for SSR serialization
function cleanObj(obj) {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}
function cleanArray(arr) {
  if (!arr?.length) return []
  return arr.map((item) => cleanObj(item))
}

const data = computed(() => {
  if (!rawData.value) return null
  const d = rawData.value
  return {
    ...d,
    bankrollEvolution: cleanArray(d.bankrollEvolution),
    yesterday: d.yesterday
      ? {
          ...d.yesterday,
          topModels: cleanArray(d.yesterday.topModels),
          results: cleanArray(d.yesterday.results),
        }
      : null,
    month: d.month
      ? {
          ...d.month,
          topModels: cleanArray(d.month.topModels),
          results: cleanArray(d.month.results),
        }
      : null,
  }
})

// Date picker
const timezone = 'America/Sao_Paulo'
const yesterday = DateTime.now().setZone(timezone).minus({ days: 1 }).toFormat('yyyy-MM-dd')
const chosenDateIso = ref(yesterday)
const maxDateIso = yesterday
const dayLoading = ref(false)
const yesterdayData = ref({})

// Month label for the dashboard "current month" card, in the same
// "Mês/aa" format used by `bankrollEvolution` entries (e.g. "Julho/26").
const currentMonthLabel = computed(() => {
  const dt = DateTime.now().setZone(timezone).setLocale('pt-BR')
  const month = dt.toFormat('LLLL')
  return `${month.charAt(0).toUpperCase()}${month.slice(1)}/${dt.toFormat('yy')}`
})

const resultsByMonth = computed(() => {
  if (!data.value?.bankrollEvolution?.length) return []
  return data.value.bankrollEvolution
    .map((item) => ({
      month: item.month,
      profit: item.profit,
    }))
    .reverse()
})

const totalProfit = computed(() => {
  const b = data.value?.bankrollEvolution
  if (!b?.length) return 0
  const sum = b.reduce((acc, item) => acc + item.profit, 0)
  return Math.round(sum * 100) / 100
})

const dayMetrics = computed(() => {
  const m = yesterdayData.value?.metrics
  if (!m) return []
  return [
    { name: 'Profit', value: m.profit, unit: 'u' },
    { name: 'Investido', value: m.invested, unit: 'u', decimals: 0 },
    { name: 'ROI', value: m.roi, unit: '%' },
  ]
})

const monthMetrics = computed(() => {
  const m = data.value?.month?.metrics
  if (!m) return []
  return [
    { name: 'Profit', value: m.profit, unit: 'u' },
    { name: 'Investido', value: m.invested, unit: 'u', decimals: 0 },
    { name: 'ROI', value: m.roi, unit: '%' },
  ]
})

async function fetchDayResults(date) {
  dayLoading.value = true
  try {
    const result = await $fetch(`${apiUrl}/daily-results/${date}`)
    yesterdayData.value = safeParse('dailyResults', result)
  } catch {
    yesterdayData.value = null
  } finally {
    dayLoading.value = false
  }
}

// Load initial date (use dashboard fallback data or fetch)
if (data.value?.yesterday?.results?.length) {
  yesterdayData.value = data.value.yesterday
  if (data.value.yesterday.date) {
    chosenDateIso.value = data.value.yesterday.date
  }
} else {
  await fetchDayResults(yesterday)
}

// Refetch when date changes
watch(chosenDateIso, (newDate) => {
  if (newDate) fetchDayResults(newDate)
})
</script>
