<template>
  <UCard class="h-full">
    <template #header>
      <p class="font-semibold">{{ cardTitle }}</p>
    </template>
    <div class="grid grid-cols-2 text-sm gap-y-5">
      <div class="flex gap-1">
        <p class="font-semibold">Média P/L:</p>
        <p>{{ metricsData.media.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
      </div>
      <div class="flex gap-1">
        <p class="font-semibold">Desvpad:</p>
        <p>{{ metricsData.desvpad.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
      </div>
      <div class="flex gap-1">
        <p class="font-semibold">Méd/Desvpad:</p>
        <p>{{ metricsData.med_dp.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
      </div>
      <div class="flex gap-1">
        <p class="font-semibold">Dif. valid.:</p>
        <p>{{ metricsData.diff_med_dp_um_96_raiz.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
      </div>
      <div class="flex gap-1">
        <p class="font-semibold">Int. conf.:</p>
        <p>
          {{ metricsData.intervalo_confianca[0].toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }} a
          {{ metricsData.intervalo_confianca[1].toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps(["metricsData", "cardTitle"]);
</script>