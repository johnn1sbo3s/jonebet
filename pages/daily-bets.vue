<template>
  <div class="flex flex-col gap-5">
	<div class="flex justify-between">
		<page-header title="Apostas do dia" />
	</div>

	<div class="flex gap-2 items-center">
	  <USelect class="w-1/2 sm:w-1/5" v-model="date" :options="dates" />
	  <USelect class="w-1/2 sm:w-1/5" v-model="selectedModel" :options="modelsOptions" />
	</div>

	<div>
	  <div class="flex justify-between items-center mb-3">
		<div class="text-sm text-slate-400" v-if="bets.length > 0">
			{{ qtd_games }} apostas encontradas
		</div>

		<UButton
			icon="i-heroicons-arrow-down-tray"
			variant="soft"
			color="blue"
			@click="exportTableToExcel(bets)"
		>
			Download
		</UButton>
	  </div>
	  <UTable
		:ui="{
		  wrapper:
			'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
		}"
		:rows="bets"
		:columns="columns"
		:sort="sort"
		class="bg-slate-900"
	  />
	</div>
  </div>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;

const sort = { column: "Time", direction: "asc" };

const columns = [
  { key: "Date", label: "Data" },
  { key: "Time", label: "Horário", sortable: true },
  { key: "Home", label: "Casa", sortable: true },
  { key: "Away", label: "Fora", sortable: true },
  { key: "FT_Odds_H", label: "Odds casa" },
  { key: "FT_Odds_D", label: "Odds empate" },
  { key: "FT_Odds_A", label: "Odds fora" },
  { key: "Modelo", label: "Modelo", sortable: true },
];

const filterByDate = (selectedDate) => {
  return Object.values(games).filter((item) => item.Date === selectedDate);
};

const normalizeColumns = (object_data) => {
  object_data.forEach((item) => {
	item.Modelo = item.Modelo.replace(/_/g, " ").replace(/\b\w/g, (c) =>
	  c.toUpperCase()
	);
	item.FT_Odds_H = parseFloat(item.FT_Odds_H).toFixed(2);
	item.FT_Odds_D = parseFloat(item.FT_Odds_D).toFixed(2);
	item.FT_Odds_A = parseFloat(item.FT_Odds_A).toFixed(2);
  });

  return object_data;
};

const fetchData = async () => {
  try {
	const req = await fetch(`${apiUrl}/daily-bets`);
	const data = await req.json();
	return data;
  } catch (error) {
	console.error("Erro ao buscar os dados:", error);
	return [];
  }
};

const dates = ref([]);
const uniqueDates = new Set();
const selectedModel = ref("Todos os modelos");

const games = await fetchData();

Object.values(games).forEach((item) => {
  uniqueDates.add(item.Date);
});
dates.value = Array.from(uniqueDates).slice(-7);
const date = ref(dates.value[dates.value?.length - 1]);

const modelsOptions = computed(() => {
	let uniqueModels = new Set();
	Object.values(games).filter((item) => item.Date === date.value)
		.forEach((item) => {
			uniqueModels.add(item.Modelo);
		});

	return [
		{ value: null, label: "Todos os modelos" },
		...Array.from(uniqueModels)
			.map((item) => modelNameToNaturalName(item))
			.sort((a, b) => a.localeCompare(b)),
	];
});

const bets = ref([]);

watch(() => date.value, () => {
	selectedModel.value = "Todos os modelos";
});

const buildTableData = async (chosenDate) => {
  try {
	let filteredBets = filterByDate(chosenDate);
	if (selectedModel.value !== "Todos os modelos") {
		filteredBets = filteredBets.filter((item) => item.Modelo === selectedModel.value);
	}
	normalizeColumns(filteredBets);
	bets.value = filteredBets;
  } catch (error) {
	console.error("Erro ao buscar apostas do dia:", error);
	bets.value = []; // Limpar a lista em caso de erro
  }
};

const qtd_games = computed(() => bets.value.length);

watchEffect(() => {
  buildTableData(date.value);
});

async function exportTableToExcel(tableData) {
	const XLSX = await import('xlsx');
	const worksheet = XLSX.utils.json_to_sheet(tableData);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Tabela');

	XLSX.writeFile(workbook, `jogos_do_dia_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
</script>


<style>
</style>