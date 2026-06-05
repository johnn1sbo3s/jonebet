<template>
  <UCard class="w-full h-full bg-[#1a1a1a] border border-[#2a2a2a]">
    <template #header>
      <p class="font-semibold text-white">Métricas</p>
    </template>

    <template #default>
      <div class="flex justify-between">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="flex flex-col justify-center"
        >
          <p class="text-[#888888] text-sm">{{ item.name }}</p>

          <p
            class="text-xl font-black"
            :class="item.value >= 0 ? 'text-[#14B8A6]' : 'text-[#ef4444]'"
          >
            {{ item.value.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }} {{ item.sufix }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <p class="text-xs text-[#5a5a5a]">1 un = 1% da banca</p>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
    items: {
        type: Array,
        required: true,
        default: () => []
    }
})
</script>
