<template>
	<div class="flex flex-col gap-4">
		<USelectMenu
			class="w-1/5"
			placeholder="Selecione um dia"
			:options="availableDates"
			v-model="chosenDay"
		/>

		<div class="flex flex-col gap-3">
			<div class="flex justify-between items-end">
				<p v-if="rows.length > 0" class="text-sm">
					{{ rows.length }} apostas encontradas
				</p>

				<UButton
					icon="i-heroicons-arrow-down-tray"
					color="blue"
					size="sm"
					variant="soft"
					@click="exportTableToExcel(rows)"
				>
					Download
				</UButton>
			</div>

			<UTable
				:rows="rows"
				:ui="tableUi"
				:columns="columns"
				:sort="{ column: 'time', direction: 'asc' }"
			/>
		</div>
	</div>
</template>

<script setup>

const props = defineProps({
	data: {
		type: Object,
		required: true
	},
})

const chosenDay = ref('');
const tableUi = { wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' };

let allColumns = [
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
		key: 'lay1x3V6',
		label: 'Lay 1x3 V6',
		sortable: true,
	},
	{
		key: 'layGoleadaAwayV1',
		label: 'Lay Goleada Away V1',
		sortable: true,
	},
	{
		key: 'lay3x0V1',
		label: 'Lay 3x0 V1',
		sortable: true,
	},
]

const rows = computed(() => {
	let betsRows = Object.values(props.data).map((item) => ({
		date: formatDate(item.Date),
		time: item.Time,
		home: item.Home,
		away: item.Away,
		lay1x3V6: item?.lay_1x3_v6 ? modelNameToNaturalName(item.lay_1x3_v6) : '',
		layGoleadaAwayV1: item?.lay_goleada_away_v1 ? modelNameToNaturalName(item.lay_goleada_away_v1) : '',
		lay3x0V1: item?.lay_3x0_v1 ? modelNameToNaturalName(item.lay_3x0_v1) : '',
	}));

	allColumns = allColumns.filter(column => {
		return betsRows.some(row => row[column.key] !== '' && row[column.key] !== null && row[column.key] !== undefined);
	});

	betsRows = betsRows.filter(row => row.date === chosenDay.value);

	return betsRows;
});

const availableDates = computed(() => {
	let dates = [...new Set(Object.values(props.data).map(item => formatDate(item.Date)))];
	dates = dates.slice(-2);

	return dates;
});

const columns = computed(() => allColumns);

onMounted(() => {
	chosenDay.value = availableDates.value.at(-1);
})

async function exportTableToExcel(tableData) {
	const XLSX = await import('xlsx');
	const worksheet = XLSX.utils.json_to_sheet(tableData);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Tabela');

	XLSX.writeFile(workbook, `jogos_alavancagem_${chosenDay.value}.xlsx`);
}

</script>

<style lang="scss" scoped>

</style>