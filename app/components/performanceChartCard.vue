<template>
  <UCard id="model-chart" class="order-1 border border-zinc-800 bg-zinc-900 xl:order-2 xl:col-span-7">
    <template #header>
      <div class="flex justify-between">
        <h2 class="font-semibold">Gráfico de acúmulo de capital</h2>

        <div class="hidden items-center gap-4 sm:flex">
          <div class="flex items-center gap-2">
            <USwitch v-model="chartByDay" size="md" checked-icon="i-lucide-check" unchecked-icon="i-lucide-x" />

            <p class="text-sm">Exibição por dia</p>
          </div>

          <UButton color="secondary" variant="soft" size="sm" @click="resetsZoom">Restaurar zoom</UButton>
        </div>
      </div>
    </template>

    <div>
      <div class="mb-3 flex flex-wrap items-center justify-end gap-3 sm:hidden">
        <div class="flex items-center gap-2">
          <USwitch v-model="chartByDay" size="md" checked-icon="i-lucide-check" unchecked-icon="i-lucide-x" />

          <p class="text-sm">Exibição por dia</p>
        </div>

        <UButton color="secondary" variant="soft" size="sm" @click="resetsZoom">Restaurar zoom</UButton>
      </div>

      <ClientOnly>
        <LineChart :key="chartKey" class="w-full" :chart-data="chartData" :options="chartOptions" :style="chartStyle" />

        <template #fallback>
          <div class="w-full" :style="chartStyle" />
        </template>
      </ClientOnly>

      <div class="mt-3 border-t border-zinc-800 pt-3">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-if="!chartByDay && trend && trend.slope != 0">
            <div class="flex items-center gap-1">
              <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                Inclinação<span class="text-zinc-600">/aposta</span>
              </p>

              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-info"
                color="neutral"
                aria-label="O que é Inclinação?"
                class="-mt-0.5 cursor-pointer p-0 text-zinc-700 hover:text-zinc-400"
                @click="showSlopeInfo = true"
              />
            </div>

            <p class="mt-0.5 text-base font-medium" :class="slopeClass">{{ formatNumber(trend.slope) }}</p>
          </div>

          <div v-if="!chartByDay && r2 != null">
            <div class="flex items-center gap-1">
              <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">R²</p>

              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-info"
                color="neutral"
                aria-label="O que é R²?"
                class="-mt-0.5 cursor-pointer p-0 text-zinc-700 hover:text-zinc-400"
                @click="showR2Info = true"
              />
            </div>

            <p class="mt-0.5 text-base font-medium text-white">{{ r2.toFixed(4) }}</p>
          </div>

          <div v-if="totalAccumulated != null">
            <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Total acumulado</p>

            <p class="mt-0.5 text-base font-medium" :class="totalAccumulatedClass">
              {{ formatUnit(totalAccumulated) }}
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
            Máx: <span class="font-semibold text-red-400">{{ formatUnit(maxDrawdown) }}</span>
          </p>
        </div>

        <ClientOnly>
          <LineChart
            :key="`dd-${chartKey}`"
            class="w-full"
            :chart-data="drawdownChartData"
            :options="drawdownOptions"
            :style="{ height: '72px' }"
          />

          <template #fallback>
            <div class="w-full" :style="{ height: '72px' }" />
          </template>
        </ClientOnly>
      </div>

      <div v-if="dailyStats" class="mt-3 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3 sm:grid-cols-3">
        <div>
          <div class="flex items-center gap-1">
            <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Sharpe<span class="text-zinc-600">/ano</span>
            </p>

            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-info"
              color="neutral"
              aria-label="O que é Sharpe anualizado?"
              class="-mt-0.5 cursor-pointer p-0 text-zinc-700 hover:text-zinc-400"
              @click="showSharpeInfo = true"
            />
          </div>

          <p class="mt-0.5 text-base font-medium" :class="sharpeClass">{{ formatNumber(dailyStats.sharpe) }}</p>
        </div>

        <div>
          <div class="flex items-center gap-1">
            <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Streak atual</p>

            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-info"
              color="neutral"
              aria-label="O que é Streak atual?"
              class="-mt-0.5 cursor-pointer p-0 text-zinc-700 hover:text-zinc-400"
              @click="showStreakInfo = true"
            />
          </div>

          <p class="mt-0.5 text-base font-medium" :class="streakClass">{{ dailyStats.streak }}</p>
        </div>

        <div>
          <div class="flex items-center gap-1">
            <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">% dias negativos</p>

            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-info"
              color="neutral"
              aria-label="O que é % dias negativos?"
              class="-mt-0.5 cursor-pointer p-0 text-zinc-700 hover:text-zinc-400"
              @click="showNegativeDaysInfo = true"
            />
          </div>

          <p class="mt-0.5 text-base font-medium text-white">{{ formatPercent(dailyStats.pctNegative, 1) }}</p>
        </div>
      </div>

      <UModal v-model:open="showSlopeInfo" title="Inclinação">
        <template #body>
          <p class="text-sm leading-relaxed text-zinc-300">
            Mede quanto o capital acumulado cresce a cada aposta. É a inclinação da linha de tendência do gráfico (OLS
            sobre o cumulativo por aposta).
          </p>

          <p class="mt-3 text-sm leading-relaxed text-zinc-300">
            Valores positivos indicam tendência de alta; negativos, de baixa. Quanto maior o módulo, mais agressiva a
            tendência.
          </p>
        </template>
      </UModal>

      <UModal v-model:open="showR2Info" title="R²">
        <template #body>
          <p class="text-sm leading-relaxed text-zinc-300">
            Indica o quanto da variação do capital acumulado é explicada pela linha de tendência. Varia de 0 a 1.
          </p>

          <p class="mt-3 text-sm leading-relaxed text-zinc-300">
            Quanto mais próximo de 1, mais linear e consistente é o crescimento. Valores baixos não significam que o
            modelo é ruim — apenas que a tendência é ruidosa.
          </p>
        </template>
      </UModal>

      <UModal v-model:open="showSharpeInfo" title="Sharpe anualizado">
        <template #body>
          <p class="text-sm leading-relaxed text-zinc-300">
            Mede o retorno médio por unidade de risco dos resultados diários, anualizado. Quanto maior, melhor — indica
            que o modelo gera mais lucro por unidade de volatilidade.
          </p>

          <p class="mt-3 text-sm leading-relaxed text-zinc-300">
            Acima de 1 é considerado bom; acima de 2, muito bom. Valores negativos indicam que o modelo perde dinheiro
            em média.
          </p>
        </template>
      </UModal>

      <UModal v-model:open="showStreakInfo" title="Streak atual">
        <template #body>
          <p class="text-sm leading-relaxed text-zinc-300">
            Sequência consecutiva mais recente de vitórias (W) ou derrotas (L). Indica o momento atual do modelo — se
            está em uma fase positiva ou negativa.
          </p>

          <p class="mt-3 text-sm leading-relaxed text-zinc-300">
            Dias com ganho zero (sem apostas) são ignorados na contagem.
          </p>
        </template>
      </UModal>

      <UModal v-model:open="showNegativeDaysInfo" title="% dias negativos">
        <template #body>
          <p class="text-sm leading-relaxed text-zinc-300">
            Porcentagem de dias em que o modelo fechou no prejuízo. Quanto menor, melhor — mostra a consistência do
            modelo ao longo do tempo.
          </p>

          <p class="mt-3 text-sm leading-relaxed text-zinc-300">
            Dias sem apostas (ganho zero) são contabilizados no total, o que dilui o indicador em modelos com calendário
            irregular.
          </p>
        </template>
      </UModal>
    </div>
  </UCard>
