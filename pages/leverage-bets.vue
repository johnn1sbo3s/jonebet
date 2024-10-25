<template>
	<div class="flex flex-col gap-5">
		<page-header title="Apostas para alavancagem" />

		<UTabs
			:items="items"
			@change="onChange"
		/>

		<div v-if="selectedTab === 'jogos'">
				<leverage-bets-tab :data="leverageBets" />
		</div>

		<div v-else-if="selectedTab === 'placares'">
				<scores-probabilities-tab :data="Object.values(scoresData)" />
		</div>

	</div>
</template>

<script setup>
const apiUrl = useRuntimeConfig().public.API_URL;

const items = [
	{
		label: 'Jogos selecionados',
		value: 'jogos',
	},
	{
		label: 'Probabilidades de placares',
		value: 'placares'
	}
];

const requests = [
	useFetch(`${apiUrl}/leverage-bets`),
	useFetch(`${apiUrl}/scores-probabilities`),
];

const responses = await Promise.all(requests);

const { data: leverageBets } = responses[0];
const { data: scoresData } = responses[1];

const selectedTab = ref('jogos');

function onChange(tab) {
	selectedTab.value = items[tab].value;
}

</script>

<style lang="scss" scoped>

</style>
