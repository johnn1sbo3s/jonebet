<template>
  <div>
    <FixturesListSkeleton v-if="loading" />

    <div v-else>
      <div class="mb-4 flex w-full items-center justify-between gap-2 sm:w-1/2 sm:gap-3">
        <p class="text-sm text-zinc-400">{{ internalFixtures.length }} jogos</p>

        <SegmentedControl v-model="selectedTab" :options="tabItems" />
      </div>

      <div class="flex gap-3">
        <div class="w-full sm:w-1/2">
          <FixtureCard
            class="w-full"
            :fixtures="internalFixtures"
            :bets="bets"
            :chosen="chosenGame"
            @click="handleGameClick"
          />
        </div>

        <div v-if="!$device.isMobile" class="sticky top-4 h-full w-1/2">
          <div
            v-if="!chosenGame._id"
            class="flex h-[50svh] w-full flex-col items-center justify-center gap-2 rounded-md p-10 outline-1 outline-zinc-800 outline-dashed"
          >
            <UIcon name="i-lucide-mouse-pointer-click" class="text-2xl text-zinc-500" />

            <p class="text-center text-sm text-zinc-500">Selecione um card ao lado para ver informações sobre o jogo</p>
          </div>

          <div
            v-else-if="showSkeleton"
            class="flex h-[50svh] w-full items-center justify-center rounded-md bg-zinc-800 p-10"
          >
            <p class="text-center text-sm text-zinc-400">Carregando...</p>
          </div>

          <div v-else class="flex w-full justify-center rounded-md bg-zinc-900 p-10 outline outline-1 outline-zinc-800">
            <FixtureDetailsCard :fixture="chosenGame" :bets="filteredBets" />
          </div>
        </div>
      </div>
    </div>

    <UModal v-if="isMobile" v-model="showMobileModal">
      <div class="flex h-[60vh] flex-col gap-3 rounded-lg border border-teal-500 bg-zinc-900 p-5">
        <div v-if="_isEmpty(chosenGame)" class="flex flex-col items-center gap-2">
          <USkeleton class="h-5 w-1/2" />

          <USkeleton class="h-5 w-28" />

          <USkeleton class="mt-8 mb-6 h-16 w-3/4" />

          <USkeleton v-for="i in 5" :key="i" class="mb-2 h-5 w-5/6" />
        </div>

        <FixtureDetailsCard v-else :fixture="chosenGame" :bets="filteredBets" />

        <div class="absolute right-0 bottom-0 left-0 p-4">
          <UButton block color="teal" size="lg" @click="() => (showMobileModal = false)"> Fechar </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup>
const { isMobile } = useDevice()

const props = defineProps({
  fixtures: {
    type: Array,
    required: true,
  },
  bets: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['source-change'])

const tabItems = [
  { label: 'Exchange', value: 'exchange' },
  { label: 'Bookie', value: 'bookie' },
]

const internalFixtures = ref([])
const chosenGame = ref({})
const filteredBets = ref([])
const selectedTab = ref('exchange')
const betfairFixtures = ref(true)
const showSkeleton = ref(false)
const showMobileModal = ref(false)

watch(
  () => props.fixtures,
  (value) => {
    internalFixtures.value = value.sort((a, b) => (a.Time > b.Time ? 1 : -1))
  },
  { immediate: true },
)

watch(selectedTab, (value) => {
  betfairFixtures.value = value !== 'bookie'
  emits('source-change', betfairFixtures.value)
})

watch(
  () => showMobileModal.value,
  (newValue) => {
    if (newValue === false) {
      setTimeout(() => {
        chosenGame.value = {}
      }, 300)
    }
  },
)

async function handleGameClick(game) {
  showMobileModal.value = true
  showSkeleton.value = true

  setTimeout(() => {
    if (game._id === chosenGame.value._id) {
      chosenGame.value = {}
      return
    }

    chosenGame.value = game
    filterBets()

    showSkeleton.value = false
  }, 100)
}

function filterBets() {
  filteredBets.value = props.bets.filter((bet) => {
    return bet.Home === chosenGame.value.Home && bet.Away === chosenGame.value.Away
  })
}
</script>

<style lang="scss" scoped></style>
