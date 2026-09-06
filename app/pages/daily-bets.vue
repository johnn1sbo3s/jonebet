<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Apostas do dia" description="Histórico de apostas filtrado por data e modelo" />

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <DatePicker v-model="date" :max-value="maxDateIso" />

        <USelectMenu
          v-model="selectedModel"
          variant="outline"
          class="min-w-0 flex-1 sm:min-w-60 sm:flex-none"
          searchable
          placeholder="Todos os modelos"
          :items="modelItems"
          value-key="value"
        />
      </div>

      <p class="self-end text-sm whitespace-nowrap text-zinc-400 tabular-nums sm:self-auto">{{ qtd_games }} apostas</p>
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
        error
          ? 'Não foi possível carregar as apostas'
          : selectedModel
            ? `Nenhuma aposta do modelo ${modelNameToNaturalName(selectedModel)} para esta data`
            : 'Nenhuma aposta encontrada para esta data'
      "
    />

    <template v-else>
      <section v-for="group in groupedBets" :key="group.time" class="flex flex-col gap-3">
        <div
          class="sticky top-16 z-10 -mx-1 w-fit rounded-xl border border-zinc-800 bg-zinc-950/90 px-2.5 py-1.5 backdrop-blur-sm"
        >
          <span class="inline-flex items-end gap-2">
            <span class="text-sm font-bold text-teal-400">{{ group.time }}</span>

            <span class="text-xs text-zinc-500">{{ group.items.length }} apostas</span>
          </span>
        </div>

        <ul class="flex flex-col gap-3">
          <li v-for="bet in group.items" :key="bet._id || `${bet.Date}-${bet.Time}-${bet.Home}`">
            <DailyBetCard :bet="bet" />
          </li>
        </ul>
      </section>
    </template>

    <BackToTop />
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

// Full model catalog from the API — independent of the selected date, so the
// selector always lists every model. The bets filter below surfaces an empty
// state for models with no bets on the chosen date.
const { data: modelsPayload } = await useModelsList()

const modelItems = computed(() => {
  const names = (modelsPayload.value?.items || [])
    .map((m) => m.id)
    .sort((a, b) => modelNameToNaturalName(a).localeCompare(modelNameToNaturalName(b)))
  return [
    { value: null, label: 'Todos os modelos' },
    ...names.map((name) => ({ value: name, label: modelNameToNaturalName(name) })),
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
    (item) => !selectedModel.value || (item.Modelo ?? item.model) === selectedModel.value,
  )
  return list.map((item) => ({
    ...item,
    Modelo: modelNameToNaturalName(item.Modelo ?? item.model),
    FT_Odds_H: formatNumber(item.FT_Odds_H),
    FT_Odds_D: formatNumber(item.FT_Odds_D),
    FT_Odds_A: formatNumber(item.FT_Odds_A),
    Odd: item.Odd != null ? formatNumber(item.Odd) : null,
    Market: MARKET_LABELS[item.Market] ?? item.Market ?? null,
  }))
})

const qtd_games = computed(() => bets.value.length)

const groupedBets = computed(() => {
  const groups = new Map()
  for (const bet of bets.value) {
    if (!groups.has(bet.Time)) groups.set(bet.Time, [])
    groups.get(bet.Time).push(bet)
  }
  return [...groups.entries()].map(([time, items]) => ({ time, items }))
})
</script>