</template>

<script setup>
import { lineChartComponent } from '~/utils/chartSetup'
import { formatDate } from '~/utils/formatDate'
import { TRADING_DAYS_PER_YEAR } from '~/utils/enums'
import { splitAccumulation } from '~/utils/accumulationSplit'
import { usePerformanceChartOptions, useStaticLineOptions } from '~/composables/useChartOptions'

// Colors per phase — validation (blue) vs real (teal), on the dark canvas.
// The real phase reuses the brand teal (matches the positive-profit card
// color); validation uses the app's blue token so the two are distinguishable.
const VALIDATION_COLOR = '#3b82f6' // azul (validação)
const VALIDATION_BG = 'rgba(59, 130, 246, 0.14)'
const REAL_COLOR = '#2dd4bf' // teal (real)
const REAL_BG = 'rgba(45, 212, 191, 0.14)'

const LineChart = lineChartComponent()

const props = defineProps({
  chosenModelId: { type: String, required: true },
  dailyResults: { type: Array, required: true },
  dailyResultsPending: { type: Boolean, required: true },
})

const chartByDay = defineModel('chartByDay', { type: Boolean, default: false })

const groupBy = computed(() => (chartByDay.value ? 'day' : 'bet'))

// Wrap chosenModelId as a ref so the composables re-fetch on model change.
const chosenModelIdRef = toRef(props, 'chosenModelId')

