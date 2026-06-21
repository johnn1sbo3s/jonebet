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

    <template v-if="pending">
      <USkeleton class="h-52 w-full rounded-2xl" />

      <USkeleton class="h-52 w-full rounded-2xl" />

      <USkeleton class="h-52 w-full rounded-2xl" />
    </template>

    <DataErrorCard
      v-else-if="error || !bets.length"
      :message="
        error ? 'Não foi possível carregar as apostas' : 'Nenhuma aposta encontrada para os filtros selecionados'
      "
    />

    <ul v-else class="flex flex-col gap-3">
      <li v-for="(bet, index) in bets" :key="`${bet.Date}-${bet.Time}-${bet.Home}-${index}`">
        <DailyBetCard :bet="bet" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

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
