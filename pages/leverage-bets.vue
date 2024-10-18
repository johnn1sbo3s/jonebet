<template>
	<div class="flex flex-col gap-5">
		<page-header title="Apostas para alavancagem" />

		<USelectMenu
			class="w-1/5"
			placeholder="Selecione um dia"
			:options="availableDates"
			v-model="chosenDay"
		/>

		<div>
			<UTable
				:rows="rows"
				:ui="tableUi"
				:columns="columns"
				:sort="{ column: 'time', direction: 'asc' }"
			></UTable>
		</div>
	</div>
</template>

<script setup>
const API_URL = useRuntimeConfig().public.API_URL;

const chosenDay = ref('');

const tableUi = { wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' };
let allColumns = [
	{
		key: 'date',
		label: 'Data',
		sortable: false,
	},
	{
		key: 'time',
		label: 'Horário',
		sortable: true,
	},
	{
		key: 'home',
		label: 'Casa',
		sortable: true,
	},
	{
		key: 'away',
		label: 'Fora',
		sortable: true,
	},
	{
		key: 'lay0x1',
		label: 'Lay 0x1',
		sortable: true,
	},
	{
		key: 'lay1x3V6',
		label: 'Lay 1x3 V6',
		sortable: true,
	},
	{
		key: 'lay2x0V1',
		label: 'Lay 2x0 V1',
		sortable: true,
	},
	{
		key: 'layGoleadaAwayV1',
		label: 'Lay Goleada Away V1',
		sortable: true,
	},
	{
		key: 'lay2x0V2',
		label: 'Lay 2x0 V2',
		sortable: true,
	},
]

const { data: leverageBets } = await useFetch(`${API_URL}/leverage-bets`);

const rows = computed(() => {
	let betsRows = Object.values(leverageBets.value).map((item) => ({
		date: formatDate(item.Date),
		time: item.Time,
		home: item.Home,
		away: item.Away,
		lay0x1: item.lay_0x1 ? modelNameToNaturalName(item.lay_0x1) : '',
		lay1x3V6: item?.lay_1x3_v6 ? modelNameToNaturalName(item.lay_1x3_v6) : '',
		lay2x0V1: item?.lay_2x0_v1 ? modelNameToNaturalName(item.lay_2x0_v1) : '',
		layGoleadaAwayV1: item?.lay_goleada_away_v1 ? modelNameToNaturalName(item.lay_goleada_away_v1) : '',
		lay2x0V2: item?.lay_2x0_v2 ? modelNameToNaturalName(item.lay_2x0_v2) : '',
	}));

	allColumns = allColumns.filter(column => {
		return betsRows.some(row => row[column.key] !== '' && row[column.key] !== null && row[column.key] !== undefined);
	});

	betsRows = betsRows.filter(row => row.date === chosenDay.value);

	return betsRows;
});

const availableDates = computed(() => {
	let dates = [...new Set(Object.values(leverageBets.value).map(item => formatDate(item.Date)))];
	dates = dates.slice(-2);

	return dates;
});

const columns = computed(() => allColumns);

onMounted(() => {
	chosenDay.value = availableDates.value.at(-1);
})

</script>

<style lang="scss" scoped>

</style>
