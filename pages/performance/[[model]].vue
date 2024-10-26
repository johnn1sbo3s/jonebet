<template>
	<div class="flex flex-col gap-3">
	<page-header title="Performance dos modelos" />
	<div class="flex gap-5">
		<USelectMenu
			class="w-1/5"
			searchable
			searchable-placeholder="Pesquise por um modelo"
			placeholder="Selecione um modelo"
			:options="listModels"
			v-model:model-value="chosenModel"
		>
			<template #option="{ option }">
				<div class="flex items-center my-1">
					<UTooltip
						v-if="playedYesterday(option)"
						text="O modelo possui atualização de resultados de ontem"
					>
						<span
							class="mr-2 w-2 h-2 bg-violet-500 rounded-full"
						/>
					</UTooltip>
					<span>{{ option }}</span>
				</div>
			</template>
		</USelectMenu>
	</div>
	<div class="w-full gap-3 flex">
		<div class="w-2/5 flex flex-col gap-3">
			<metrics-card
				:metrics-data="valData"
				:card-title="'Métricas de validação'"
			/>
			<metrics-card
				:metrics-data="realData"
				:card-title="'Métricas de jogos reais'"
			/>
		</div>
		<UCard class="w-3/5">
			<template #header>
				<div class="flex justify-between">
					<p class="font-semibold">Gráfico de acúmulo de capital</p>
					<div class="flex gap-2">
						<div class="inline-block align-middle">
						<UToggle
							size="md"
							on-icon="i-heroicons-check-20-solid"
							off-icon="i-heroicons-x-mark-20-solid"
							:model-value="chartByDay"
							@click="changeChartByDay"
						/>
						</div>
						<p class="text-sm">Exibição por dia</p>
					</div>
				</div>
			</template>
			<div>
				<div
					class="flex items-center mb-2"
					:class="slope != 0 ? 'justify-between' : 'justify-end'"
				>
					<div
						v-if="slope != 0"
						class="flex gap-3 text-sm"
					>
						<p>Trend Value: {{ slope.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
						<p>|</p>
						<p>Trend Distance: {{ trendDistance < 0 ? '' : '+' }}{{ trendDistance.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }} u</p>
					</div>

					<UButton color="blue" variant="soft" @click="resetsZoom">
						Restaurar zoom
					</UButton>
				</div>
				<LineChart
					class="w-full"
					:key="chartKey"
					:chartData="chartData"
					:options="chartOptions"
					:style="chartStyle"
				/>
			</div>
		</UCard>
	</div>
	<UCard>
		<template #header>
		<p class="font-semibold">Resultados por blocos de 100 jogos</p>
		</template>
		<div class="flex h-full gap-3">
		<div class="flex flex-col gap-3 w-2/5">
			<block-metrics-card
			:metrics-data="totalData"
			:card-title="'Médias'"
			/>
			<current-block-metrics-card
			:metrics-data="totalData"
			:card-title="'Bloco atual'"
			/>
		</div>
		<UCard class="w-2/3">
			<template #header>
			<p class="font-semibold">Histórico</p>
			</template>
			<div>
			<UTable
				class="h-80"
				:ui="{
				wrapper:
					'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
				}"
				:rows="blocksHistoryRows"
				:columns="blocksHistoryColumns"
			/>
			</div>
		</UCard>
		</div>
	</UCard>
	<div class="grid grid-cols-2 gap-3">
		<UCard>
		<template #header>
			<p class="font-semibold">Resultados por mês</p>
		</template>
		<p class="mb-3 text-sm">{{ monthlyBetsRows.length }} meses</p>
		<UTable
			class="h-80"
			:ui="{
			wrapper:
				'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
			}"
			:rows="monthlyBetsRows"
			:columns="monthlyBetsColumns"
		/>
		</UCard>
		<UCard>
		<template #header>
			<p class="font-semibold">Resultados por dia</p>
		</template>
		<p class="mb-3 text-sm">{{ dailyBetsRows.length }} dias</p>
		<UTable
			class="h-80"
			:ui="{
			wrapper:
				'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
			}"
			:rows="dailyBetsRows"
			:columns="dailyBetsColumns"
		/>
		</UCard>
	</div>
	<UCard>
		<template #header>
			<p class="font-semibold">Jogos reais</p>
		</template>

		<div class="flex justify-between items-end mb-3">
			<p
				class="text-sm">{{ realData.entradas }} jogos
			</p>

			<UButton
					icon="i-heroicons-arrow-down-tray"
					color="blue"
					size="sm"
					variant="soft"
					@click="exportTableToExcel(allBetsDataFilteredRows)"
				>
					Download
			</UButton>
		</div>

		<UTable
			class="h-96"
			:ui="{
				wrapper:
				'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
			}"
			:rows="allBetsDataFilteredRows"
			:columns="allBetsDataFilteredColumns"
		/>
	</UCard>
	</div>
