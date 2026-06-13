<template>
  <UCard id="block-metrics" class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Resultados por blocos de 100 jogos</p>
    </template>

    <div class="grid h-full grid-cols-[2fr_3fr] gap-3">
      <div class="grid grid-rows-2 content-start gap-3">
        <BlockMetricsCard :metrics-data="metricsTotal" :card-title="'Médias'" />

        <CurrentBlockMetricsCard :metrics-data="metricsTotal" :card-title="'Bloco atual'" />
      </div>

      <div class="relative min-h-0">
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
