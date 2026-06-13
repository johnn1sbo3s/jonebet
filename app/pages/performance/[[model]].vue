<template>
  <div class="flex flex-col gap-3">
    <PageHeader
      title="Performance dos modelos"
      description="Acompanhe o desempenho e as métricas de cada modelo"
      class="mb-3"
    />

    <div class="flex gap-5">
      <USelectMenu
        v-model="chosenModel"
        class="w-1/5"
        searchable
        placeholder="Selecione um modelo"
        :items="listModelItems"
        value-key="value"
        :loading="statusModels === 'pending'"
      >
        <template #item-label="{ item }">
          <div class="my-1 flex items-center">
            <UTooltip v-if="playedOnSet.has(item.value)" text="O modelo possui atualização de resultados de ontem">
              <span class="mr-2 h-2 w-2 rounded-full bg-teal-500" />
            </UTooltip>

            <span>{{ item.label }}</span>
          </div>
        </template>
      </USelectMenu>
    </div>

    <PerformancePageSkeleton v-if="statusModel === 'pending'" />

    <DataErrorCard v-else-if="!modelData" message="Não foi possível carregar as métricas do modelo" />

    <template v-else>
      <div class="grid w-full grid-cols-10 gap-3">
        <div id="metrics-cards" class="col-span-3 flex flex-col gap-3">
          <MetricsCard :metrics-data="modelData.metrics.val" :card-title="'Métricas de validação'" />

          <MetricsCard :metrics-data="modelData.metrics.real" :card-title="'Métricas de jogos reais'" />
        </div>

        <UCard id="model-chart" class="col-span-7 border border-zinc-800 bg-zinc-900">
          <template #header>
            <div class="flex justify-between">
              <p class="font-semibold">Gráfico de acúmulo de capital</p>

              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <USwitch v-model="chartByDay" size="md" checked-icon="i-lucide-check" unchecked-icon="i-lucide-x" />

                  <p class="text-sm">Exibição por dia</p>
                </div>

                <UButton color="secondary" variant="soft" size="sm" @click="resetsZoom">Restaurar zoom</UButton>
              </div>
            </div>
          </template>

          <div>
            <LineChart
              :key="chartKey"
              class="w-full"
              :chart-data="chartData"
              :options="chartOptions"
              :style="chartStyle"
            />

            <div class="mt-3 border-t border-zinc-800 pt-3">
              <div class="grid grid-cols-4 gap-3">
                <div v-if="trend && trend.slope != 0">
                  <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Inclinação{{ ' '
                    }}<span class="text-zinc-600 lowercase">(por {{ groupBy === 'day' ? 'dia' : 'aposta' }})</span>
                  </p>

                  <p class="mt-0.5 text-base font-medium" :class="slopeClass">{{ formatNumber(trend.slope) }}</p>
                </div>

                <div v-if="r2 != null">
                  <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">R²</p>

                  <p class="mt-0.5 text-base font-medium text-white">{{ r2.toFixed(4) }}</p>
                </div>

                <div v-if="totalAccumulated != null">
                  <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Total acumulado</p>

                  <p class="mt-0.5 text-base font-medium" :class="totalAccumulatedClass">
                    {{ formatNumber(totalAccumulated) }}
                  </p>
                </div>

                <div v-if="period">
                  <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Período</p>

                  <p class="mt-0.5 text-sm font-medium text-white">{{ period }}</p>
                </div>
              </div>
            </div>

            <div class="mt-3 border-t border-zinc-800 pt-3">
              <div class="mb-1 flex items-center justify-between">
                <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Drawdown</p>

                <p v-if="maxDrawdown != null" class="text-xs text-zinc-400">
                  Máx: <span class="font-semibold text-red-400">{{ formatNumber(maxDrawdown) }}</span>
                </p>
              </div>

              <LineChart
                :key="`dd-${chartKey}`"
                class="w-full"
                :chart-data="drawdownChartData"
                :options="drawdownOptions"
                :style="{ height: '72px' }"
              />
            </div>

            <div v-if="dailyStats" class="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-3">
              <div>
                <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Sharpe (anualizado)</p>

                <p class="mt-0.5 text-base font-medium" :class="sharpeClass">{{ dailyStats.sharpe }}</p>
              </div>

              <div>
                <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Streak atual</p>

                <p class="mt-0.5 text-base font-medium" :class="streakClass">{{ dailyStats.streak }}</p>
              </div>

              <div>
                <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">% dias negativos</p>

                <p class="mt-0.5 text-base font-medium text-white">{{ dailyStats.pctNegative }}%</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <UCard id="block-metrics" class="border border-zinc-800 bg-zinc-900">
        <template #header>
          <p class="font-semibold">Resultados por blocos de 100 jogos</p>
        </template>

        <div class="flex h-full gap-3">
          <div class="flex w-2/5 flex-col gap-3">
            <BlockMetricsCard :metrics-data="modelData.metrics.total" :card-title="'Médias'" />

            <CurrentBlockMetricsCard :metrics-data="modelData.metrics.total" :card-title="'Bloco atual'" />
          </div>

          <UCard class="w-2/3 border border-zinc-800 bg-zinc-950/80">
            <template #header>
              <p class="font-semibold">Histórico</p>
            </template>

            <UTable
              class="h-80"
              :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
              :data="modelData.blocksHistory"
              :columns="blocksHistoryColumns"
            />
          </UCard>
        </div>
      </UCard>

      <div class="grid grid-cols-2 gap-3">
        <UCard class="border border-zinc-800 bg-zinc-900">
          <template #header>
            <p class="font-semibold">Resultados por mês</p>
          </template>

          <p class="mb-3 text-sm">{{ monthlyResults.length }} meses</p>

          <UTable
            class="h-80"
            :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
            :data="monthlyResults"
            :columns="monthlyBetsColumns"
          />
        </UCard>

        <UCard class="border border-zinc-800 bg-zinc-900">
          <template #header>
            <p class="font-semibold">Resultados por dia</p>
          </template>

          <p class="mb-3 text-sm">{{ dailyResults.length }} dias</p>

          <UTable
            class="h-80"
            :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
            :data="dailyResults"
            :columns="dailyBetsColumns"
          />
        </UCard>
      </div>

      <UCard class="border border-zinc-800 bg-zinc-900">
        <template #header>
          <p class="font-semibold">Jogos reais</p>
        </template>

        <div class="mb-3 flex items-end justify-between">
          <p class="text-sm">{{ betsTotal }} jogos</p>

          <div class="flex items-center gap-2">
            <UButton size="xs" variant="soft" :disabled="betsPage <= 1" @click="betsPage--">Anterior</UButton>

            <span class="text-muted text-sm">Página {{ betsPage }} de {{ betsTotalPages }}</span>

            <UButton size="xs" variant="soft" :disabled="betsPage >= betsTotalPages" @click="betsPage++"
              >Próxima</UButton
            >
          </div>
        </div>

        <UTable
          class="h-96"
          :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
          :data="betsItems"
          :columns="allBetsDataFilteredColumns"
        />
      </UCard>
    </template>
  </div>
