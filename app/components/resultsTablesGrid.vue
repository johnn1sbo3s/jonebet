<template>
  <div class="grid grid-cols-2 gap-3">
    <UCard class="border border-zinc-800 bg-zinc-900">
      <template #header>
        <p class="font-semibold">Resultados por mês</p>
      </template>

      <p class="mb-3 text-sm">{{ monthlyResults.length }} meses</p>

      <UTable
        class="h-80"
        :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
        :data="monthlyResults"
        :columns="monthlyBetsColumns"
      />
    </UCard>

    <UCard class="border border-zinc-800 bg-zinc-900">
      <template #header>
        <p class="font-semibold">Resultados por dia</p>
      </template>

      <p class="mb-3 text-sm">{{ dailyResults.length }} dias</p>

      <UTable
        class="h-80"
        :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
        :data="dailyResults"
        :columns="dailyBetsColumns"
      />
    </UCard>
  </div>
</template>

<script setup>
defineProps({
  monthlyResults: { type: Array, required: true },
  dailyResults: { type: Array, required: true },
})

const dailyBetsColumns = [
  { id: 'date', accessorKey: 'date', header: 'Dia' },
  { id: 'gain', accessorKey: 'gain', header: 'Lucro' },
  { id: 'gameCount', accessorKey: 'gameCount', header: 'Jogos' },
  { id: 'accumulated', accessorKey: 'accumulated', header: 'Acumulado' },
]
const monthlyBetsColumns = [
  { id: 'monthYear', accessorKey: 'monthYear', header: 'Mês' },
  { id: 'profit', accessorKey: 'profit', header: 'Lucro' },
  { id: 'gameCount', accessorKey: 'gameCount', header: 'Jogos' },
  { id: 'accumulated', accessorKey: 'accumulated', header: 'Acumulado' },
]
</script>
