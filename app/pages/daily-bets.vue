<template>
  <div class="flex flex-col gap-5">
    <div class="flex justify-between">
      <PageHeader title="Apostas do dia" description="Histórico de apostas filtrado por data e modelo" />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="w-full text-sm text-zinc-400 sm:w-auto sm:min-w-24">{{ qtd_games }} apostas</p>

      <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <DatePicker v-model="date" :max-value="maxDateIso" />

        <USelectMenu
          v-model="selectedModel"
          class="min-w-60 flex-1 sm:flex-none"
          searchable
          placeholder="Todos os modelos"
          :items="modelItems"
          value-key="value"
        />
      </div>
    </div>

    <template v-if="pending">
      <ul class="flex flex-col gap-3">
        <li v-for="i in 3" :key="i">
          <USkeleton class="h-28 w-full rounded-2xl" />
        </li>
      </ul>
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

const todayIso = DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd')

// date starts null: the API resolves the effective date (tomorrow, fallback today)
// and echoes it in the response. The watch below syncs the picker once.
const date = ref(null)
const selectedModel = ref(null)

// Upper bound for the picker: the API-resolved effective date (tomorrow,
// fallback today) captured on first load becomes the max so the next day
// (after the latest available) stays blocked. It does not shrink as the user
// navigates backwards. Falls back to today until the response arrives.
const maxDateIso = ref(todayIso)

const modelItems = computed(() => {
  const names = new Set()
  for (const bet of dailyBetsResponse.value?.bets || []) {
    if (bet.Modelo) names.add(bet.Modelo)
  }
  return [
    { value: null, label: 'Todos os modelos' },
    ...[...names]
      .map((name) => ({ value: name, label: modelNameToNaturalName(name) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]
})

const { data: dailyBetsResponse, pending, error } = await useDailyBets({ date })

// Mirror the API-resolved date into the datepicker on first load only.
// User navigation after that must not be overridden. The same resolved date
// becomes the picker's max so the next day (after the latest available) stays
// blocked.
watch(
  dailyBetsResponse,
  (response) => {
    if (response?.date && date.value === null) {
      date.value = response.date
      maxDateIso.value = response.date
    }
  },
  { immediate: true },
)

const bets = computed(() => {
  const list = (dailyBetsResponse.value?.bets || []).filter(
    (item) => !selectedModel.value || item.Modelo === selectedModel.value,
  )
  return list.map((item) => ({
    ...item,
    Modelo: modelNameToNaturalName(item.Modelo),
    FT_Odds_H: formatNumber(item.FT_Odds_H),
    FT_Odds_D: formatNumber(item.FT_Odds_D),
    FT_Odds_A: formatNumber(item.FT_Odds_A),
  }))
})

const qtd_games = computed(() => bets.value.length)

watch(date, () => {
  selectedModel.value = null
})
</script>