</template>

<script setup>
import { Chart, registerables } from 'chart.js'
import { LineChart } from 'vue-chart-3'
import { DateTime } from 'luxon'

const route = useRoute()

// --- Models list (with playedOn flag for the green dot) ---
const yesterdayIso = DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd')
const { data: modelsPayload, status: statusModels } = await useModelsList({ playedOn: yesterdayIso })
const listModels = computed(() => (modelsPayload.value?.items || []).map((m) => m.name))
const listModelItems = computed(() =>
  listModels.value.map((rawId) => ({
    label: modelNameToNaturalName(rawId),
    value: rawId,
  })),
)
const playedOnSet = computed(() => {
  const set = new Set()
  for (const m of modelsPayload.value?.items || []) {
    if (m.playedOn) set.add(m.name)
  }
  return set
})

const chosenModel = ref(listModels.value[0])
if (route.params.model && listModels.value.includes(route.params.model)) {
  chosenModel.value = route.params.model
}

const chosenModelId = computed(() => modelNameToIdName(chosenModel.value))
const chartByDay = ref(false)
const groupBy = computed(() => (chartByDay.value ? 'day' : 'bet'))

// --- Per-model data: each composable re-runs when chosenModelId changes ---
const { data: modelData, status: statusModel } = useModelById(chosenModelId)
const { data: chartPayload, pending: chartPending } = useModelChart(chosenModelId, groupBy)
const { data: trend, pending: trendPending } = useModelTrend(
  chosenModelId,
  computed(() => !chartByDay.value),
)
const { data: dailyResults, pending: dailyResultsPending } = useModelResults(chosenModelId, ref('daily'))
const { data: monthlyResults } = useModelResults(chosenModelId, ref('monthly'))

// --- Bets pagination ---
const betsPage = ref(1)
const betsSize = ref(100)
const apiUrl = useRuntimeConfig().public.API_URL

