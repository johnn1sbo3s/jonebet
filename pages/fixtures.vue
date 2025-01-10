<template>
	<div class="flex flex-col gap-5">
		<page-header title="Jogos do dia" />

		<UTabs
			:items="items"
			@change="onChange"
		/>

		<div v-if="selectedTab === 'games'">
			<!-- <div v-if="isLoading"> Loading... </div> -->
			<fixtures-list-skeleton v-if="isLoading" />
			<fixtures-list
				v-else
				:fixtures="fixturesToUse"
				:selected-date="selectedDate"
				:initial-date="initialDate"
				:bets="bets"
				@change="onChangeDate"
			/>
		</div>

		<div v-else-if="selectedTab === 'two_goals'">
			vamo
		</div>
	</div>
</template>

<script setup>
import { DateTime } from 'luxon';

const apiUrl = useRuntimeConfig().public.API_URL;

const today = DateTime.now().toFormat('yyyy-MM-dd');
const tomorrow = DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd');
const initialDate = ref('');
const selectedDate = ref('');
const isLoading = ref(true);

const fixturesToUse = ref([]);

const items = [
	{
		label: 'Jogos do dia',
		value: 'games',
	},
	{
		label: 'Meu bilhete',
		value: 'betSlip',
	},
];

const selectedTab = ref('games');

const requests = [
	useFetch(`${apiUrl}/fixtures`, { params: { date: today } }),
    useFetch(`${apiUrl}/fixtures`, { params: { date: tomorrow } }),
	useFetch(`${apiUrl}/daily-bets`),
];

const responses = await Promise.all(requests);
const { data: todayFixtures } = responses[0];
const { data: tomorrowFixtures } = responses[1];
const { data: bets } = responses[2];

onMounted(() => {
	resolveFixtures();
});

function resolveFixtures() {
	if (_isEmpty(tomorrowFixtures.value)) {
		fixturesToUse.value = todayFixtures.value;
		initialDate.value = today;
		selectedDate.value = today;

		isLoading.value = false;
		return;
	}

	fixturesToUse.value = tomorrowFixtures.value;
	initialDate.value = tomorrow;
	selectedDate.value = tomorrow;
	isLoading.value = false;
	return;
}

function onChange(tab) {
	selectedTab.value = items[tab].value;
}

async function onChangeDate(date) {
	selectedDate.value = date;
	let transformedDate = date.split('/').reverse().join('-');
	isLoading.value = true;
	const { data } = await useFetch(`${apiUrl}/fixtures`, { params: { date: transformedDate } });
	fixturesToUse.value = data.value;
	isLoading.value = false;
}

</script>

<style lang="scss" scoped>

</style>