const { data: chartPayload, pending: chartPending } = useModelChart(chosenModelIdRef, groupBy)
const { data: trend, pending: trendPending } = useModelTrend(
  chosenModelIdRef,
  computed(() => !chartByDay.value),
)

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
  if (props.dailyResultsPending) return null
  const days = props.dailyResults
  if (!days || !days.length) return null
  const start = days[0].date
  const end = days[days.length - 1].date
  return `${formatDate(start, { style: 'short' })} → ${formatDate(end, { style: 'short' })}`
})

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
const drawdownOptions = useStaticLineOptions()

// --- Risk stats (computed from the daily results series) ---
const dailyStats = computed(() => {
  if (props.dailyResultsPending) return null
  const days = props.dailyResults
  if (!days || !days.length) return null
  const gains = days.map((d) => Number(d.gain) || 0)
  const negativeDays = gains.filter((g) => g < 0).length
  const pctNegative = (negativeDays / gains.length) * 100
  const mean = gains.reduce((a, b) => a + b, 0) / gains.length
  const variance = gains.reduce((a, b) => a + (b - mean) ** 2, 0) / gains.length
  const std = Math.sqrt(variance)
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(TRADING_DAYS_PER_YEAR) : 0
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
    sharpe,
    streak: streak ? `${streak}${streakType}` : '—',
    pctNegative,
  }
})
const sharpeClass = computed(() => {
  if (!dailyStats.value) return 'text-white'
  const v = dailyStats.value.sharpe
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

function resetsZoom() {
  chartKey.value++
}

const chartData = computed(() => {
  if (chartPending.value) return { labels: [], datasets: [] }
  const payload = chartPayload.value
  if (!payload || !payload.data) return { labels: [], datasets: [] }
  const data = payload.data || []

  const datasets = []
  const { valData, realData, split } = splitAccumulation(data, payload.annotationIndex ?? 0)
  if (split) {
    // Two series share the boundary point so the line stays connected, and the
    // legend gets a clear "Validação" / "Real" entry for each phase.
    datasets.push(
      {
        label: 'Validação',
        data: valData,
        borderColor: VALIDATION_COLOR,
        backgroundColor: VALIDATION_BG,
        pointRadius: 1,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Real',
        data: realData,
        borderColor: REAL_COLOR,
        backgroundColor: REAL_BG,
        pointRadius: 1,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.2,
      },
    )
  } else {
    // No split info → single series in the brand teal (keeps the previous
    // one-line look; tests rely on this fallback for annotationIndex 0).
    datasets.push({
      label: 'Acúmulo de capital',
      data,
      borderColor: REAL_COLOR,
      backgroundColor: REAL_BG,
      pointRadius: 1,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.2,
    })
  }

  if (trend.value?.line?.length) {
    datasets.push({
      label: 'Linha de tendência',
      data: trend.value.line,
      borderColor: 'rgba(212, 212, 216, 0.45)',
      borderWidth: 2,
      borderDash: [6, 4],
      backgroundColor: 'rgba(212, 212, 216, 0)',
      pointRadius: 0,
      pointHoverRadius: 7,
      fill: false,
      tension: 0.2,
    })
  }
  const labels = chartByDay.value
    ? (payload.labels || []).map((d) => formatDate(d, { style: 'short' }))
    : payload.labels || []
  return { labels, datasets }
})

const chartOptions = computed(() =>
  usePerformanceChartOptions({
    annotationIndex: chartPayload.value?.annotationIndex,
    xAxisTitle: chartPayload.value?.labels?.length ? (chartByDay.value ? 'Data' : 'Nº da aposta') : null,
  }),
)

// Remount the chart when the model or grouping changes so the
// internal zoom/pan state is reset (and pending state shows empty).
watch([chosenModelIdRef, groupBy], () => {
  chartKey.value++
})

// --- Info modals for the risk metrics ---
const showSlopeInfo = ref(false)
const showR2Info = ref(false)
const showSharpeInfo = ref(false)
const showStreakInfo = ref(false)
const showNegativeDaysInfo = ref(false)
</script>
