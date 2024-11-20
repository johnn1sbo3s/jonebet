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
			>
				<template #lay3x0V1-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay3x0V1 }}
						</span>
						<div
							class="flex items-center"
							v-if="row.lay3x0V1 != '' && row.FTHG != null"
						>
							<u-icon
								v-if="!resolveResult(row, 3, 0)"
								name="i-heroicons-check-circle"
								class="text-green-600 w-5 h-5"
							/>

							<u-icon
								v-if="resolveResult(row, 3, 0)"
								name="i-heroicons-x-circle"
								class="text-red-600 w-5 h-5"
							/>
						</div>
					</div>
				</template>

				<template #lay3x0Om-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay3x0Om }}
						</span>
						<div
							class="flex items-center"
							v-if="row.lay3x0Om != '' && row.FTHG != null"
						>
							<u-icon
								v-if="!resolveResult(row, 3, 0)"
								name="i-heroicons-check-circle"
								class="text-green-600 w-5 h-5"
							/>

							<u-icon
								v-if="resolveResult(row, 3, 0)"
								name="i-heroicons-x-circle"
								class="text-red-600 w-5 h-5"
							/>
						</div>
					</div>
				</template>

				<template #lay1x3V6-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay1x3V6 }}
						</span>

						<div
							class="flex items-center"
							v-if="row.lay1x3V6 != '' && row.FTHG != null"
						>
							<u-icon
								v-if="!resolveResult(row, 1, 3)"
								name="i-heroicons-check-circle"
								class="text-green-600 w-5 h-5"
							/>

							<u-icon
								v-if="resolveResult(row, 1, 3)"
								name="i-heroicons-x-circle"
								class="text-red-600 w-5 h-5"
							/>
						</div>
					</div>
				</template>

				<template #lay0x0V12-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay0x0V12 }}
						</span>

						<div
							class="flex items-center"
							v-if="row.lay0x0V12 != '' && row.FTHG != null"
						>
							<u-icon
								v-if="!resolveResult(row, 0, 0)"
								name="i-heroicons-check-circle"
								class="text-green-600 w-5 h-5"
							/>

							<u-icon
								v-if="resolveResult(row, 0, 0)"
								name="i-heroicons-x-circle"
								class="text-red-600 w-5 h-5"
							/>
						</div>
					</div>
				</template>
			</UTable>

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
		key: 'Time',
		label: 'Horário',
		sortable: true,
	},
	{
		key: 'Home',
		label: 'Casa',
		sortable: true,
	},
	{
		key: 'Away',
		label: 'Fora',
		sortable: true,
	},
	{
		key: 'lay1x3V6',
		label: 'Lay 1x3 V6',
		sortable: true,
	},
	{
		key: 'lay3x0V1',
		label: 'Lay 3x0 V1',
		sortable: true,
	},
	{
		key: 'lay3x0Om',
		label: 'Lay 3x0 OM',
		sortable: true,
	},
	{
		key: 'lay0x0V12',
		label: 'Lay 0x0 V12',
		sortable: true,
	},
]

const rows = computed(() => {
	let betsRows = Object.values(props.data).map((item) => ({
		...item,
		date: formatDate(item.Date),
		lay1x3V6: item?.lay_1x3_v6 ? modelNameToNaturalName(item.lay_1x3_v6) : '',
		lay3x0V1: item?.lay_3x0_v1 ? modelNameToNaturalName(item.lay_3x0_v1) : '',
		lay3x0Om: item?.lay_3x0_other_models ? 'Lay 3x0 OM' : '',
		lay0x0V12: item?.lay_0x0_v12 ? modelNameToNaturalName(item.lay_0x0_v12) : '',
	}));

	allColumns = allColumns.filter(column => {
		return betsRows.some(row => row[column.key] !== '' && row[column.key] !== null && row[column.key] !== undefined);
	});

	betsRows = betsRows.filter(row => row.date === chosenDay.value);

	return betsRows;
});

const availableDates = computed(() => {
	let dates = [...new Set(Object.values(props.data).map(item => formatDate(item.Date)))];
	dates = dates.slice(-7);

	return dates;
});

const columns = computed(() => allColumns);

onMounted(() => {
	chosenDay.value = availableDates.value.at(-1);
})

function resolveResult(game, homeScore, awayScore) {
	return (game.FTHG === homeScore && game.FTAG === awayScore);
}

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