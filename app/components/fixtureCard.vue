<template>
  <div class="flex flex-col">
    <div
      v-for="item in internalFixtures"
      :key="item._id"
      class="mb-2 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-4 hover:border-zinc-700 sm:gap-5 sm:px-6"
      :class="item._id === chosen._id ? 'border-1 border-teal-400 sm:border' : ''"
      @click="emits('click', item)"
    >
      <div class="flex items-center gap-7">
        <div class="flex flex-col items-center">
          <div class="text-sm font-semibold sm:text-base">
            {{ item.Time }}
          </div>

          <div class="text-xs text-zinc-500 sm:text-sm">
            {{ formatDate(item.Date) }}
          </div>
        </div>

        <div class="flex flex-col gap-2 text-sm sm:text-base">
          <div>{{ item.Home }} x {{ item.Away }}</div>

          <div class="flex gap-1">
            <UBadge color="primary" variant="soft">
              {{ item.FT_Odds_H.toFixed(2) }}
            </UBadge>

            <UBadge color="primary" variant="soft">
              {{ item.FT_Odds_D.toFixed(2) }}
            </UBadge>

            <UBadge color="primary" variant="soft">
              {{ item.FT_Odds_A.toFixed(2) }}
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

<style lang="scss" scoped></style>
