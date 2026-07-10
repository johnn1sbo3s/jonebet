<template>
  <div v-if="fixtures.length > 0 || loading" class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-flame" class="text-teal-500" />

      <h2 class="text-base font-semibold text-white">Top jogos do dia</h2>
    </div>

    <TopGamesCardSkeleton v-if="loading" />

    <div v-else class="flex gap-3 overflow-x-auto pb-3">
      <div
        v-for="fixture in fixtures"
        :key="fixture._id"
        class="top-game-card min-w-70 cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        @click="emits('select', fixture)"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs tracking-wide text-zinc-500 uppercase">
            {{ fixture.League }}
          </span>

          <span class="text-sm font-semibold text-zinc-400">
            {{ fixture.Time }}
          </span>
        </div>

        <div class="mb-3 text-base font-semibold text-white">{{ fixture.Home }} x {{ fixture.Away }}</div>

        <div class="flex items-center justify-between">
          <div class="flex gap-1.5">
            <span
              class="rounded-md px-2 py-1 text-xs"
              :class="
                fixture.FT_Odds_H <= fixture.FT_Odds_A && fixture.FT_Odds_H <= fixture.FT_Odds_D
                  ? 'bg-teal-500/10 text-teal-500'
                  : 'bg-zinc-800 text-zinc-300'
              "
            >
              {{ formatNumber(fixture.FT_Odds_H) }}
            </span>

            <span class="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
              {{ formatNumber(fixture.FT_Odds_D) }}
            </span>

            <span
              class="rounded-md px-2 py-1 text-xs"
              :class="
                fixture.FT_Odds_A <= fixture.FT_Odds_H && fixture.FT_Odds_A <= fixture.FT_Odds_D
                  ? 'bg-teal-500/10 text-teal-500'
                  : 'bg-zinc-800 text-zinc-300'
              "
            >
              {{ formatNumber(fixture.FT_Odds_A) }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-0.5">
            <span class="h-1.5 w-1.5 rounded-full bg-teal-500" />

            <span class="text-xs font-semibold text-teal-500">
              {{ fixture.models_count }} {{ fixture.models_count === 1 ? 'modelo' : 'modelos' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  fixtures: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['select'])
</script>

<style scoped>
.top-game-card {
  position: relative;
  overflow: hidden;
}

.top-game-card::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
}

.top-game-card:hover::after {
  transform: translateX(100%);
  transition: transform 0.6s ease;
}
</style>
