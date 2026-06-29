<template>
  <UCard class="border border-zinc-800 bg-zinc-950/80">
    <template #header>
      <p class="font-semibold">{{ cardTitle }}</p>
    </template>

    <div class="flex flex-col gap-4">
      <div class="grid min-w-0 grid-cols-2 gap-4 border-b border-zinc-800 pb-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Média P/L</p>

          <p class="mt-1 text-xl font-semibold" :class="mediaClass">
            {{ formatUnit(metricsData.mean) }}
          </p>
        </div>
      </div>

      <div class="grid min-w-0 grid-cols-2 gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Desvpad</p>

          <p class="mt-0.5 text-sm font-medium text-white">{{ formatUnit(metricsData.stdDev) }}</p>
        </div>

        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Méd/Desvpad</p>

          <p class="mt-0.5 text-sm font-medium text-white">{{ formatUnit(metricsData.meanStdDev) }}</p>
        </div>

        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Dif. valid.</p>

          <p class="mt-0.5 text-sm font-medium" :class="difValidClass">
            {{ formatUnit(metricsData.diffMeanStdDev96Sqrt) }}
          </p>
        </div>

        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Int. conf.</p>

          <p class="mt-0.5 text-sm font-medium text-white">
            {{ formatUnit(metricsData.confidenceInterval?.[0]) }} →
            {{ formatUnit(metricsData.confidenceInterval?.[1]) }}
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

const signClass = (v) => {
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
}

const mediaClass = computed(() => signClass(props.metricsData.mean))
const difValidClass = computed(() => signClass(props.metricsData.diffMeanStdDev96Sqrt))
</script>
