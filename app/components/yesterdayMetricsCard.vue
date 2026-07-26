<template>
  <UCard
    class="h-full w-full border border-zinc-800 bg-zinc-950/80"
    :ui="{ root: 'flex flex-col h-full', body: 'flex-1' }"
  >
    <template #header>
      <p class="font-semibold text-white">Métricas</p>
    </template>

    <template #default>
      <div class="flex items-center justify-between">
        <div v-for="(item, index) in items" :key="index" class="flex flex-col justify-center">
          <p class="text-sm text-zinc-400">{{ item.name }}</p>

          <p class="text-xl font-black" :class="item.value >= 0 ? 'text-teal-500' : 'text-red-500'">
            {{ formatNumber(item.value, item.decimals ?? 2)
            }}<span v-if="item.unit" class="ml-0.5 text-sm font-semibold">{{ item.unit }}</span>
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <p class="text-xs text-zinc-500">Considerando stake = 1% da banca</p>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>
