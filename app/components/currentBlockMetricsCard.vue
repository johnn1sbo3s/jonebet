<template>
  <UCard class="h-full border border-zinc-800 bg-zinc-950/80">
    <template #header>
      <p class="font-semibold">{{ cardTitle }}</p>
    </template>

    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Profit</p>

          <p class="mt-1 text-xl font-semibold" :class="profitClass">
            {{ formatNumber(metricsData.media_atual) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Desvpad</p>

          <p class="mt-0.5 text-sm font-medium text-white">
            {{ formatNumber(metricsData.desvpad_atual) }}
          </p>
        </div>

        <div>
          <p class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Jogos</p>

          <p class="mt-0.5 text-sm font-medium text-white">{{ metricsData.qtd_jgs_atual.toFixed(0) }}</p>
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

const formatNumber = (n, decimals = 2) =>
  Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })

const profitClass = computed(() => {
  const v = props.metricsData.media_atual
  if (v > 0) return 'text-teal-400'
  if (v < 0) return 'text-red-400'
  return 'text-white'
})
</script>
