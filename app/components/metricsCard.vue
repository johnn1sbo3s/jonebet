<template>
  <UCard class="h-full border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold text-white">{{ cardTitle }}</p>
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
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div v-for="m in metrics" :key="m.label">
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">{{ m.label }}</p>

          <p class="mt-0.5 text-sm font-medium text-white">{{ m.value }}</p>
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
})

const lucroEfetivo = computed(() => {
  if (props.metricsData.medLoss === 0) return 0
  return (props.metricsData.ev / -props.metricsData.medLoss) * 100
})

const profitClass = computed(() => {
  const v = props.metricsData.plb
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
})

const roiClass = computed(() => {
  const v = props.metricsData.roi
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
})

const metrics = computed(() => [
  { label: 'WR', value: formatPercent(props.metricsData.wr * 100, 0) },
  { label: 'Odd média', value: formatNumber(props.metricsData.odds) },
  { label: 'Win médio', value: formatUnit(props.metricsData.medGain) },
  { label: 'Loss médio', value: formatUnit(props.metricsData.medLoss) },
  { label: 'EV', value: formatUnit(props.metricsData.ev) },
  { label: 'Lucro efetivo', value: formatPercent(lucroEfetivo.value) },
  { label: 'Máx DD', value: formatUnit(props.metricsData.dd) },
  { label: 'Entradas', value: String(props.metricsData.entradas) },
])
</script>
