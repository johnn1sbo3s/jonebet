<template>
    <div>
        <div class="flex gap-2 mb-5">
            <USelectMenu
                class="w-1/2 sm:w-1/5"
                placeholder="Selecione um dia"
                :options="datesOptions"
                v-model="chosenDay"
            />
        </div>

        <div class="text-sm">{{ filteredGames.length }} jogos</div>

        <div class="flex gap-3 mt-2.5">
            <div class="w-full sm:w-1/2">
                <game-card
                    class="w-full"
                    :data="filteredGames"
                    :chosen="chosenGame"
                    clicky
                    @click="handleGameClick"
                />
            </div>

            <div class="w-1/2 h-full sticky top-4 hidden sm:block">
                <div
                    v-if="!chosenGame._id"
                    class="w-full h-[50svh] flex items-center justify-center outline-dashed outline-1 outline-gray-400 p-10 rounded-md"
                >
                    <p class="text-center text-gray-400 text-2xl">
                        Selecione um card ao lado para ver informações sobre o jogo
                    </p>
                </div>

                <div
                    v-else
                    class="w-full flex justify-center outline outline-1 outline-gray-200 p-10 rounded-md"
                >
                    <game-details-card
                        :chosen-game="chosenGame"
                        :games="data"
                    />
                </div>
            </div>
        </div>

        <UModal
            v-if="isMobile"
            v-model="showMobileModal"
        >
            <div class="flex flex-col gap-3 p-4 rounded-lg bg-white h-[60vh]">
                <div v-if="_isEmpty(chosenGame)"
                    class="flex flex-col items-center gap-2"
                >
                    <USkeleton
                        class="w-1/2 h-5"
                    />

                    <USkeleton
                        class="w-28 h-5"
                    />

                    <USkeleton
                        class="w-3/4 h-16 mt-8 mb-6"
                    />

                    <USkeleton
                        v-for="i in 5"
                        :key="i"
                        class="w-5/6 h-5 mb-2"
                    />
                </div>

                <game-details-card
                    :chosen-game="chosenGame"
                    :games="data"
                />
            </div>

            <div class="p-4">
                <UButton
                    block
                    color="gray"
                    variant="soft"
                    size="lg"
                    @click="() =>showMobileModal = false"
                >
                    Fechar
                </UButton>
            </div>
        </UModal>
    </div>
</template>

<script setup>

const { isMobile } = useDevice();

const props = defineProps({
    data: {
        type: Array,
        required: true
    },
});

const acceptedModels = [
    'lay_away_v1_cluster',
    'lay_away_v3_cluster',
    'lay_away_v4_cluster',
    'lay_away_v1_cluster_tr',
    'lay_away_v3_cluster_tr',
]

const chosenDay = ref({});
const chosenGame = ref({});
const showMobileModal = ref(false);

const filteredGames = computed(() => {
    let filtered = props.data.filter((item) => acceptedModels.includes(item.Modelo));
    filtered = filtered.filter((item) => formatDate(item.Date) === chosenDay.value);
    filtered = filtered.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.Home === item.Home && t.Date === item.Date && t.Away === item.Away
        ))
    );

    return filtered;
});

const datesOptions = computed(() => {
	let dates = [...new Set(Object.values(props.data).map(item => formatDate(item.Date)))];
	dates = dates.slice(-7);

	return dates;
});

onMounted(() => {
    chosenDay.value = datesOptions.value.at(-1);
});

watch(() => showMobileModal.value, (newValue) => {
    if (newValue === false) {
        setTimeout(() => {
            chosenGame.value = {};
        }, 300);
    }
});

function handleGameClick(game) {
    showMobileModal.value = true;

    if (game._id === chosenGame.value._id) {
        chosenGame.value = {};
        return;
    }

    chosenGame.value = game;
}

</script>

<style lang="scss" scoped>

</style>
