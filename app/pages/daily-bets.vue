<template>
  <div class="flex flex-col gap-5">
    <div class="flex justify-between">
      <PageHeader title="Apostas do dia" description="Histórico de apostas filtrado por data e modelo" />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="min-w-24 text-sm text-zinc-400">{{ qtd_games }} apostas</p>

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
      <li v-for="bet in bets" :key="bet._id || `${bet.Date}-${bet.Time}-${bet.Home}`">
        <DailyBetCard :bet="bet" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const yesterday = DateTime.now().setZone('America/Sao_Paulo').minus({ days: 1 }).toFormat('yyyy-MM-dd')

// date starts null: the API resolves the effective date (tomorrow, fallback today)
// and echoes it in the response. The watch below syncs the picker once.
const date = ref(null)
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

const { data: dailyBetsResponse, pending, error } = await useDailyBets({ date, model: selectedModel })

// Mirror the API-resolved date into the datepicker on first load only.
// User navigation after that must not be overridden.
watch(
  dailyBetsResponse,
  (response) => {
    if (response?.date && date.value === null) {
      date.value = response.date
    }
  },
  { immediate: true },
)

const bets = computed(() =>
  (dailyBetsResponse.value?.bets || []).map((item) => ({
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