const { data: betsPayload } = await useAsyncData(
  () => `bets-${chosenModelId.value}-${betsPage.value}-${betsSize.value}`,
  () =>
    $fetch(`${apiUrl}/models/${chosenModelId.value}/bets`, {
      query: { page: betsPage.value, size: betsSize.value, sort: 'Date', order: 'asc' },
    }),
  { watch: [chosenModelId, betsPage, betsSize], default: () => ({ items: [], total: 0 }) },
)
const betsItems = computed(() => betsPayload.value?.items || [])
const betsTotal = computed(() => betsPayload.value?.total || 0)
const betsTotalPages = computed(() => Math.max(1, Math.ceil(betsTotal.value / betsSize.value)))

// Reset to page 1 when the model changes
watch(chosenModelId, () => {
  betsPage.value = 1
})

function resetsZoom() {
  chartKey.value++
}

// --- Table columns ---
const blocksHistoryColumns = [
  { id: 'Profit', accessorKey: 'Profit', header: 'Lucro' },
  { id: 'Qtd_Jogos', accessorKey: 'Qtd_Jogos', header: 'Quantidade de jogos' },
  { id: 'ROI', accessorKey: 'ROI', header: 'ROI' },
  { id: 'Ult_Dia', accessorKey: 'Ult_Dia', header: 'Último dia do bloco' },
]
const dailyBetsColumns = [
  { id: 'date', accessorKey: 'date', header: 'Dia' },
  { id: 'gain', accessorKey: 'gain', header: 'Lucro' },
  { id: 'gameCount', accessorKey: 'gameCount', header: 'Jogos' },
  { id: 'accumulated', accessorKey: 'accumulated', header: 'Acumulado' },
]
const monthlyBetsColumns = [
  { id: 'monthYear', accessorKey: 'monthYear', header: 'Mês' },
  { id: 'profit', accessorKey: 'profit', header: 'Lucro' },
  { id: 'gameCount', accessorKey: 'gameCount', header: 'Jogos' },
  { id: 'accumulated', accessorKey: 'accumulated', header: 'Acumulado' },
]
const allBetsDataFilteredColumns = [
  { id: 'Date', accessorKey: 'Date', header: 'Data' },
  { id: 'Home', accessorKey: 'Home', header: 'Casa' },
  { id: 'Away', accessorKey: 'Away', header: 'Fora' },
  { id: 'Odds', accessorKey: 'Odds', header: 'Odds' },
  { id: 'Resultado', accessorKey: 'Resultado', header: 'Resultado' },
  { id: 'Profit', accessorKey: 'Profit', header: 'Lucro' },
]

