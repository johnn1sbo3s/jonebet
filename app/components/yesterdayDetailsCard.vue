<template>
  <UCard class="w-full h-full bg-zinc-900 border border-zinc-800">
    <template #header>
      <p class="font-semibold text-white">Detalhes</p>
    </template>

    <template #default>
      <div class="flex flex-col gap-4">
        <div class="flex align-middle justify-between">
          <div class="text-zinc-300">Apostas</div>

          <div class="font-semibold text-white">{{ numberBets }}</div>
        </div>

        <div class="flex align-middle justify-between">
          <div class="text-zinc-300">Modelos com apostas</div>

          <div class="font-semibold text-white">{{ numberModels }}</div>
        </div>

        <div class="flex align-middle justify-between">
          <div class="text-zinc-300">Modelos positivos</div>

          <div class="font-semibold text-teal-500">{{ positiveModels }}</div>
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
