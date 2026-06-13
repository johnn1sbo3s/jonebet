<template>
  <UCard id="block-metrics" class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Resultados por blocos de 100 jogos</p>
    </template>

    <div class="grid h-full grid-cols-[2fr_3fr] gap-3">
      <div class="grid grid-rows-2 content-start gap-3">
        <BlockMetricsCard :metrics-data="metricsTotal" :card-title="'Médias'" />

        <CurrentBlockMetricsCard :metrics-data="metricsTotal" :card-title="'Bloco atual'" />
      </div>

      <UCard class="border border-zinc-800 bg-zinc-950/80">
        <template #header>
          <p class="font-semibold">Histórico</p>
        </template>

        <UTable
          class="h-80"
          :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
          :data="blocksHistory"
          :columns="blocksHistoryColumns"
        />
      </UCard>
    </div>
  </UCard>
</template>

<script setup>
defineProps({
  metricsTotal: {
    type: Object,
    required: true,
  },
  blocksHistory: {
    type: Array,
    required: true,
  },
})

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const blocksHistoryColumns = [
  { id: 'Profit', accessorKey: 'Profit', header: 'Lucro' },
  { id: 'Qtd_Jogos', accessorKey: 'Qtd_Jogos', header: 'Quantidade de jogos' },
  { id: 'ROI', accessorKey: 'ROI', header: 'ROI' },
  {
    id: 'Ult_Dia',
    accessorKey: 'Ult_Dia',
    header: 'Último dia do bloco',
    cell: ({ row }) => formatDate(row.getValue('Ult_Dia')),
  },
]
</script>
