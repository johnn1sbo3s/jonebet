<template>
  <div class="relative flex w-full flex-col gap-3">
    <div class="flex flex-col items-center text-sm text-zinc-300">
      <span> {{ fixture.Date ? formatDate(fixture.Date) : '' }} - {{ fixture?.Time }} </span>

      <span>{{ fixture?.League || '' }}</span>
    </div>

    <div class="mt-2 flex justify-center text-lg font-semibold sm:mt-0 sm:text-2xl">
      {{ fixture?.Home }} x {{ fixture?.Away }}
    </div>

    <div class="mt-2 flex flex-col gap-2">
      <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
        <p class="text-xs text-zinc-300">Match odds</p>

        <div class="mt-1 flex items-center gap-2 text-sm">
          <span class="font-semibold text-white">H</span>

          <span class="text-white">
            {{ formatNumber(fixture?.FT_Odds_H) }}
          </span>

          <span class="text-zinc-500">·</span>

          <span class="font-semibold text-white">D</span>

          <span class="text-white">
            {{ formatNumber(fixture?.FT_Odds_D) }}
          </span>

          <span class="text-zinc-500">·</span>

          <span class="font-semibold text-white">A</span>

          <span class="text-white">
            {{ formatNumber(fixture?.FT_Odds_A) }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
          <p class="text-xs text-zinc-300">O/U 2.5</p>

          <div class="mt-1 flex items-center gap-2 text-sm">
            <span class="font-semibold text-white">O</span>

            <span class="text-white">{{ formatNumber(fixture?.Odds_O25) }}</span>

            <span class="text-zinc-500">·</span>

            <span class="font-semibold text-white">U</span>

            <span class="text-white">{{ formatNumber(fixture?.Odds_U25) }}</span>
          </div>
        </div>

        <div class="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
          <p class="text-xs text-zinc-300">BTTS</p>

          <div class="mt-1 flex items-center gap-2 text-sm">
            <span class="font-semibold text-white">Y</span>

            <span class="text-white">{{ formatNumber(fixture?.BTTS_Yes) }}</span>

            <span class="text-zinc-500">·</span>

            <span class="font-semibold text-white">N</span>

            <span class="text-white">{{ formatNumber(fixture?.BTTS_No) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 w-full border-t border-zinc-800 pt-4">
      <div class="mb-3 flex flex-col gap-2 text-sm text-zinc-300">
        {{
          fixtureAllowedModels.length > 0
            ? 'Modelos com entrada para este jogo:'
            : 'Nenhum modelo com entrada para este jogo.'
        }}
      </div>

      <div v-for="model in fixtureAllowedModels" :key="model" class="mb-1 text-sm text-zinc-300">• {{ model }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  fixture: {
    type: Object,
    required: true,
  },
  bets: {
    type: Array,
    required: true,
  },
})

const fixtureAllowedModels = computed(() => {
  return props.bets.map((item) => modelNameToNaturalName(item.Modelo))
})
</script>

<style lang="scss" scoped></style>
