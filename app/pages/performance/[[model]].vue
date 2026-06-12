<template>
  <div class="flex flex-col gap-3">
    <PageHeader
      title="Performance dos modelos"
      description="Acompanhe o desempenho e as métricas de cada modelo"
      class="mb-3"
    />

    <div class="flex gap-5">
      <USelectMenu
        v-model:model-value="chosenModel"
        class="w-1/5"
        searchable
        searchable-placeholder="Pesquise por um modelo"
        placeholder="Selecione um modelo"
        :options="listModels"
        :loading="statusModels === 'pending'"
      >
        <template #option="{ option }">
          <div class="my-1 flex items-center">
            <UTooltip v-if="playedOnSet.has(option)" text="O modelo possui atualização de resultados de ontem">
              <span class="mr-2 h-2 w-2 rounded-full bg-teal-500" />
            </UTooltip>

            <span>{{ option }}</span>
          </div>
        </template>
      </USelectMenu>
    </div>

    <template v-if="statusModel === 'pending'">
      <USkeleton class="h-40 w-full rounded-2xl" />
    </template>

    <DataErrorCard v-else-if="!modelData" message="Não foi possível carregar as métricas do modelo" />

    <template v-else>
      <div class="flex w-full gap-3">
        <div id="metrics-cards" class="flex w-2/5 flex-col gap-3">
          <MetricsCard :metrics-data="modelData.metrics.val" :card-title="'Métricas de validação'" />

          <MetricsCard :metrics-data="modelData.metrics.real" :card-title="'Métricas de jogos reais'" />
        </div>

        <UCard id="model-chart" class="w-3/5">
          <template #header>
            <div class="flex justify-between">
              <p class="font-semibold">Gráfico de acúmulo de capital</p>

              <div class="flex gap-2">
                <div class="inline-block align-middle">
                  <UToggle
                    size="md"
                    on-icon="i-lucide-check"
                    off-icon="i-lucide-x"
                    :model-value="chartByDay"
                    @click="toggleChartByDay"
                  />
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

              <UButton color="blue" variant="soft" @click="resetsZoom">Restaurar zoom</UButton>
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

      <UCard id="block-metrics">
        <template #header>
          <p class="font-semibold">Resultados por blocos de 100 jogos</p>
        </template>

        <div class="flex h-full gap-3">
          <div class="flex w-2/5 flex-col gap-3">
            <BlockMetricsCard :metrics-data="modelData.metrics.total" :card-title="'Médias'" />

            <CurrentBlockMetricsCard :metrics-data="modelData.metrics.total" :card-title="'Bloco atual'" />
          </div>

          <UCard class="w-2/3">
            <template #header>
              <p class="font-semibold">Histórico</p>
            </template>

            <UTable
              class="h-80"
              :ui="{ wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' }"
              :data="modelData.blocksHistory"
              :columns="blocksHistoryColumns"
            />
          </UCard>
        </div>
      </UCard>

      <div class="grid grid-cols-2 gap-3">
        <UCard>
          <template #header>
            <p class="font-semibold">Resultados por mês</p>
          </template>

          <p class="mb-3 text-sm">{{ monthlyResults.length }} meses</p>

          <UTable
            class="h-80"
            :ui="{ wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' }"
            :data="monthlyResults"
            :columns="monthlyBetsColumns"
          />
        </UCard>

        <UCard>
          <template #header>
            <p class="font-semibold">Resultados por dia</p>
          </template>

          <p class="mb-3 text-sm">{{ dailyResults.length }} dias</p>

          <UTable
            class="h-80"
            :ui="{ wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' }"
            :data="dailyResults"
            :columns="dailyBetsColumns"
          />
        </UCard>
      </div>

      <UCard>
        <template #header>
          <p class="font-semibold">Jogos reais</p>
        </template>

        <div class="mb-3 flex items-end justify-between">
          <p class="text-sm">{{ betsTotal }} jogos</p>

          <div class="flex items-center gap-2">
            <UButton size="xs" variant="soft" :disabled="betsPage <= 1" @click="betsPage--">Anterior</UButton>

            <span class="text-sm text-zinc-400">Página {{ betsPage }} de {{ betsTotalPages }}</span>

            <UButton size="xs" variant="soft" :disabled="betsPage >= betsTotalPages" @click="betsPage++"
              >Próxima</UButton
            >
          </div>
        </div>

        <UTable
          class="h-96"
          :ui="{ wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' }"
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
const playedOnSet = computed(() => {
  const set = new Set()
  for (const m of modelsPayload.value?.items || []) {
    if (m.playedOn) set.add(m.name)
  }
  return set
})

const chosenModel = ref(listModels.value[0])
if (route.params.model) {
  const fromRoute = modelNameToNaturalName(route.params.model)
  if (listModels.value.includes(fromRoute)) chosenModel.value = fromRoute
}

const chosenModelId = computed(() => modelNameToIdName(chosenModel.value))
const chartByDay = ref(false)
const groupBy = computed(() => (chartByDay.value ? 'day' : 'bet'))

// --- Per-model data: each composable re-runs when chosenModelId changes ---
const { data: modelData, status: statusModel } = useModelById(chosenModelId)
const { data: chartPayload } = useModelChart(chosenModelId, groupBy)
const { data: trend } = useModelTrend(
  chosenModelId,
  computed(() => !chartByDay.value),
)
const { data: dailyResults } = useModelResults(chosenModelId, ref('daily'))
const { data: monthlyResults } = useModelResults(chosenModelId, ref('monthly'))

// --- Bets pagination ---
const betsPage = ref(1)
const betsSize = ref(100)
const { data: betsPayload } = useModelBets(chosenModelId, {
  page: betsPage,
  size: betsSize,
  sort: ref('Date'),
  order: ref('asc'),
})
const betsItems = computed(() => betsPayload.value?.items || [])
const betsTotal = computed(() => betsPayload.value?.total || 0)
const betsTotalPages = computed(() => Math.max(1, Math.ceil(betsTotal.value / betsSize.value)))

// Reset to page 1 when the model changes
watch(chosenModelId, () => {
  betsPage.value = 1
})

function toggleChartByDay() {
  chartByDay.value = !chartByDay.value
}
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

// --- Sync chart data from server payload ---
watchEffect(() => {
  const payload = chartPayload.value
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
  if (trend.value?.line) {
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
  chartData.value = { labels: payload.labels || [], datasets }
  chartOptions.value.plugins.annotation.annotations.line1.xMin = payload.annotationIndex
  chartOptions.value.plugins.annotation.annotations.line1.xMax = payload.annotationIndex
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
function formatTrendDistance(n) {
  const v = Number(n || 0)
  return `${v < 0 ? '' : v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
}
</script>
