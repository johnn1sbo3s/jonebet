<template>
  <UCard class="h-full w-full border border-zinc-800 bg-zinc-950/80">
    <template #header>
      <div class="flex items-center justify-between">
        <p class="font-semibold">{{ title }}</p>

        <UButton color="secondary" size="xs" variant="soft" @click="isModalOpen = true"> Ver todos </UButton>
      </div>
    </template>

    <template #default>
      <div class="flex flex-col gap-2">
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/performance/${modelNameToIdName(item.name)}`"
          class="ranking-item relative flex cursor-pointer items-center justify-between overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
        >
          <span class="relative z-10">{{ modelNameToNaturalName(item.name) }}</span>

          <span class="relative z-10 font-semibold" :class="item.profit >= 0 ? 'text-teal-500' : 'text-red-500'">
            {{ formatNumber(item.profit) }}
          </span>
        </NuxtLink>
      </div>
    </template>
  </UCard>

  <UModal
    v-model:open="isModalOpen"
    :title="`Todos os modelos — ${formatDateOrMonth(sanitizedAllResultsData[0]?.Date)}`"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <UTable v-if="!isMobile" :data="sanitizedAllResultsData" :columns="columns" />

      <div v-else class="flex max-h-96 flex-col gap-2 overflow-y-auto">
        <div v-for="(item, index) in sanitizedAllResultsData" :key="index" class="border-default rounded-lg border p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="font-semibold">{{ item.Method }}</span>

            <span class="text-sm font-bold" :class="item.ProfitRaw >= 0 ? 'text-teal-500' : 'text-red-500'">
              {{ item.Profit }}
            </span>
          </div>

          <div class="text-muted flex gap-2 text-sm">
            <span>ROI: {{ item.ROI }}%</span>

            <span>|</span>

            <span>Investido: {{ formatNumber(item.Responsibility) }}</span>

            <span>|</span>

            <span>{{ item.Num_Bets }} apostas</span>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup>
const { isMobile } = useDevice()

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  allResultsData: {
    type: Array,
    required: true,
  },
})

function formatYearMonth(yyyyMm) {
  const [y, m] = yyyyMm.split('-')
  return `${m}/${y}`
}

function formatDateOrMonth(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 2) return formatYearMonth(dateStr)
  return formatDate(dateStr)
}

const isModalOpen = ref(false)
const columns = [
  {
    accessorKey: 'Method',
    header: 'Modelo',
    cell: ({ row }) => modelNameToNaturalName(row.getValue('Method')),
  },
  { accessorKey: 'Profit', header: 'Lucro' },
  { accessorKey: 'ROI', header: 'ROI' },
  { accessorKey: 'Responsibility', header: 'Investido' },
  { accessorKey: 'Num_Bets', header: 'Qtd de apostas' },
]

const sanitizedAllResultsData = computed(() => {
  return props.allResultsData.map((item) => {
    return {
      ...item,
      ProfitRaw: item.Profit,
      Profit: formatNumber(item.Profit),
      ROI: formatNumber(item.ROI),
      Num_Bets: formatNumber(item.Num_Bets),
    }
  })
})
</script>
<style scoped>
.ranking-item::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transition: transform 0.6s ease;
}

.ranking-item:hover::after {
  transform: translateX(100%);
}
</style>
