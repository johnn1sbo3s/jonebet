<template>
  <div class="flex flex-col">
    <div
      v-for="item in internalFixtures"
      :key="item._id"
      class="card-shine mb-2 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 hover:border-zinc-700 sm:gap-5 sm:px-6"
      :class="item._id === chosen._id ? 'outline outline-2 outline-teal-500' : ''"
      @click="emits('click', item)"
    >
      <div class="flex items-center gap-7">
        <div class="flex flex-col items-center">
          <div class="text-sm font-semibold sm:text-base">
            {{ item.Time }}
          </div>

          <div class="text-xs text-zinc-500">
            {{ formatDate(item.Date) }}
          </div>
        </div>

        <div class="flex flex-col gap-1 text-sm sm:text-base">
          <div class="text-2xs truncate font-semibold tracking-wide text-zinc-500 uppercase">
            {{ item.League }}
          </div>

          <div class="flex items-center gap-1.5">
            <span>{{ item.Home }} x {{ item.Away }}</span>

            <a
              v-if="item.Fixture_ID"
              :href="flashscoreUrl(item.Fixture_ID)"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver no Flashscore"
              class="ml-1 flex items-center"
              @click.stop
            >
              <UIcon name="i-lucide-external-link" class="text-zinc-500 hover:text-teal-400" />
            </a>
          </div>

          <div class="flex gap-1">
            <UBadge :color="item.FT_Odds_H < item.FT_Odds_A ? 'primary' : 'neutral'" variant="soft">
              {{ formatNumber(item.FT_Odds_H) }}
            </UBadge>

            <UBadge color="neutral" variant="soft">
              {{ formatNumber(item.FT_Odds_D) }}
            </UBadge>

            <UBadge :color="item.FT_Odds_A < item.FT_Odds_H ? 'primary' : 'neutral'" variant="soft">
              {{ formatNumber(item.FT_Odds_A) }}
            </UBadge>
          </div>
        </div>
      </div>

      <div class="flex min-w-16 flex-col items-end gap-1 text-end">
        <div class="text-xs text-zinc-500">Entrada em</div>

        <div v-if="countModels(item) === 0" class="text-xs font-semibold text-zinc-500 sm:text-sm">Nenhum</div>

        <div v-else class="text-xs font-semibold text-teal-500 sm:text-sm">
          {{ countModels(item) }} {{ countModels(item) === 1 ? 'modelo' : 'modelos' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  fixtures: {
    type: Array,
    required: true,
  },
  bets: {
    type: Array,
    required: true,
  },
  chosen: {
    type: Object,
    default: () => {},
  },
})

const emits = defineEmits(['click'])

const internalFixtures = ref([])

watch(
  () => props.fixtures,
  (value) => {
    internalFixtures.value = value
  },
  { immediate: true },
)

function countModels(fixture) {
  return props.bets.filter((bet) => bet.Date === fixture.Date && bet.Home === fixture.Home && bet.Away === fixture.Away)
    .length
}
</script>
