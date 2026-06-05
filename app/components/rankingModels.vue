<template>
    <UCard class="w-full h-full bg-[#1a1a1a] border border-[#2a2a2a]">
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
            <div class="flex flex-col gap-4">
                <div
                    v-for="item in items"
                    :key="item.id"
                    class="flex items-center justify-between"
                >
                    <NuxtLink :to="`/performance/${modelNameToIdName(item.name)}`">
                        <div class="hover:text-[#14B8A6] hover:cursor-pointer">{{ modelNameToNaturalName(item.name) }}</div>
                    </NuxtLink>

                    <div
                        class="font-semibold"
                        :class="item.profit >= 0 ? 'text-[#14B8A6]' : 'text-[#ef4444]'"
                    >
                        {{ item.profit.toLocaleString() }} u
                    </div>
                </div>
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
                            :class="item.ProfitRaw >= 0 ? 'text-[#14B8A6]' : 'text-[#ef4444]'"
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
