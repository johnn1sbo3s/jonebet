<template>
    <div>
        <div class="flex gap-2 mb-4">
            <USelectMenu
                class="w-1/5"
                placeholder="Selecione um dia"
                :options="datesOptions"
                v-model="chosenDay"
            />

            <USelectMenu
                class="w-1/5"
                placeholder="Selecione uma opção"
                :options="modelsOptions"
                v-model="chosenModel"
            />
        </div>

        <div class="flex gap-3">
            <div class="w-1/2">
                <game-card
                    class="w-full"
                    :data="filteredGames"
                    clicky
                />
            </div>

            <div
                class="w-1/2 h-full sticky top-4"
            >
                <div
                    class="w-full h-[50svh] flex items-center justify-center outline-dashed outline-1 outline-gray-400 p-10 rounded-md"
                >
                    <p class="text-center text-gray-400 text-2xl">
                        Selecione um card ao lado para ver o gráfico de acúmulo de capital do modelo.
                    </p>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>

const props = defineProps({
    data: {
        type: Array,
        required: true
    },
});

const acceptedModels = [
    'lay_2_goals_home',
    'lay_2_goals_away',
    'lay_away_v1_cluster',
    'lay_away_v3_cluster'
]

const chosenDay = ref(null);
const chosenModel = ref({ label: 'Todos os modelos', value: null });
const chosenGame = ref(null);

const filteredGames = computed(() => {
    let filtered = props.data.filter((item) => acceptedModels.includes(item.Modelo));
    filtered = filtered.filter((item) => formatDate(item.Date) === chosenDay.value);

    if (chosenModel.value.value) {
        filtered = filtered.filter((item) => item.Modelo === chosenModel.value.value);
    }

    return filtered;
});

const datesOptions = computed(() => {
	let dates = [...new Set(Object.values(props.data).map(item => formatDate(item.Date)))];
	dates = dates.slice(-7);

	return dates;
});

const modelsOptions = computed(() => {
    return [
        { label: 'Todos os modelos', value: null },
        ...acceptedModels.map((item) => ({
            label: modelNameToNaturalName(item),
            value: item
        }))
    ]
});

onMounted(() => {
    chosenDay.value = datesOptions.value.at(-1);
});

</script>

<style lang="scss" scoped>

</style>
