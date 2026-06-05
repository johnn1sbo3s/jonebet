<template>
    <u-card class="w-full h-full">
        <template #header>
            <div class="flex justify-between items-center">
                <p class="font-semibold">{{ title }}</p>
                <u-button
                    color="secondary"
                    size="xs"
                    variant="soft"
                    @click="isModalOpen = true"
                >
                    Ver todos
                </u-button>
            </div>
        </template>

        <template #default>
            <div class="flex flex-col gap-4">
                <div
                    v-for="item in items"
                    :key="item.id"
                    class="flex items-center justify-between"
                >
                    <nuxt-link :to="`/performance/${modelNameToIdName(item.name)}`">
                        <div class="hover:text-teal-600 hover:cursor-pointer">{{ modelNameToNaturalName(item.name) }}</div>
                    </nuxt-link>
                    <div
                        class="font-semibold"
                        :class="item.profit >= 0 ? 'text-teal-600' : 'text-red-600'"
                    >
                        {{ item.profit.toLocaleString() }} u
                    </div>
                </div>
            </div>
        </template>
    </u-card>

    <u-modal
        v-model:open="isModalOpen"
        :title="`Todos os modelos — ${formatDate(sanitizedAllResultsData[0]?.Date)}`"
    >
        <template #body>
            <div class="overflow-x-auto">
                <u-table
                    :data="sanitizedAllResultsData"
                    :columns="columns"
                />
            </div>
        </template>
    </u-modal>
</template>

<script setup>

const props = defineProps({
    items: {
        type: Array,
        required: true,
        default: () => []
    },
    title: {
        type: String,
        required: true,
        default: () => ""
    },
    allResultsData: {
        type: Array,
        required: true,
        default: () => []
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
            Profit: item.Profit.toLocaleString('pt-BR'),
            ROI: item.ROI.toLocaleString('pt-BR'),
            Num_Bets: item.Num_Bets.toLocaleString('pt-BR')
        };
    });
});

</script>