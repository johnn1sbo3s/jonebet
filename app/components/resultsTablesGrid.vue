<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
    <MonthlyResultsList :results="monthlyResults" />

    <UCard class="border border-zinc-800 bg-zinc-900">
      <template #header>
        <h2 class="font-semibold">Resultados por dia</h2>
      </template>

      <p class="mb-3 text-sm">{{ dailyResults.length }} dias</p>

      <UTable
        class="h-80"
        :ui="{
          wrapper: 'relative overflow-x-auto overflow-y-auto border border-muted rounded-lg',
          thead: 'sticky top-0 z-10',
          th: 'bg-zinc-950',
        }"
        :data="reversedDailyResults"
        :columns="dailyBetsColumns"
      >
        <template #date-cell="{ row }">
          {{ formatDate(row.original.date) }}
        </template>

        <template #gain-cell="{ row }">
          {{ formatUnit(row.original.gain) }}
        </template>

        <template #accumulated-cell="{ row }">
          {{ formatUnit(row.original.accumulated) }}
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
const props = defineProps({
  monthlyResults: { type: Array, required: true },
  dailyResults: { type: Array, required: true },
})

const reversedDailyResults = computed(() => [...props.dailyResults].reverse())

const dailyBetsColumns = [
  { id: 'date', accessorKey: 'date', header: 'Dia' },
  { id: 'gain', accessorKey: 'gain', header: 'Lucro' },
  { id: 'accumulated', accessorKey: 'accumulated', header: 'Acumulado' },
  { id: 'gameCount', accessorKey: 'gameCount', header: 'Jogos' },
]
</script>