// --- Trend stats (computed from the accumulation + trend line) ---
const totalAccumulated = computed(() => {
  if (chartPending.value) return null
  const acc = chartPayload.value?.data
  if (!acc || !acc.length) return null
  return acc[acc.length - 1]
})
const totalAccumulatedClass = computed(() => {
  const v = totalAccumulated.value
  if (v == null) return 'text-white'
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
})
const r2 = computed(() => {
  if (chartPending.value || trendPending.value) return null
  const acc = chartPayload.value?.data
  const line = trend.value?.line
  if (!acc || !line || acc.length < 2 || line.length !== acc.length) return null
  const meanY = acc.reduce((a, b) => a + b, 0) / acc.length
  let ssRes = 0
  let ssTot = 0
  for (let i = 0; i < acc.length; i++) {
    ssRes += (acc[i] - line[i]) ** 2
    ssTot += (acc[i] - meanY) ** 2
  }
  if (ssTot === 0) return null
  return 1 - ssRes / ssTot
})
const slopeClass = computed(() => {
  if (trendPending.value || !trend.value || trend.value.slope === 0) return 'text-white'
  return trend.value.slope > 0 ? 'text-teal-400' : 'text-red-400'
})
const period = computed(() => {
  if (dailyResultsPending.value) return null
  const days = dailyResults.value
  if (!days || !days.length) return null
  const start = days[0].date
  const end = days[days.length - 1].date
  return `${formatDate(start)} → ${formatDate(end)}`
})
function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(-2)}`
}

// --- Drawdown (computed from the accumulation series) ---
const drawdownSeries = computed(() => {
  if (chartPending.value) return []
  const acc = chartPayload.value?.data || []
  if (!acc.length) return []
  let peak = -Infinity
  return acc.map((v) => {
    if (v > peak) peak = v
    return Math.max(0, peak - v)
  })
})
const maxDrawdown = computed(() => {
  const s = drawdownSeries.value
  return s.length ? Math.max(...s) : null
})
const drawdownChartData = computed(() => ({
  labels: chartPayload.value?.labels || [],
  datasets: [
    {
      label: 'Drawdown',
      data: drawdownSeries.value,
      borderColor: 'rgb(248, 113, 113)',
      backgroundColor: 'rgba(248, 113, 113, 0.15)',
      pointRadius: 0,
      borderWidth: 1.5,
      fill: 'origin',
      tension: 0.2,
    },
  ],
}))
const drawdownOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: {
    y: { beginAtZero: true, display: false },
    x: { display: false },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
}

// --- Risk stats (computed from the daily results series) ---
const dailyStats = computed(() => {
  if (dailyResultsPending.value) return null
  const days = dailyResults.value
  if (!days || !days.length) return null
  const gains = days.map((d) => Number(d.gain) || 0)
  const negativeDays = gains.filter((g) => g < 0).length
  const pctNegative = (negativeDays / gains.length) * 100
  const mean = gains.reduce((a, b) => a + b, 0) / gains.length
  const variance = gains.reduce((a, b) => a + (b - mean) ** 2, 0) / gains.length
  const std = Math.sqrt(variance)
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0
  let streak = 0
  let streakType = null
  for (let i = days.length - 1; i >= 0; i--) {
    const g = Number(days[i].gain) || 0
    if (g === 0) continue
    if (streakType === null) {
      streakType = g > 0 ? 'W' : 'L'
      streak = 1
    } else if ((g > 0 && streakType === 'W') || (g < 0 && streakType === 'L')) {
      streak++
    } else {
      break
    }
  }
  return {
    sharpe: sharpe.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
    streak: streak ? `${streak}${streakType}` : '—',
    pctNegative: pctNegative.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
  }
})
const sharpeClass = computed(() => {
  if (!dailyStats.value) return 'text-white'
  const v = Number(dailyStats.value.sharpe.replace(',', '.'))
  if (v > 1) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
})
const streakClass = computed(() => {
  if (!dailyStats.value) return 'text-white'
  return dailyStats.value.streak.endsWith('W') ? 'text-teal-400' : 'text-red-400'
})

// --- Chart (all reactive, no manual sync) ---
const chartKey = ref(0)
const chartStyle = ref({ height: '400px', width: '100%' })

const chartData = computed(() => {
  if (chartPending.value) return { labels: [], datasets: [] }
  const payload = chartPayload.value
  if (!payload || !payload.data) return { labels: [], datasets: [] }
  const datasets = [
    {
      label: 'Acúmulo de capital',
      data: payload.data || [],
      borderColor: '#25D88B',
      backgroundColor: 'rgb(37, 216, 139, 0.05)',
      pointRadius: 1,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.2,
    },
  ]
  if (trend.value?.line?.length) {
    datasets.push({
      label: 'Linha de tendência',
      data: trend.value.line,
      borderColor: 'rgb(30, 158, 244, 0.6)',
      borderWidth: 2,
      backgroundColor: 'rgb(109, 40, 217, 0.0)',
      pointRadius: 0,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.2,
    })
  }
  return { labels: payload.labels || [], datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  transitions: { zoom: { animation: { duration: 1000, easing: 'easeOutCubic' } } },
  scales: { y: { beginAtZero: false }, x: { beginAtZero: false } },
  plugins: {
    legend: { position: 'top', display: true },
    zoom: {
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: 'x',
        drag: {
          enabled: true,
          borderColor: 'rgb(20 184 166)',
          borderWidth: 1,
          backgroundColor: 'rgba(20, 184, 166, 0.15)',
        },
      },
      pan: { enabled: true, mode: 'x', modifierKey: 'ctrl' },
    },
    annotation: {
      annotations: {
        line1: {
          type: 'line',
          xMin: chartPayload.value?.annotationIndex ?? -100,
          xMax: chartPayload.value?.annotationIndex ?? -100,
          borderColor: 'rgb(20 184 166)',
          borderWidth: 2,
        },
      },
    },
  },
}))

// Remount the chart when the model or grouping changes so the
// internal zoom/pan state is reset (and pending state shows empty).
watch([chosenModelId, groupBy], () => {
  chartKey.value++
})

// Register Chart.js plugins on the client only (after mount, so the
// top-level await doesn't break the Nuxt setup context).
onMounted(async () => {
  const zoomPlugin = (await import('chartjs-plugin-zoom')).default
  const annotationPlugin = (await import('chartjs-plugin-annotation')).default
  Chart.register(zoomPlugin)
  Chart.register(annotationPlugin)
  Chart.register(...registerables)
})

// --- Helpers for template formatting ---
function formatNumber(n) {
  return Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}
</script>
