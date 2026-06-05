<template>
  <UCard
    class="w-full h-full bg-zinc-950/80 border border-zinc-800"
    :ui="{ root: 'flex flex-col h-full', body: 'flex-1' }"
  >
    <template #header>
      <p class="font-semibold text-white">Métricas</p>
    </template>

    <template #default>
      <div class="flex justify-between items-center">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="flex flex-col justify-center"
        >
          <p class="text-zinc-400 text-sm">{{ item.name }}</p>

          <p
            class="text-xl font-black"
            :class="item.value >= 0 ? 'text-teal-500' : 'text-red-500'"
          >
            {{ item.value.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }} {{ item.sufix }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <p class="text-xs text-zinc-500">1 un = 1% da banca</p>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
    items: {
        type: Array,
        required: true,
    }
})
</script>
