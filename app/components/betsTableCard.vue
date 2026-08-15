<template>
  <UCard class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <h2 class="font-semibold">Jogos reais</h2>
    </template>

    <p class="mb-3 text-sm">{{ betsTotal }} jogos</p>

    <div class="hidden md:block">
      <UTable
        ref="tableRef"
        class="h-96"
        :ui="{
          wrapper: 'relative overflow-x-auto overflow-y-auto border border-muted rounded-lg',
          thead: 'sticky top-0 z-10',
          th: 'bg-zinc-950',
        }"
        :data="betsItems"
        :columns="allBetsDataFilteredColumns"
      >
        <template #date-cell="{ row }">
          {{ formatDate(row.original.date) }}
        </template>

        <template #odds-cell="{ row }">
          {{ formatNumber(row.original.odds) }}
        </template>

        <template #result-cell="{ row }">
          <span :class="row.original.result?.toLowerCase() === 'green' ? 'text-teal-400' : 'text-red-400'">
            {{ row.original.result ? row.original.result[0].toUpperCase() + row.original.result.slice(1) : '—' }}
          </span>
        </template>

        <template #profit-cell="{ row }">
          {{ formatUnit(row.original.profit) }}
        </template>
      </UTable>
    </div>

    <ul class="flex flex-col gap-3 md:hidden">
      <li v-for="bet in betsItems" :key="`${bet.date}-${bet.home}-${bet.away}-${bet.odds}`">
        <BetsListCard :bet="bet" />
      </li>
    </ul>

    <div class="flex justify-center pt-3">
      <UPagination
        class="max-md:[&_button]:h-10 max-md:[&_button]:min-w-10"
        :page="page"
        :items-per-page="betsSize"
        :total="betsTotal"
        @update:page="$emit('update:page', $event)"
      />
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  betsItems: { type: Array, required: true },
  betsTotal: { type: Number, required: true },
  page: { type: Number, required: true },
  betsTotalPages: { type: Number, required: true },
  betsSize: { type: Number, required: true },
})

defineEmits(['update:page'])

const tableRef = ref(null)

watch(
  () => props.page,
  () => {
    nextTick(() => {
      if (tableRef.value?.$el) tableRef.value.$el.scrollTop = 0
    })
  },
)

const allBetsDataFilteredColumns = [
  { id: 'date', accessorKey: 'date', header: 'Data' },
  { id: 'home', accessorKey: 'home', header: 'Casa' },
  { id: 'away', accessorKey: 'away', header: 'Fora' },
  { id: 'odds', accessorKey: 'odds', header: 'Odds' },
  { id: 'result', accessorKey: 'result', header: 'Resultado' },
  { id: 'profit', accessorKey: 'profit', header: 'Lucro' },
]
</script>
