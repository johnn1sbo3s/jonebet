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
          class="card-shine flex cursor-pointer items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
        >
          <span class="relative z-10">{{ modelNameToNaturalName(item.name) }}</span>

          <span class="relative z-10 font-semibold" :class="item.profit >= 0 ? 'text-teal-500' : 'text-red-500'">
            {{ formatUnit(item.profit) }}
          </span>
        </NuxtLink>
      </div>
    </template>
  </UCard>

  <UModal v-model:open="isModalOpen" :ui="{ content: 'max-w-3xl' }">
    <template #header>
      <p class="font-semibold">Todos os modelos — {{ formatDateOrMonth(sanitizedAllResultsData[0]?.Date) }}</p>
    </template>

    <template #body>
      <div class="hidden md:block">
        <UTable :data="sanitizedAllResultsData" :columns="columns">
          <template #Method-cell="{ row }">
            <NuxtLink
              :to="`/performance/${row.original.modelId}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 text-zinc-100 hover:text-teal-400 hover:underline"
            >
              {{ row.getValue('Method') }}
              <UIcon name="i-lucide-external-link" class="h-3 w-3" />
            </NuxtLink>
          </template>

          <template #Profit-cell="{ row }">
            <span class="font-semibold" :class="row.original.profitClass">
              {{ row.getValue('Profit') }}
            </span>
          </template>

          <template #ROI-cell="{ row }">
            <span class="font-semibold" :class="row.original.roiClass"> {{ row.getValue('ROI') }}% </span>
          </template>
        </UTable>
      </div>

      <div class="flex max-h-96 flex-col gap-2 overflow-y-auto md:hidden">
        <div
          v-for="(item, index) in sanitizedAllResultsData"
          :key="index"
          class="border-default rounded-lg border bg-zinc-950 p-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <NuxtLink
              :to="`/performance/${item.modelId}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 font-semibold text-zinc-100 hover:text-teal-400 hover:underline"
            >
              {{ item.Method }}
              <UIcon name="i-lucide-external-link" class="h-3 w-3" />
            </NuxtLink>

            <span class="text-sm font-bold" :class="item.profitClass">
              {{ item.Profit }}
            </span>
          </div>

          <div class="text-muted flex gap-2 text-sm">
            <span class="font-semibold" :class="item.roiClass">ROI: {{ item.ROI }}%</span>

            <span>|</span>

            <span>Investido: {{ formatUnit(item.Responsibility, 0) }}</span>

            <span>|</span>

            <span>{{ item.Num_Bets }} apostas</span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton block color="primary" variant="link" size="lg" @click="isModalOpen = false"> Fechar </UButton>
    </template>
  </UModal>
</template>

<script setup>
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
  { id: 'Method', accessorKey: 'Method', header: 'Modelo' },
  { id: 'Profit', accessorKey: 'Profit', header: 'Lucro' },
  { id: 'ROI', accessorKey: 'ROI', header: 'ROI' },
  { id: 'Responsibility', accessorKey: 'Responsibility', header: 'Investido' },
  { id: 'Num_Bets', accessorKey: 'Num_Bets', header: 'Qtd de apostas' },
]

const sanitizedAllResultsData = computed(() => {
  return props.allResultsData.map((item) => {
    return {
      ...item,
      modelId: modelNameToIdName(item.Method),
      Method: modelNameToNaturalName(item.Method),
      profitClass: item.Profit >= 0 ? 'text-teal-500' : 'text-red-500',
      roiClass: item.ROI >= 0 ? 'text-teal-500' : 'text-red-500',
      Profit: formatUnit(item.Profit),
      ROI: formatNumber(item.ROI),
      Responsibility: formatUnit(item.Responsibility, 0),
      Num_Bets: formatNumber(item.Num_Bets, 0),
    }
  })
})
</script>
