<template>
  <UCard class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Resultados por mês</p>
    </template>

    <p class="mb-3 text-sm">{{ sortedResults.length }} meses</p>

    <template v-if="sortedResults.length > 0">
      <div class="relative h-80">
        <div ref="scrollContainer" class="h-full overflow-y-auto pr-1" @scroll="handleScroll">
          <div
            v-for="(month, index) in sortedResults"
            :key="index"
            class="mb-2 flex items-center justify-between rounded-md border border-l-[3px] border-zinc-800 bg-zinc-950/80 px-3 py-2 last:mb-0"
            :class="borderClassFor(month)"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-white">
                {{ formatMonthYear(month.monthYear) }}
              </p>

              <p class="text-xs text-zinc-500">{{ month.gameCount }} jogos</p>
            </div>

            <div class="shrink-0 text-right">
              <p class="text-base font-semibold" :class="profitClassFor(month)">
                {{ formatNumber(month.profit) }}
              </p>

              <p class="text-xs text-zinc-500">Acumulado {{ formatNumber(month.accumulated) }}</p>
            </div>
          </div>
        </div>

        <div
          class="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-linear-to-t from-zinc-900 to-transparent transition-opacity duration-300"
          :class="initialized && !atBottom ? 'opacity-100' : 'opacity-0'"
        />
      </div>
    </template>

    <div v-else class="py-12 text-center">
      <p class="text-sm text-zinc-500">Nenhum resultado por mês</p>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  results: {
    type: Array,
    required: true,
  },
})

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatNumber(n, decimals = 2) {
  return Number(n ?? 0).toLocaleString('pt-BR', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  })
}

function formatMonthYear(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`
  }
  return String(raw)
}

const sortedResults = computed(() => [...props.results].sort((a, b) => new Date(b.monthYear) - new Date(a.monthYear)))

function profitClassFor(month) {
  if (month.profit > 0) return 'text-teal-500'
  if (month.profit < 0) return 'text-red-500'
  return 'text-white'
}

function borderClassFor(month) {
  if (month.profit > 0) return 'border-l-teal-500'
  if (month.profit < 0) return 'border-l-red-500'
  return 'border-l-zinc-800'
}

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
  () => props.results,
  () => {
    nextTick(() => {
      handleScroll()
    })
  },
  { deep: true },
)
</script>
