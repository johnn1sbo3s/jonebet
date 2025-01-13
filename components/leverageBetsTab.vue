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
				<template #Time-data="{ row }">
					<div class="flex items-center">
						<span
							v-if="isGameLive(row)"
							class="mr-2 w-2 h-2 bg-teal-500 rounded-full animate-pulse"
						/>

						{{ row.Time }}
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
							<result-icon :lost-result="resolveResult(row, 1, 3)" :result="resolveGameResultString(row)" />
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
							<result-icon :lost-result="resolveResult(row, 3, 0)" :result="resolveGameResultString(row)" />
						</div>
					</div>
				</template>

				<template #lay0x3V1-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay0x3V1 }}
						</span>

						<div
							class="flex items-center"
							v-if="row.lay0x3V1 != '' && row.FTHG != null"
						>
							<result-icon :lost-result="resolveResult(row, 0, 3)" :result="resolveGameResultString(row)" />
						</div>
					</div>
				</template>

				<template #lay0x0Footy-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay0x0Footy }}
						</span>

						<div
							class="flex items-center"
							v-if="row.lay0x0Footy != '' && row.FTHG != null"
						>
							<result-icon :lost-result="resolveResult(row, 0, 0)" :result="resolveGameResultString(row)" />
						</div>
					</div>
				</template>

				<template #lay0x0V19-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay0x0V19 }}
						</span>

						<div
							class="flex items-center"
							v-if="row.lay0x0V19 != '' && row.FTHG != null"
						>
							<result-icon :lost-result="resolveResult(row, 0, 0)" :result="resolveGameResultString(row)" />
						</div>
					</div>
				</template>

				<template #lay1x3V7-data="{ row }">
					<div class="flex items-center gap-1">
						<span>
							{{ row.lay1x3V7 }}
						</span>

						<div
							class="flex items-center"
							v-if="row.lay1x3V7 != '' && row.FTHG != null"
						>
							<result-icon :lost-result="resolveResult(row, 1, 3)" :result="resolveGameResultString(row)" />
						</div>
					</div>
				</template>
			</UTable>

		</div>
	</div>
</template>

<script setup>
import { DateTime } from 'luxon';

const props = defineProps({
	data: {
		type: Object,
		required: true
	},
})

const chosenDay = ref('');
const tableUi = { wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' };
const timeNow = ref(DateTime.now());

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
		key: 'lay3x0Om',
		label: 'Lay 3x0 OM',
		sortable: true,
	},
	{
		key: 'lay0x3V1',
		label: 'Lay 0x3 V1',
		sortable: true,
	},
	{
		key: 'lay0x0Footy',
		label: 'Lay 0x0 Footy',
		sortable: true,
	},
	{
		key: 'lay0x0V19',
		label: 'Lay 0x0 V19',
		sortable: true,
	},
	{
		key: 'lay1x3V7',
		label: 'Lay 1x3 V7',
		sortable: true,
	},
]

const rows = computed(() => {
	let betsRows = Object.values(props.data).map((item) => ({
		...item,
		date: formatDate(item.Date),
		lay1x3V6: item?.lay_1x3_v6 ? 'Lay 1x3 V6' : '',
		lay3x0Om: item?.lay_3x0_other_models ? 'Lay 3x0 OM' : '',
		lay0x3V1: item?.lay_0x3_v1_betfair ? 'Lay 0x3 V1' : '',
		lay0x0Footy: item?.lay_0x0_footy ? 'Lay 0x0 Footy' : '',
		lay0x0V19: item?.lay_0x0_v19 ? 'Lay 0x0 V19' : '',
		lay1x3V7: item?.lay_1x3_v7 ? 'Lay 1x3 V7' : '',
	}));

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

	setInterval(() => {
		timeNow.value = DateTime.now();
	}, 1000 * 60 * 3);
})

function resolveResult(game, homeScore, awayScore) {
	if (homeScore === 404) {
		return (game.FTHG + game.FTAG >= awayScore);
	}
	return (game.FTHG === homeScore && game.FTAG === awayScore);
}

function resolveGameResultString(game) {
	return `${game.Home} ${game.FTHG} x ${game.FTAG} ${game.Away}`;
}

function isGameLive(game) {
	if (!game || formatDate(game.Date) != formatDate(new Date().toISOString().split('T')[0])) {
		return false;
	}

	let now = timeNow.value;
	let gameTime = DateTime.fromFormat(game.Time, 'HH:mm');
	let diffInMinutes = now.diff(gameTime, 'minutes').minutes;

	return diffInMinutes >= 0 && diffInMinutes <= 120;
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