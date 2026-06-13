<template>
  <UCard
    class="flex h-full w-full flex-col border border-zinc-800 bg-zinc-950/80"
    :ui="{ body: 'flex-1 min-h-0 overflow-hidden' }"
  >
    <template #header>
      <p class="font-semibold">Histórico</p>
    </template>

    <div class="relative h-full">
      <div ref="scrollContainer" class="h-full overflow-y-auto pr-1" @scroll="handleScroll">
        <div
          v-for="(block, index) in blocks"
          :key="index"
          class="mb-2 flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 last:mb-0"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-white">
              #{{ blocks.length - index }} <span class="text-zinc-500">({{ formatDate(block.endDate) }})</span>
            </p>

            <p class="text-xs text-zinc-500">
              <template v-if="block.gameCount < 100">{{ block.gameCount }} jogos · </template>
              ROI {{ formatPercent(block.roi) }}
            </p>
          </div>

          <span class="shrink-0 text-base font-semibold" :class="block.profit >= 0 ? 'text-teal-500' : 'text-red-500'">
            {{ formatNumber(block.profit) }}
          </span>
        </div>
      </div>

      <div
        class="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-linear-to-t from-zinc-950/80 to-transparent transition-opacity duration-300"
        :class="initialized && !atBottom ? 'opacity-100' : 'opacity-0'"
      />
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  blocks: {
    type: Array,
    required: true,
  },
})

const scrollContainer = ref(null)
const atBottom = ref(false)
const initialized = ref(false)

function handleScroll() {
  const el = scrollContainer.value
  if (!el) return
  // Considera "no fim" se estiver a até 8px do final (tolera arredondamento)
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 8
  initialized.value = true
}

onMounted(() => {
  handleScroll()
})

watch(
  () => props.blocks,
  () => {
    nextTick(() => {
      handleScroll()
    })
  },
  { deep: true },
)

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatNumber(n, decimals = 2) {
  return Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

function formatPercent(n, decimals = 2) {
  return `${formatNumber(n, decimals)}%`
}
</script>
