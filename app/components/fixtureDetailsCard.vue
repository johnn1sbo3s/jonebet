<template>
  <div class="relative flex w-full flex-col gap-3">
    <div class="flex justify-center text-sm text-gray-500 sm:text-base">
      {{ fixture.Date ? formatDate(fixture.Date) : '' }} - {{ fixture?.Time }}
    </div>

    <div class="-mt-3 flex justify-center text-sm text-gray-500">
      {{ fixture?.League || '' }}
    </div>

    <div class="mt-2 flex justify-center text-lg font-semibold sm:mt-0 sm:text-2xl">
      {{ fixture?.Home }} x {{ fixture?.Away }}
    </div>

    <div class="flex justify-center gap-1">
      <UBadge color="primary" variant="soft" size="md">
        {{ isMobile ? 'H' : 'Home' }}: {{ fixture?.FT_Odds_H?.toFixed(2) }}
      </UBadge>

      <UBadge color="primary" variant="soft" size="md">
        {{ isMobile ? 'D' : 'Draw' }}: {{ fixture?.FT_Odds_D?.toFixed(2) }}
      </UBadge>

      <UBadge color="primary" variant="soft" size="md">
        {{ isMobile ? 'A' : 'Away' }}: {{ fixture?.FT_Odds_A?.toFixed(2) }}
      </UBadge>
    </div>

    <div class="mt-3 mb-2 flex items-center justify-between gap-3 text-center text-lg font-semibold">
      <div class="flex w-1/2 flex-col items-center gap-2">
        <div>Over 2.5</div>

        <div class="flex items-center gap-2">
          <UBadge color="primary" variant="soft" size="md" class="w-fit">
            {{ isMobile ? 'O' : 'Over' }}: {{ fixture?.Odds_O25?.toFixed(2) }}
          </UBadge>

          <UBadge color="primary" variant="soft" size="md" class="w-fit">
            {{ isMobile ? 'U' : 'Under' }}: {{ fixture?.Odds_U25?.toFixed(2) }}
          </UBadge>
        </div>
      </div>

      <div class="flex w-1/2 flex-col items-center gap-2">
        <div>BTTS</div>

        <div class="flex items-center gap-2">
          <UBadge color="primary" variant="soft" size="md" class="w-fit">
            {{ isMobile ? 'Y' : 'Yes' }}: {{ fixture?.BTTS_Yes?.toFixed(2) }}
          </UBadge>

          <UBadge color="primary" variant="soft" size="md" class="w-fit">
            {{ isMobile ? 'N' : 'No' }}: {{ fixture?.BTTS_No?.toFixed(2) }}
          </UBadge>
        </div>
      </div>
    </div>

    <div class="mt-6 w-full">
      <div class="mb-3 flex flex-col gap-2 text-sm">
        {{
          fixtureAllowedModels.length > 0
            ? 'Modelos com entrada para este jogo: '
            : 'Nenhum modelo com entrada para este jogo.'
        }}
      </div>

      <div v-for="model in fixtureAllowedModels" :key="model" class="mb-1">• {{ model }}</div>
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

const { isMobile } = useDevice()

const fixtureAllowedModels = computed(() => {
  return props.bets.map((item) => modelNameToNaturalName(item.Modelo))
})
</script>

<style lang="scss" scoped></style>
