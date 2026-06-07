<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-start justify-between">
      <PageHeader title="Bem-vindo(a) ao DataPlay!" />
    </div>

    <UAlert
      v-if="showAlert"
      color="warning"
      variant="soft"
      title="Atenção"
      close
      description="Apostas são para maiores de 18 anos e envolvem riscos financeiros. Aposte com responsabilidade e nunca arrisque mais do que pode perder."
      @update:open="showAlert = false"
    />

    <USkeleton v-if="status === 'pending'" class="mt-2 h-60 w-full rounded-2xl" />

    <DataErrorCard
      v-else-if="!data?.bankrollEvolution?.length"
      class="mt-2"
      message="Não foi possível carregar a evolução da banca"
    />

    <div v-else class="mt-2 flex flex-col gap-3 lg:flex-row">
      <UCard class="w-full border border-zinc-800 bg-zinc-900 lg:w-[70%]">
        <template #header>
          <div>
            <p class="font-semibold text-white">Evolução da banca</p>

            <p class="text-xs text-zinc-400">Crescimento da banca mês a mês desde Janeiro de 2024</p>
          </div>
        </template>

        <div class="w-full">
          <BankrollEvolution :model-value="status === 'pending'" :bankroll-data="data?.bankrollEvolution || []" />
        </div>
      </UCard>

      <UCard class="w-full border border-zinc-800 bg-zinc-900 lg:w-[30%]">
        <template #header>
          <div class="flex items-center justify-between font-semibold">
            <p class="text-white">Resultados por mês</p>

            <p class="text-sm font-bold xl:text-base" :class="totalProfit > 0 ? 'text-teal-500' : 'text-red-500'">
              {{ totalProfit > 0 ? '+' : '' }}{{ totalProfit.toLocaleString('pt-BR') }} u
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
                  {{ item.profit.toLocaleString('pt-BR') }} u
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

    <USkeleton v-if="status === 'pending'" class="h-60 w-full rounded-2xl" />

    <UCard v-else id="yesterday-metrics" class="border border-zinc-800 bg-zinc-900">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-white">Resultados de {{ formatDate(chosenDateIso) }}</p>

          <div class="flex items-center gap-1">
            <DatePicker v-model="chosenDateIso" :max-value="maxDateIso" />
          </div>
        </div>
      </template>

      <DataErrorCard
        v-if="!yesterdayData?.results?.length && !dayLoading"
        :message="`Não foi possível carregar os resultados de ${formatDate(chosenDateIso)}`"
      />

      <template v-else>
        <USkeleton v-if="dayLoading" class="h-60 w-full rounded-2xl" />

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

    <USkeleton v-if="status === 'pending'" class="h-60 w-full rounded-2xl" />

    <DataErrorCard v-else-if="!data?.month?.results?.length" message="Não foi possível carregar os resultados do mês" />

    <UCard v-else id="month-metrics" class="border border-zinc-800 bg-zinc-900">
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
const yesterdayStore = useYesterdayModelsStore()
const showAlert = ref(true)

const { data: rawData, status } = await useFetch(`${apiUrl}/dashboard`)

// Clean undefined properties for SSR serialization
function cleanObj(obj) {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined))
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
  if (!b?.length || b.length < 2) return 0
  return b.at(-1).bankroll - b.at(0).bankroll
})

const dayMetrics = computed(() => {
  const m = yesterdayData.value?.metrics
  if (!m) return []
  return [
    { name: 'Profit', value: m.profit, sufix: 'u' },
    { name: 'Investido', value: m.invested, sufix: 'u' },
    { name: 'ROI', value: m.roi, sufix: '' },
  ]
})

const monthMetrics = computed(() => {
  const m = data.value?.month?.metrics
  if (!m) return []
  return [
    { name: 'Profit', value: m.profit, sufix: 'u' },
    { name: 'Investido', value: m.invested, sufix: 'u' },
    { name: 'ROI', value: m.roi, sufix: '' },
  ]
})

async function fetchDayResults(date) {
  dayLoading.value = true
  try {
    const result = await $fetch(`${apiUrl}/daily-results/${date}`)
    yesterdayData.value = result
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

// Store for other pages
watch(
  () => yesterdayData.value?.results,
  (val) => {
    if (val?.length) {
      yesterdayStore.setYesterdayModels(val)
    }
  },
  { immediate: true },
)
</script>
