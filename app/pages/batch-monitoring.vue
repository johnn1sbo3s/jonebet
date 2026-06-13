<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between">
      <PageHeader title="Monitoramento em lotes" />
    </div>

    <UInput v-model="filterString" class="w-1/5" variant="outline" placeholder="Buscar modelo" />

    <div v-if="sortedSanitizedData.length" class="flex w-147.5 justify-between pl-0.5">
      <p class="text-sm text-zinc-400">{{ sortedSanitizedData.length }} modelos</p>

      <i
        v-if="!invertOrder"
        class="i-lucide-arrow-down-a-z text-xl text-zinc-400 hover:cursor-pointer"
        @click="invertCardsOrder"
      />

      <i v-else class="i-lucide-arrow-up-a-z text-xl text-zinc-400 hover:cursor-pointer" @click="invertCardsOrder" />
    </div>

    <div v-else class="h-5 w-full" />

    <div class="flex gap-4">
      <div class="flex justify-between">
        <div v-if="!sortedSanitizedData.length" class="flex h-20 w-147.25 items-center justify-center">
          <i>Nenhum modelo encontrado</i>
        </div>

        <div class="max-h-screen-80 flex flex-col gap-4 overflow-auto p-0.5 pr-4">
          <BatchCard
            v-for="item in sortedSanitizedData"
            :key="item._id"
            :class="item._id === chosenModel._id ? 'outline outline-teal-400' : ''"
            :metric-item="item"
            :selected-id="chosenModel._id"
            @click="chosenModel = item"
          />
        </div>
      </div>

      <div
        v-if="!chosenModel._id"
        class="flex h-130 w-full items-center justify-center rounded-md p-10 outline-1 outline-zinc-700 outline-dashed"
      >
        <p class="text-center text-2xl text-zinc-500">
          Selecione um card ao lado para ver o gráfico de acúmulo de capital do modelo.
        </p>
      </div>

      <UCard v-else class="h-min w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <p class="font-semibold">{{ chosenModel.modelo }}</p>

              <NuxtLink :to="`performance/${modelNameToIdName(chosenModel.modelo)}`">
                <UButton color="primary" size="xs" variant="solid">Ver Performance</UButton>
              </NuxtLink>
            </div>

            <UButton color="blue" variant="soft" @click="resetsZoom"> Restaurar zoom </UButton>
          </div>
        </template>

        <div class="flex flex-col gap-3">
          <LineChart :key="chartKey" :chart-data="chartData" :options="chartOptions" :style="chartStyle" />

          <UTable
            class="max-h-screen-30"
            :ui="{
              wrapper: 'relative overflow-x-auto border border-zinc-800 rounded-xl',
              th: 'bg-zinc-950 text-zinc-400 text-xs uppercase',
              td: 'border-t border-zinc-800 text-zinc-300',
            }"
            :rows="chosenModel.blocks"
            :columns="blocksTableColumns"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { Chart, registerables } from 'chart.js'
import { LineChart } from 'vue-chart-3'

// Variáveis reativas
const runtimeConfig = useRuntimeConfig()
const apiUrl = runtimeConfig.public.API_URL

// Fetch the list of models to get ids + display names
const { data: modelsList } = await useModelsList({ playedOn: null })
const modelIds = computed(() => (modelsList.value?.items || []).map((m) => m.id))
const modelNamesById = computed(() => {
  const map = {}
  for (const m of modelsList.value?.items || []) {
    map[m.id] = m.name
  }
  return map
})

// Fetch each model's full data in parallel; Nuxt/useAsyncData cache by key
const { data: modelsMap } = await useAsyncData(
  'batch-monitoring-models',
  async () => {
    const results = await Promise.all(
      modelIds.value.map(async (id) => {
        const d = await $fetch(`${apiUrl}/models/${id}`)
        return [id, d]
      }),
    )
    return Object.fromEntries(results)
  },
  { watch: [modelIds] },
)