</template>

<script setup>
import { DateTime } from 'luxon';
import { Chart, registerables } from "chart.js";
import { LineChart } from "vue-chart-3";
import * as XLSX from 'xlsx';

const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;

const performanceStore = usePerformanceStore();
const yesterdayStore = useYesterdayModelsStore();

const route = useRoute();

if (import.meta.client) {
	const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
	const annotationPlugin = (await import("chartjs-plugin-annotation")).default;
	Chart.register(zoomPlugin);
	Chart.register(annotationPlugin);
	Chart.register(...registerables);
}

const chartData = ref({
	labels: [],
	datasets: [
		{
			label: "Acúmulo de capital",
			data: [],
			borderColor: "#6d28d9",
			backgroundColor: "rgb(109, 40, 217, 0.05)",
			pointRadius: 1,
			pointHoverRadius: 7,
			fill: true,
			tension: 0.2,
		},
		{
			label: "Linha de tendência",
			data: [],
			borderColor: "rgb(59, 130, 246, 0.5)",
			borderWidth: 2,
			backgroundColor: "rgb(109, 40, 217, 0.0)",
			pointRadius: 0,
			pointHoverRadius: 7,
			fill: true,
			tension: 0.2,
		},
	],
});

const chartOptions = ref({
	responsive: true,
	maintainAspectRatio: false,
	transitions: {
	zoom: {
		animation: {
		duration: 1000,
		easing: "easeOutCubic",
		},
	},
	},
	scales: {
	y: {
		beginAtZero: false,
	},
	x: {
		beginAtZero: false,
	},
	},
	plugins: {
	legend: {
		position: "top",
		display: true,
	},
	zoom: {
		zoom: {
		wheel: {
			enabled: true,
		},
		pinch: {
			enabled: true,
		},
		mode: "x",
		drag: {
			enabled: true,
			borderColor: "rgb(20 184 166)",
			borderWidth: 1,
			backgroundColor: "rgba(20, 184, 166, 0.15)",
		},
		},
		pan: {
		enabled: true,
		mode: "x",
		modifierKey: "ctrl",
		},
	},
	annotation: {
		annotations: {
		line1: {
			type: "line",
			xMin: -100,
			xMax: -100,
			borderColor: "rgb(20 184 166)",
			borderWidth: 2,
		},
		},
	},
	},
});

const chartStyle = ref({
	height: "400px",
	width: "100%",
});

const blocksHistoryColumns = ref([
	{ key: "Profit", label: "Profit" },
	{ key: "Qtd_Jogos", label: "Quantidade de jogos" },
	{ key: "ROI", label: "ROI" },
	{ key: "Ult_Dia", label: "Último dia do bloco" },
]);

const dailyBetsColumns = ref([
	{ key: "date", label: "Dia" },
	{ key: "gain", label: "Profit" },
	{ key: "gameCount", label: "Jogos" },
	{ key: "accumulated", label: "Acumulado" },
]);

const monthlyBetsColumns = ref([
	{ key: "monthYear", label: "Mês" },
	{ key: "profit", label: "Profit" },
	{ key: "gameCount", label: "Jogos" },
	{ key: "accumulated", label: "Acumulado" },
]);

