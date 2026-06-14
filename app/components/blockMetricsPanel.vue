<template>
  <UCard id="block-metrics" class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Resultados por blocos de 100 jogos</p>
    </template>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_3fr]">
      <BlockMetricsCard
        class="min-w-0 lg:col-start-1 lg:row-start-1"
        :metrics-data="metricsTotal"
        :card-title="'Médias'"
      />

      <CurrentBlockMetricsCard
        class="min-w-0 lg:col-start-1 lg:row-start-2"
        :metrics-data="metricsTotal"
        :card-title="'Bloco atual'"
      />

      <div class="relative min-h-75 sm:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0">
        <BlocksHistoryList class="absolute inset-0" :blocks="blocksHistory" />
      </div>
    </div>
  </UCard>
</template>

<script setup>
defineProps({
  metricsTotal: {
    type: Object,
    required: true,
  },
  blocksHistory: {
    type: Array,
    required: true,
  },
})
</script>