const data = computed(() => {
  const map = modelsMap.value || {}
  return Object.entries(map).map(([id, m]) => ({
    _id: id,
    modelo: modelNamesById.value[id] ?? m?.modelo ?? '',
    total: {
      currentMean: m?.metrics?.total?.currentMean ?? 0,
      ev: m?.metrics?.total?.ev ?? 0,
      mean: m?.metrics?.total?.mean ?? 0,
      currentGameCount: m?.metrics?.total?.currentGameCount ?? 0,
      blocks_history: m?.blocksHistory ?? [],
      confidenceInterval: m?.metrics?.total?.confidenceInterval ?? [0, 0],
      pl_history: m?.metrics?.total?.pl_history ?? [],
    },
  }))
})
const chosenModel = ref({})
const chartKey = ref(0)
const filterString = ref('')
const invertOrder = ref(false)
const blocksTableColumns = [
  { id: 'gameCount', label: 'Qtd. jogos', key: 'gameCount' },
  { id: 'profit', label: 'Profit', key: 'profit' },
  { id: 'roi', label: 'ROI', key: 'roi' },
  { id: 'endDate', label: 'Último dia do bloco', key: 'endDate' },
]

if (import.meta.client) {
  const zoomPlugin = (await import('chartjs-plugin-zoom')).default
  const annotationPlugin = (await import('chartjs-plugin-annotation')).default
  Chart.register(zoomPlugin)
  Chart.register(annotationPlugin)
  Chart.register(...registerables)
}

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  transitions: {
    zoom: {
      animation: {
        duration: 1000,
        easing: 'easeOutCubic',
      },
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      display: true,
    },
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'x',
        drag: {
          enabled: true,
          borderColor: 'rgb(20 184 166)',
          borderWidth: 1,
          backgroundColor: 'rgba(20, 184, 166, 0.15)',
        },
      },
      pan: {
        enabled: true,
        mode: 'x',
        modifierKey: 'ctrl',
      },
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

const chartStyle = ref({
  height: '400px',
  width: '100%',
})

// Variáveis computadas
const sortedSanitizedData = computed(() => {
  const orderDirection = invertOrder.value ? 'asc' : 'desc'
  let sorted = _orderBy(data.value, ['total.currentGameCount'], [orderDirection])
  sorted = sorted.filter((item) =>
    modelNameToNaturalName(item.modelo).toLowerCase().includes(filterString.value.toLowerCase()),
  )

  return sorted.map((item) => ({
    _id: item._id,
    modelo: modelNameToNaturalName(item.modelo),
    profit: (item.total.currentMean * 100).toFixed(2).toLocaleString('pt-BR'),
    ev: item.total.ev.toFixed(2).toLocaleString('pt-BR'),
    media_profit: (item.total.mean * 100).toFixed(2).toLocaleString('pt-BR'),
    qtd_jgs: item.total.currentGameCount,
    last_block_day: item.total.blocks_history?.at(-2)?.endDate,
    bottom_int_conf: (item.total.confidenceInterval[0] * 100).toFixed(2).toLocaleString('pt-BR'),
    top_int_conf: (item.total.confidenceInterval[1] * 100).toFixed(2).toLocaleString('pt-BR'),
    blocks: item.total.blocks_history,
    qtd_blocks: item.total.blocks_history?.length - 1,
    pl_history: item.total.pl_history,
  }))
})

const chartData = computed(() => {
  if (!chosenModel.value.pl_history) {
    return {}
  }

  const profits = chosenModel.value.pl_history.map((item) => item.Profit)
  const data = profits.reduce((acc, curr, index) => {
    if (index === 0) {
      return [curr]
    }

    return [...acc, curr + acc[index - 1]]
  }, [])

  const labels = Array.from({ length: data.length }, (_, i) => i + 1)

  return {
    labels: labels,
    datasets: [
      {
        label: 'Acúmulo de capital',
        data: data,
        borderColor: '#25D88B',
        backgroundColor: 'rgb(37, 216, 139, 0.05)',
        pointRadius: 1,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.2,
      },
    ],
  }
})

// Métodos
function resetsZoom() {
  chartKey.value++
}
function invertCardsOrder() {
  invertOrder.value = !invertOrder.value
}
</script>

<style lang="css" scoped>
.max-h-screen-80 {
  max-height: 80vh;
}

.max-h-screen-30 {
  max-height: 30vh;
}
</style>