const allBetsDataFilteredColumns = ref([
	{ key: "Date", label: "Data" },
	{ key: "Home", label: "Casa" },
	{ key: "Away", label: "Fora" },
	{ key: "Odds", label: "Odds" },
	{ key: "Resultado", label: "Resultado" },
	{ key: "Profit", label: "Profit" },
]);

const realData = ref({});
const valData = ref({});
const totalData = ref({});
const listModels = ref([]);
const objectModel = ref({});
const chartKey = ref(0);
const chartByDay = ref(false);
const blocksHistoryRows = ref([]);
const dailyBetsRows = ref([]);
const monthlyBetsRows = ref([]);
const slope = ref(0);
const intercept = ref(0);
const trendDistance = ref(0);

const yesterday = DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd');
const dayBeforeYesterday = DateTime.now().minus({ days: 2 }).toFormat('yyyy-MM-dd');

const fetchAllData = async () => {
	const [performanceData, betsData, yesterdayData, dayBeforeYesterdayData] = await Promise.all([
	fetch(`${apiUrl}/model-performance`),
	fetch(`${apiUrl}/model-bets`),
	fetch(`${apiUrl}/daily-results/${yesterday}`, { params: { filtered: false }}).catch(() => ({ ok: false, json: () => ({}) })),
	fetch(`${apiUrl}/daily-results/${dayBeforeYesterday}`, { params: { filtered: false }}),
	]);

	const [performanceDataJson, betsDataJson, yesterdayDataJson, dayBeforeYesterdayDataJson] = await Promise.all([
		performanceData.json(),
		betsData.json(),
		yesterdayData.ok ? yesterdayData.json() : {},
		dayBeforeYesterdayData.json(),
	]);

	return [performanceDataJson, betsDataJson, yesterdayDataJson, dayBeforeYesterdayDataJson];
};

if (_isEmpty(performanceStore.getBetsData) || _isEmpty(yesterdayStore.getYesterdayModels)) {
	const [performanceData, betsData, yesterdayData, dayBeforeYesterdayData] = await fetchAllData();
	performanceStore.setPerformanceData(performanceData);
	performanceStore.setBetsData(betsData);

	if (_isEmpty(yesterdayData)) {
		yesterdayStore.setYesterdayModels(dayBeforeYesterdayData);
	} else {
		yesterdayStore.setYesterdayModels(yesterdayData);
	}
}

const performanceData = performanceStore.getPerformanceData;
const betsData = performanceStore.getBetsData;
const yesterdayModelsNames = computed(() => _map(yesterdayStore.getYesterdayModels.slice(0, -1), 'Method'));

const changeChartByDay = () => {
	chartByDay.value = !chartByDay.value;
};

Object.values(performanceData).forEach((item) => {
	let name = modelNameToNaturalName(item.modelo);
	if (!listModels.value.includes(name)) {
	listModels.value.push(name);
	}
});

const chosenModel = ref(listModels.value[0]);
route.params.model ? chosenModel.value = modelNameToNaturalName(route.params.model) : chosenModel.value = listModels.value[0];

const changeModel = () => {
	Object.values(performanceData).forEach((item) => {
	let name = item.modelo;
	if (name === modelNameToIdName(chosenModel.value)) {
		objectModel.value = item;
		const { real } = objectModel.value;
		const { val } = objectModel.value;
		const { total } = objectModel.value;
		realData.value = real;
		valData.value = val;
		totalData.value = total;
		blocksHistoryRows.value = totalData.value.blocks_history;
	}
	});
};

