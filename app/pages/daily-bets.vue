<template>
  <div class="flex flex-col gap-5">
    <div class="flex justify-between">
      <PageHeader title="Apostas do dia" description="Histórico de apostas filtrado por data e modelo" />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <p v-if="!pending && !error" class="text-sm text-zinc-400">{{ qtd_games }} apostas</p>

      <div class="flex items-center gap-2">
        <DatePicker v-model="date" :max-value="maxDateIso" />

        <USelectMenu
          v-model="selectedModel"
          class="max-w-89 min-w-60 rounded-xl border border-zinc-800 bg-zinc-900"
          searchable
          placeholder="Todos os modelos"
          :items="modelItems"
          value-key="value"
        />
      </div>
    </div>

    <USkeleton v-if="pending" class="h-96 w-full rounded-xl" />

    <DataErrorCard
      v-else-if="error || !bets.length"
      :message="
        error ? 'Não foi possível carregar as apostas' : 'Nenhuma aposta encontrada para os filtros selecionados'
      "
    />

    <UTable
      v-else
      :ui="{
        wrapper: 'relative overflow-x-auto border border-zinc-800 rounded-xl',
        th: 'bg-zinc-950 text-zinc-400 text-xs uppercase',
        td: 'border-t border-zinc-800 text-zinc-300',
      }"
      :data="bets"
      :columns="columns"
      :sort="sort"
      class="bg-zinc-900"
    >
      <template #Date-cell="{ row }">
        {{ formatDate(row.original.Date) }}
      </template>
    </UTable>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'
import { formatDate } from '~/utils/formatDate'

const yesterday = DateTime.now().setZone('America/Sao_Paulo').minus({ days: 1 }).toFormat('yyyy-MM-dd')

const date = ref(yesterday)
const selectedModel = ref(null)

const { data: availableDates } = await useDailyBetsDates()
const maxDateIso = computed(() => availableDates.value?.[0] || yesterday)

const { data: modelsPayload } = await useModelsList({ playedOn: date })
const modelItems = computed(() => [
  { value: null, label: 'Todos os modelos' },
  ...(modelsPayload.value?.items || [])
    .filter((m) => m.playedOn)
    .map((m) => ({ value: m.name, label: modelNameToNaturalName(m.name) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
])

const { data: betsRaw, pending, error } = await useDailyBets({ date, model: selectedModel })

const columns = [
  { id: 'Date', accessorKey: 'Date', header: 'Data' },
  { id: 'Time', accessorKey: 'Time', header: 'Horário', sortable: true },
  { id: 'Home', accessorKey: 'Home', header: 'Casa', sortable: true },
  { id: 'Away', accessorKey: 'Away', header: 'Fora', sortable: true },
  { id: 'FT_Odds_H', accessorKey: 'FT_Odds_H', header: 'Odds casa' },
  { id: 'FT_Odds_D', accessorKey: 'FT_Odds_D', header: 'Odds empate' },
  { id: 'FT_Odds_A', accessorKey: 'FT_Odds_A', header: 'Odds fora' },
  { id: 'Modelo', accessorKey: 'Modelo', header: 'Modelo', sortable: true },
]

const sort = { column: 'Time', direction: 'asc' }

const bets = computed(() =>
  (betsRaw.value || []).map((item) => ({
    ...item,
    Modelo: modelNameToNaturalName(item.Modelo),
    FT_Odds_H: Number(item.FT_Odds_H).toFixed(2),
    FT_Odds_D: Number(item.FT_Odds_D).toFixed(2),
    FT_Odds_A: Number(item.FT_Odds_A).toFixed(2),
  })),
)

const qtd_games = computed(() => bets.value.length)

watch(date, () => {
  selectedModel.value = null
})
</script>
