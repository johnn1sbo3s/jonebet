<template>
  <UCard class="h-full w-full border border-zinc-800 bg-zinc-950/80">
    <template #header>
      <p class="font-semibold text-white">Detalhes</p>
    </template>

    <template #default>
      <div class="flex flex-col gap-2">
        <div class="flex justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 align-middle text-sm">
          <div class="text-zinc-300">Apostas</div>

          <div class="font-semibold text-white">{{ numberBets }}</div>
        </div>

        <div class="flex justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 align-middle text-sm">
          <div class="text-zinc-300">Modelos com apostas</div>

          <div class="font-semibold text-white">{{ numberModels }}</div>
        </div>

        <div class="flex justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 align-middle text-sm">
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
  positiveModels: { type: Number, required: true, default: () => 0 },
})
</script>
