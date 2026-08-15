<template>
  <UCard class="h-full border border-zinc-800 bg-zinc-900">
    <template #header>
      <h2 class="font-semibold text-white">{{ cardTitle }}</h2>
    </template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Profit (PLB)</p>

          <p class="mt-1 text-xl font-semibold" :class="profitClass">
            {{ formatUnit(metricsData.plb) }}
          </p>
        </div>

        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">ROI</p>

          <p class="mt-1 text-xl font-semibold" :class="roiClass">
            {{ formatPercent(metricsData.roi) }}
          </p>

          <div class="mt-0.5">
            <MetricComparison :def="ROI_DEF" :real="normalized.roi" :val="normalizedCompare?.roi" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div v-for="m in metrics" :key="m.label">
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">{{ m.label }}</p>

          <div class="mt-0.5 flex items-center gap-1">
            <p class="text-sm font-medium text-white">{{ m.value }}</p>

            <MetricComparison :def="m.def" :real="m.raw" :val="m.compareRaw" />
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  metricsData: {
    type: Object,
    required: true,
  },
  cardTitle: {
    type: String,
    required: true,
  },
  compareWith: {
    type: Object,
    default: null,
  },
})

function calcLucroEfetivo(m) {
  if (!m || m.medLoss === 0) return 0
  return (m.ev / -m.medLoss) * 100
}

function normalizeMetrics(m) {
  if (!m) return null
  return {
    plb: m.plb,
    roi: m.roi,
    wr: m.wr,
    odds: m.odds,
    medGain: m.medGain,
    medLoss: m.medLoss,
    ev: m.ev,
    lucroEfetivo: calcLucroEfetivo(m),
    dd: m.dd,
    entradas: m.entradas,
  }
}

const ROI_DEF = { key: 'roi', label: 'ROI', format: formatPercent, deltaUnit: 'pp', comparable: true }

const METRIC_DEFS = [
  {
    key: 'wr',
    label: 'WR',
    format: (v) => formatPercent(v * 100, 0),
    deltaUnit: 'pp',
    deltaFactor: 100,
    comparable: true,
  },
  { key: 'odds', label: 'Odd média', format: formatNumber, comparable: false },
  { key: 'medGain', label: 'Win médio', format: formatUnit, deltaUnit: 'u', comparable: true },
  { key: 'medLoss', label: 'Loss médio', format: formatUnit, deltaUnit: 'u', comparable: true },
  { key: 'ev', label: 'EV', format: formatUnit, deltaUnit: 'u', comparable: true },
  { key: 'lucroEfetivo', label: 'Lucro efetivo', format: formatPercent, deltaUnit: 'pp', comparable: true },
  { key: 'dd', label: 'Máx DD', format: formatUnit, deltaUnit: 'u', comparable: true },
  { key: 'entradas', label: 'Entradas', format: String, comparable: false },
]

const normalized = computed(() => normalizeMetrics(props.metricsData))
const normalizedCompare = computed(() => normalizeMetrics(props.compareWith))

function signClass(v) {
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
}

const profitClass = computed(() => signClass(props.metricsData.plb))
const roiClass = computed(() => signClass(props.metricsData.roi))

const metrics = computed(() =>
  METRIC_DEFS.map((def) => ({
    label: def.label,
    value: def.format(normalized.value[def.key]),
    def,
    raw: normalized.value[def.key],
    compareRaw: normalizedCompare.value?.[def.key],
  })),
)
</script>
