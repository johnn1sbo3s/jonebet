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
        :title="title"
    >
        <template #body>
            <u-table
                style="width: 45dvw;"
                :rows="sanitizedAllResultsData"
                :columns="columns"
            />
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

const isModalOpen = ref(false);
const columns = [
    { id: "Date", key: "Date", label: "Data", sortable: false },
    { id: "Method", key: "Method", label: "Modelo", sortable: false },
    { id: "Profit", key: "Profit", label: "Lucro", sortable: false },
    { id: "ROI", key: "ROI", label: "ROI", sortable: false },
    { id: "Responsibility", key: "Responsibility", label: "Investido", sortable: false },
    { id: "Num_Bets", key: "Num_Bets", label: "Qtd de apostas", sortable: false },
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