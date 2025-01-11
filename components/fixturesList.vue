<template>
    <div>
        <div class="flex gap-6 items-baseline">
            <USelectMenu
                class="w-1/5"
                placeholder="Selecione um dia"
                :options="datesOptions"
                v-model="chosenDay"
            />

            <UTabs
                :items="tabItems"
                @change="onTabChange"
            />
        </div>

        <div class="mb-3 text-sm mt-5">
            {{ internalFixtures.length }} jogos
        </div>

        <div class="flex gap-3">
            <div class="w-1/2">
                <fixture-card
                    class="w-full"
                    :fixtures="internalFixtures"
                    :bets="bets"
                    :chosen="chosenGame"
                    @click="handleGameClick"
                />
            </div>

            <div class="w-1/2 h-full sticky top-4">
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
                    class="w-full flex justify-center outline outline-1 outline-gray-400 p-10 rounded-md"
                >
                    <fixture-details-card
                        :fixture="chosenGame"
                        :bets="filteredBets"
                    />
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
const props = defineProps({
    fixtures: {
        type: Array,
        required: true
    },
    bets: {
        type: Array,
        required: true
    },
    selectedDate: {
        type: String,
        default: ''
    },
    initialDate: {
        type: String,
        default: ''
    },
});

const emits = defineEmits(['change', 'source-change']);

const tabItems = [
    {
        label: 'Exchange',
        value: 'exchange',
    },
	{
		label: 'Bookie',
		value: 'bookie',
	},
];

const internalFixtures = ref([]);
const chosenDay = ref(props.selectedDate);
const chosenGame = ref({});
const filteredBets = ref([]);
const selectedTab = ref('exchange');
const betfairFixtures = ref(true);

const datesOptions = computed(() => {
    let dates = [];
    let currentDate = new Date(props.initialDate);

    for (let i = 0; i < 7; i++) {
        let virtualDate = new Date(currentDate.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        dates.push(formatDate(virtualDate));
    }

    return dates;
});

watch(() => props.fixtures, (value) => {
    internalFixtures.value = value.sort((a, b) => a.Time > b.Time ? 1 : -1);
}, { immediate: true });

watch(() => chosenDay.value, (newValue, oldValue) => {
    if (newValue === oldValue) return;
    emits('change', newValue);
});

watch(() => betfairFixtures, () => {
    emits('source-change', betfairFixtures.value);
}, { deep: true });

function onTabChange(tab) {
    selectedTab.value = tabItems[tab].value;
    selectedTab.value == 'bookie' ? betfairFixtures.value = false : betfairFixtures.value = true;
}

function handleGameClick(game) {
    if (game._id === chosenGame.value._id) {
        chosenGame.value = {};
        return;
    }

    chosenGame.value = game;
    filterBets();
}

function filterBets() {
    filteredBets.value = props.bets.filter((bet) => {
        return bet.Home === chosenGame.value.Home && bet.Away === chosenGame.value.Away;
    })
}

</script>

<style lang="scss" scoped>

</style>
