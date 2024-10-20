<template>
	<div class="flex flex-col gap-5">
		<page-header title="Apostas para alavancagem" />

		<UTabs
			:items="tabItems"
			v-model="selected"
		>
			<template #default="{ item, selected }">
				<span
					class="truncate"
					:class="[selected && 'text-primary-500 dark:text-primary-400']"
				>
					{{ item.label }}
				</span>
			</template>

			<template #item="{ item }">
				<div class="flex flex-col gap-3 mt-4">
					<div
						v-if="item.key === 'jogos'"
						class="flex flex-col gap-3"
					>
						<USelectMenu
							class="w-1/5"
							placeholder="Selecione um dia"
							:options="availableDates"
							v-model="chosenDay"
						/>

						<leverage-bets-tab
							:data="leverageBets"
							:chosen-day="chosenDay"
						/>
					</div>

					<div v-else-if="item.key === 'placares'">
						<scores-probabilities-tab :data="Object.values(scoresData)" />
					</div>
				</div>
			</template>
		</UTabs>
	</div>
</template>

<script setup>
const apiUrl = useRuntimeConfig().public.API_URL;

const chosenDay = ref('');

const tabItems = [
	{
		key: 'jogos',
		label: 'Jogos para alavancagem',
		icon: 'i-heroicons-calendar-days',
	},
	{
		key: 'placares',
		label: 'Probabilidades de placares',
		icon: 'i-heroicons-sparkles',
	}
]
const requests = [
	useFetch(`${apiUrl}/leverage-bets`),
	useFetch(`${apiUrl}/scores-probabilities`),
];

const responses = await Promise.all(requests);

const { data: leverageBets } = responses[0];
const { data: scoresData } = responses[1];

const availableDates = computed(() => {
	let dates = [...new Set(Object.values(leverageBets.value).map(item => formatDate(item.Date)))];
	dates = dates.slice(-2);

	return dates;
});

onMounted(() => {
	chosenDay.value = availableDates.value.at(-1);
})

</script>

<style lang="scss" scoped>

</style>
