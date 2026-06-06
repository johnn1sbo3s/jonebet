<template>
    <UCard class="w-full h-full bg-zinc-950/80 border border-zinc-800">
        <template #header>
            <div class="flex justify-between items-center">
                <p class="font-semibold">{{ title }}</p>

                <UButton
                    color="secondary"
                    size="xs"
                    variant="soft"
                    @click="isModalOpen = true"
                >
                    Ver todos
                </UButton>
            </div>
        </template>

        <template #default>
            <div class="flex flex-col gap-2">
                <NuxtLink
                    v-for="item in items"
                    :key="item.id"
                    :to="`/performance/${modelNameToIdName(item.name)}`"
                    class="ranking-item flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm cursor-pointer relative overflow-hidden"
                >
                    <span class="relative z-10">{{ modelNameToNaturalName(item.name) }}</span>

                    <span
                        class="font-semibold relative z-10"
                        :class="item.profit >= 0 ? 'text-teal-500' : 'text-red-500'"
                    >
                        {{ item.profit.toLocaleString() }} u
                    </span>
                </NuxtLink>
            </div>
        </template>
    </UCard>

    <UModal
        v-model:open="isModalOpen"
        :title="`Todos os modelos — ${formatDate(sanitizedAllResultsData[0]?.Date)}`"
        :ui="{ content: 'max-w-3xl' }"
    >
        <template #body>
            <UTable
                v-if="!isMobile"
                :data="sanitizedAllResultsData"
                :columns="columns"
            />

            <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto">
                <div
                    v-for="(item, index) in sanitizedAllResultsData"
                    :key="index"
                    class="border border-default rounded-lg p-3"
                >
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold">{{ item.Method }}</span>

                        <span
                            class="font-bold text-sm"
                            :class="item.ProfitRaw >= 0 ? 'text-teal-500' : 'text-red-500'"
                        >
                            {{ item.Profit }} u
                        </span>
                    </div>

                    <div class="flex gap-2 text-sm text-muted">
                        <span>ROI: {{ item.ROI }}%</span>

                        <span>|</span>

                        <span>Investido: {{ item.Responsibility }} u</span>

                        <span>|</span>

                        <span>{{ item.Num_Bets }} apostas</span>
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup>

const { isMobile } = useDevice();

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
  }
})

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const isModalOpen = ref(false);
const columns = [
  {
    accessorKey: "Method",
    header: "Modelo",
    cell: ({ row }) => modelNameToNaturalName(row.getValue("Method"))
  },
  { accessorKey: "Profit", header: "Lucro" },
  { accessorKey: "ROI", header: "ROI" },
  { accessorKey: "Responsibility", header: "Investido" },
  { accessorKey: "Num_Bets", header: "Qtd de apostas" },
];

const sanitizedAllResultsData = computed(() => {
  return props.allResultsData.map(item => {
    return {
      ...item,
      ProfitRaw: item.Profit,
      Profit: item.Profit.toLocaleString('pt-BR'),
      ROI: item.ROI.toLocaleString('pt-BR'),
      Num_Bets: item.Num_Bets.toLocaleString('pt-BR')
    };
  });
});

</script>
<style scoped>
.ranking-item::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
    );
    transition: transform 0.6s ease;
}

.ranking-item:hover::after {
    transform: translateX(100%);
}
</style>
