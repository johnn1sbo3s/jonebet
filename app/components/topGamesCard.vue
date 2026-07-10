<template>
  <div v-if="fixtures.length > 0 || loading" class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-flame" class="text-teal-500" />

      <h2 class="text-base font-semibold text-white">Top jogos do dia</h2>
    </div>

    <TopGamesCardSkeleton v-if="loading" />

    <div v-else>
      <UCarousel
        v-slot="{ item }"
        :items="fixtures"
        :ui="{ item: 'basis-full sm:basis-1/2 lg:basis-1/3' }"
        drag-free
        class="w-full"
      >
        <div
          class="top-game-card cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          @click="openDetails(item)"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs tracking-wide text-zinc-500 uppercase">
              {{ item.League }}
            </span>

            <span class="text-sm font-semibold text-zinc-400">
              {{ item.Time }}
            </span>
          </div>

          <div class="mb-3 text-base font-semibold text-white">{{ item.Home }} x {{ item.Away }}</div>

          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span
                class="rounded-md px-2 py-1 text-xs"
                :class="
                  item.FT_Odds_H <= item.FT_Odds_A && item.FT_Odds_H <= item.FT_Odds_D
                    ? 'bg-teal-500/10 text-teal-500'
                    : 'bg-zinc-800 text-zinc-300'
                "
              >
                {{ formatNumber(item.FT_Odds_H) }}
              </span>

              <span class="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                {{ formatNumber(item.FT_Odds_D) }}
              </span>

              <span
                class="rounded-md px-2 py-1 text-xs"
                :class="
                  item.FT_Odds_A <= item.FT_Odds_H && item.FT_Odds_A <= item.FT_Odds_D
                    ? 'bg-teal-500/10 text-teal-500'
                    : 'bg-zinc-800 text-zinc-300'
                "
              >
                {{ formatNumber(item.FT_Odds_A) }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-0.5">
              <span class="h-1.5 w-1.5 rounded-full bg-teal-500" />

              <span class="text-xs font-semibold text-teal-500">
                {{ item.models_count }} {{ item.models_count === 1 ? 'modelo' : 'modelos' }}
              </span>
            </div>
          </div>
        </div>
      </UCarousel>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'bg-zinc-900' }">
      <template #content>
        <div class="flex flex-col gap-3 p-5">
          <FixtureDetailsCard v-if="selectedFixture" :fixture="selectedFixture" :bets="selectedBets" />

          <div class="mt-auto pt-4">
            <UButton block color="primary" variant="link" size="lg" @click="showModal = false"> Fechar </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UDrawer v-model:open="showDrawer" :ui="{ content: 'bg-zinc-900' }">
      <template #content>
        <div class="flex flex-col gap-3 p-5">
          <FixtureDetailsCard v-if="selectedFixture" :fixture="selectedFixture" :bets="selectedBets" />

          <div class="mt-auto pt-4">
            <UButton block color="primary" variant="link" size="lg" @click="showDrawer = false"> Fechar </UButton>
          </div>
        </div>
      </template>
    </UDrawer>
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
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const isNarrow = ref(false)
const showModal = ref(false)
const showDrawer = ref(false)
const selectedFixture = ref(null)

function handleResize() {
  isNarrow.value = window.innerWidth < 1024
}

onMounted(() => {
  isNarrow.value = window.innerWidth < 1024
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const selectedBets = computed(() => {
  if (!selectedFixture.value) return []
  return props.bets.filter(
    (bet) =>
      bet.Date === selectedFixture.value.Date &&
      bet.Home === selectedFixture.value.Home &&
      bet.Away === selectedFixture.value.Away,
  )
})

function openDetails(fixture) {
  selectedFixture.value = fixture
  if (isNarrow.value) {
    showDrawer.value = true
  } else {
    showModal.value = true
  }
}
</script>

<style scoped>
.top-game-card {
  position: relative;
  overflow: hidden;
  user-select: none;
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
