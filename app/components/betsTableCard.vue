<template>
  <UCard class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Jogos reais</p>
    </template>

    <p class="mb-3 text-sm">{{ betsTotal }} jogos</p>

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

      <template #score-cell="{ row }">
        <span :class="row.original.score ? 'text-zinc-200' : 'text-zinc-600'">
          {{ row.original.score || '—' }}
        </span>
      </template>
    </UTable>

    <div class="flex justify-center pt-3">
      <UPagination
        :page="page"
        :items-per-page="betsSize"
        :total="betsTotal"
        @update:page="$emit('update:page', $event)"
      />
    </div>
  </UCard>
</template>

<script setup>
import { formatDate } from '~/utils/formatDate'

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
  { id: 'score', accessorKey: 'score', header: 'Placar' },
  { id: 'odds', accessorKey: 'odds', header: 'Odds' },
  { id: 'result', accessorKey: 'result', header: 'Resultado' },
  { id: 'profit', accessorKey: 'profit', header: 'Lucro' },
]
</script>
