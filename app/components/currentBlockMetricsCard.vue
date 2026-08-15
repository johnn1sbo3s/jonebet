<template>
  <UCard class="border border-zinc-800 bg-zinc-950/80">
    <template #header>
      <h3 class="font-semibold">{{ cardTitle }}</h3>
    </template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Profit</p>

          <p class="mt-1 text-xl font-semibold" :class="profitClass">
            {{ formatUnit(metricsData.currentMean) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Desvpad</p>

          <p class="mt-0.5 text-sm font-medium text-white">
            {{ formatUnit(metricsData.currentStdDev) }}
          </p>
        </div>

        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Jogos</p>

          <p class="mt-0.5 text-sm font-medium text-white">
            {{ Number(metricsData.currentGameCount || 0).toFixed(0) }}
          </p>
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

const profitClass = computed(() => {
  const v = props.metricsData.currentMean
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
})
</script>
