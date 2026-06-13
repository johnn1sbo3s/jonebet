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

              <div class="flex gap-2">
                <div class="inline-block align-middle">
                  <USwitch v-model="chartByDay" size="md" checked-icon="i-lucide-check" unchecked-icon="i-lucide-x" />
                </div>

                <p class="text-sm">Exibição por dia</p>
              </div>
            </div>
          </template>

          <div>
            <div class="mb-2 flex items-center" :class="trend && trend.slope != 0 ? 'justify-between' : 'justify-end'">
              <div v-if="trend && trend.slope != 0" class="flex gap-3 text-sm">
                <p>Trend Value: {{ formatNumber(trend.slope) }}</p>

                <p>|</p>

                <p>Trend Distance: {{ formatTrendDistance(trend.distance) }} u</p>
              </div>

              <UButton color="secondary" variant="soft" @click="resetsZoom">Restaurar zoom</UButton>
            </div>

            <LineChart
              :key="chartKey"
              class="w-full"
              :chart-data="chartData"
              :options="chartOptions"
              :style="chartStyle"
            />
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
const { data: chartPayload, status: statusChart } = useModelChart(chosenModelId, groupBy)
const { data: trend, status: statusTrend } = useModelTrend(
  chosenModelId,
  computed(() => !chartByDay.value),
)
const { data: dailyResults } = useModelResults(chosenModelId, ref('daily'))
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

// --- Chart ---
const chartData = ref({ labels: [], datasets: [] })
const chartKey = ref(0)
const chartStyle = ref({ height: '400px', width: '100%' })
const chartOptions = ref({
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
          xMin: -100,
          xMax: -100,
          borderColor: 'rgb(20 184 166)',
          borderWidth: 2,
        },
      },
    },
  },
})

// --- Reset chart state when the model or grouping changes so the
// LineChart never briefly shows the previous model's data while the
// new payload is in flight. Without this, useFetch preserves the
// stale data during refetch and the watchEffect below would re-emit
// it to the chart before the new payload arrives.
watch([chosenModelId, groupBy], () => {
  chartData.value = { labels: [], datasets: [] }
  chartOptions.value.plugins.annotation.annotations.line1.xMin = -100
  chartOptions.value.plugins.annotation.annotations.line1.xMax = -100
  chartKey.value++
})

// --- Sync chart data from server payload (only when fetches settle) ---
watch([chartPayload, trend, statusChart, statusTrend], ([payload, trendVal, cStatus, tStatus]) => {
  if (cStatus === 'pending' || tStatus === 'pending') return
  if (!payload) return
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
  if (trendVal?.line) {
    datasets.push({
      label: 'Linha de tendência',
      data: trendVal.line,
      borderColor: 'rgb(30, 158, 244, 0.6)',
      borderWidth: 2,
      backgroundColor: 'rgb(109, 40, 217, 0.0)',
      pointRadius: 0,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.2,
    })
  }
  chartData.value = { labels: payload.labels || [], datasets }
  chartOptions.value.plugins.annotation.annotations.line1.xMin = payload.annotationIndex
  chartOptions.value.plugins.annotation.annotations.line1.xMax = payload.annotationIndex
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
function formatTrendDistance(n) {
  const v = Number(n || 0)
  return `${v < 0 ? '' : v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
}
</script>
