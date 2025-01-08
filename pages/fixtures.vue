<template>
	<div class="flex flex-col gap-5">
		<page-header title="Jogos do dia" />
        {{ fixturesToUse }}
		<UTabs
			:items="items"
			@change="onChange"
		/>

		<div v-if="selectedTab === 'jogos'">
				<leverage-bets-tab :data="leverageBets" />
		</div>

		<div v-else-if="selectedTab === 'two_goals'">
				<two-goals-tab :data="dailyBets" />
		</div>

		<div v-else-if="selectedTab === 'placares'">
				<scores-probabilities-tab :data="Object.values(scoresData)" />
		</div>

	</div>
</template>

<script setup>
import { DateTime } from 'luxon';

const apiUrl = useRuntimeConfig().public.API_URL;

// const today = DateTime.now().toFormat('yyyy-MM-dd');
const today = '2024-12-23';
const tomorrow = DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd');

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
];

const responses = await Promise.all(requests);
const { data: todayFixtures } = responses[0];
const { data: tomorrowFixtures } = responses[1];

console.log(todayFixtures.value);

const fixturesToUse = computed(() => {
	if (_isEmpty(tomorrowFixtures.value)) {
        console.log('tomorrow is empty. Vamos de today: ', today);
		return todayFixtures.value;
	}

	return tomorrowFixtures.value;
});


function onChange(tab) {
	selectedTab.value = items[tab].value;
}

</script>

<style lang="scss" scoped>

</style>
