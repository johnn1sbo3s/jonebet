<template>
  <UCard class="w-full h-full bg-zinc-950/80 border border-zinc-800">
    <template #header>
      <p class="font-semibold text-white">Detalhes</p>
    </template>

    <template #default>
      <div class="flex flex-col gap-2">
        <div class="flex align-middle justify-between bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm">
          <div class="text-zinc-300">Apostas</div>

          <div class="font-semibold text-white">{{ numberBets }}</div>
        </div>

        <div class="flex align-middle justify-between bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm">
          <div class="text-zinc-300">Modelos com apostas</div>

          <div class="font-semibold text-white">{{ numberModels }}</div>
        </div>

        <div class="flex align-middle justify-between bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm">
          <div class="text-zinc-300">Modelos positivos</div>

          <div class="font-semibold text-white">{{ positiveModels }}</div>
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