const getBetsArray = () => {
	let betsToShow = totalData.value.pl_history;
	let nRange = -100;

	slope.value = 0;

	const cumulativeBets = resultsByDay(betsToShow);
	dailyBetsRows.value = buildDailyTable(cumulativeBets);
	monthlyBetsRows.value = buildMonthlyTable(dailyBetsRows.value);

	if (chartByDay.value === false) {
		nRange = valData.value.entradas;
		const profitList = betsToShow.map((item) => item.Profit);
		cumulativeSum(profitList);
		const [calculatedSlope, calculatedIntercept] = calculateSlopeAndIntercept(profitList);
		slope.value = calculatedSlope;
		intercept.value = calculatedIntercept;
		chartData.value.datasets[1].data = generateTrendLine(slope.value, intercept.value, profitList.length);
		trendDistance.value = chartData.value.datasets[0].data.at(-1) - chartData.value.datasets[1].data.at(-1);
	} else {
		const lastDayVal = ref(
			_findLast(betsToShow.slice(0, valData.value.entradas), "Date").Date
		);

		const datesList = Object.keys(cumulativeBets);
		const profitList = Object.values(cumulativeBets).map((obj) => obj.profit);
		nRange = _filter(datesList, (date) => date <= lastDayVal.value).length;
		chartData.value.labels = datesList;
		chartData.value.datasets[0].data = profitList;
		chartData.value.datasets[1].data = [];
	}
	chartOptions.value.plugins.annotation.annotations.line1.xMax = nRange;
	chartOptions.value.plugins.annotation.annotations.line1.xMin = nRange;
};

const allBetsDataFilteredRows = computed(() => {
	let name = modelNameToIdName(chosenModel.value);
	let filteredBets = _filter(betsData, { Metodo: name });
	filteredBets = _uniqWith(filteredBets, (a, b) => a.Date === b.Date && a.Home === b.Home && a.Away === b.Away);
	return _sortBy(filteredBets, ['Date']);
});

function calculateSlopeAndIntercept(bets) {
	const n = bets.length;
	const games = Array.from({ length: n }, (_, i) => i);

	// Calcular o saldo acumulado jogo a jogo
	const accumulatedCapital = [];
	bets.reduce((acc, bet, i) => {
		acc += bet;
		accumulatedCapital[i] = acc;
		return acc;
	}, 0);

	// Calcular as somas necessárias para a regressão linear
	const sumGames = games.reduce((acc, curr) => acc + curr, 0);
	const sumCapital = accumulatedCapital.reduce((acc, curr) => acc + curr, 0);
	const sumProduct = games.reduce((acc, curr, i) => acc + curr * accumulatedCapital[i], 0);
	const sumSquareGames = games.reduce((acc, curr) => acc + curr * curr, 0);

	// Calcula o slope (m)
	let slope = (n * sumProduct - sumGames * sumCapital) / (n * sumSquareGames - sumGames * sumGames);

	// Calcula o intercepto (b)
	let intercept = (sumCapital - slope * sumGames) / n;

	return [slope, intercept];
}

function generateTrendLine(slope, intercept, n) {
	// Gerar os pontos da linha de tendência (y = mx + b)
	const trendLine = [];
	for (let i = 0; i < n; i++) {
		const y = slope * i + intercept;
		trendLine.push(y);
	}

	return trendLine;
}

function cumulativeSum(array) {
	if (array.length === 0) {
		return [];
	}

	let cumSum = [array[0]];
	let listIndex = [];

	for (let i = 1; i < array.length; i++) {
		cumSum.push(cumSum[i - 1] + array[i]);
	}

	for (let i = 1; i < array.length + 10; i++) {
		listIndex.push(i);
	}

	chartData.value.labels = listIndex;
	chartData.value.datasets[0].data = cumSum;
}

function resetsZoom() {
	chartKey.value++;
}

const changeChartData = () => {
	getBetsArray();
};

const buildInfo = () => {
	changeModel();
	changeChartData();
	chartKey.value++;
};

function playedYesterday(modelName) {
	const lowerNames = yesterdayModelsNames.value.map(name => name.toLowerCase());
	return lowerNames.includes(modelName.toLowerCase());
}

function exportTableToExcel(tableData) {
	const worksheet = XLSX.utils.json_to_sheet(tableData);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Tabela');

	XLSX.writeFile(workbook, `jogos_reais_${chosenModel.value}.xlsx`);
}

watchEffect(() => {
	buildInfo();
});
</script>

<style lang="scss" scoped></style>