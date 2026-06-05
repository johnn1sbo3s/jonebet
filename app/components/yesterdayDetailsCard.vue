<template>
  <UCard class="w-full h-full bg-[#1a1a1a] border border-[#2a2a2a]">
    <template #header>
      <p class="font-semibold text-white">Detalhes</p>
    </template>

    <template #default>
      <div class="flex flex-col gap-4">
        <div class="flex align-middle justify-between">
          <div class="text-[#cccccc]">Apostas</div>

          <div class="font-semibold text-white">{{ numberBets }}</div>
        </div>

        <div class="flex align-middle justify-between">
          <div class="text-[#cccccc]">Modelos com apostas</div>

          <div class="font-semibold text-white">{{ numberModels }}</div>
        </div>

        <div class="flex align-middle justify-between">
          <div class="text-[#cccccc]">Modelos positivos</div>

          <div class="font-semibold text-[#14B8A6]">{{ positiveModels }}</div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
    numberModels: { type: Number, required: true, default: () => 0 },
    numberBets: { type: Number, required: true, default: () => 0 },
    positiveModels: { type: Number, required: true, default: () => 0 }
})
</script>
