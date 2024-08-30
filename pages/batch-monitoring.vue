<template>
	<div class="flex flex-col gap-4">
		<div class="flex justify-between items-start">
			<page-header title="Monitoramento em lotes" />
			<div class="flex items-center gap-2">
				<div class="pt-2 flex gap-3">
					<UToggle
					size="md"
					on-icon="i-heroicons-check-20-solid"
					off-icon="i-heroicons-x-mark-20-solid"
					:model-value="chosenModelsOnly"
					@click="chosenModelsOnly = !chosenModelsOnly"
					/>
				</div>
				<div class="text-sm pt-1.5">Apenas modelos selecionados</div>
			</div>
		</div>
		<u-input
			v-model="filterString"
			class="w-1/5"
			variant="outline"
			placeholder="Buscar modelo"
		/>
		<div
			v-if="sortedSanitizedData.length"
			class="pl-0.5 w-[590px] flex justify-between"
		>
			<p class="text-sm">{{ sortedSanitizedData.length }} modelos</p>
			<i v-if="!invertOrder" class="i-heroicons-bars-arrow-down text-xl hover:cursor-pointer" @click="invertCardsOrder"></i>
			<i v-else class="i-heroicons-bars-arrow-up text-xl hover:cursor-pointer" @click="invertCardsOrder"></i>
		</div>
		<div
			v-else
			class="h-[20px] w-full"
		>
		</div>
		<div class="flex gap-4">
			<div class="flex justify-between">
				<div
					v-if="!sortedSanitizedData.length"
					class="h-20 w-[589px] flex items-center justify-center"
				>
					<i>Nenhum modelo encontrado</i>
				</div>
				<div class="p-0.5 pr-4 max-h-screen-80 overflow-auto flex flex-col gap-4">
					<batch-card
						:class="item._id === chosenModel._id ? 'outline outline-violet-400 outline-1' : ''"
						v-for="item in sortedSanitizedData"
						:key="item._id"
						:metric-item="item"
						:selected-id="chosenModel._id"
						@click="chosenModel = item"
					/>
				</div>
			</div>
			<div
				class="w-full h-[520px] flex items-center justify-center outline-dashed outline-1 outline-gray-400 p-10 rounded-md"
				v-if="!chosenModel._id"
			>
				<p class="text-center text-gray-400 text-2xl">
					Selecione um card ao lado para ver o gráfico de acúmulo de capital do modelo.
				</p>
			</div>
			<u-card
				v-else
				class="w-full h-min"
			>
				<template #header>
					<div class="flex justify-between">
						<p class="font-semibold self-center">{{ chosenModel.modelo }}</p>
						<UButton color="blue" variant="soft" @click="resetsZoom">
							Restaurar zoom
						</UButton>
					</div>
				</template>
				<div class="flex flex-col gap-3">
					<LineChart
						:chartData="chartData"
						:options="chartOptions"
						:style="chartStyle"
						:key="chartKey"
					/>
					<UTable
						class="max-h-screen-30"
						:ui="{
							wrapper:
							'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg',
						}"
						:rows="chosenModel.blocks"
						:columns="blocksTableColumns"
					/>
				</div>
			</u-card>
		</div>
	</div>
</template>

<script setup>
import { Chart, registerables } from "chart.js";
import { LineChart } from "vue-chart-3";

// Variáveis reativas
const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;

const store = usePerformanceStore();

const data = ref({});
const chosenModel = ref({});
const chartKey = ref(0);
const filterString = ref('');
const chosenModelsOnly = ref(true);
const invertOrder = ref(false);
const blocksTableColumns = [
	{ label: "Qtd. jogos", key: "Qtd_Jogos" },
	{ label: "Profit", key: "Profit" },
	{ label: "ROI", key: "ROI" },
	{ label: "Último dia do bloco", key: "Ult_Dia" },
];

if (import.meta.client) {
  const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
  const annotationPlugin = (await import("chartjs-plugin-annotation")).default;
  Chart.register(zoomPlugin);
  Chart.register(annotationPlugin);
  Chart.register(...registerables);
}

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
  plugins: {
	legend: {
	  position: "bottom",
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

// Variáveis computadas
const sortedSanitizedData = computed(() => {
	let orderDirection = invertOrder.value ? 'asc' : 'desc';
	let sorted = _orderBy(data.value, ['total.qtd_jgs_atual'], [orderDirection]);
	sorted = sorted.filter(item => modelNameToNaturalName(item.modelo).toLowerCase().includes(filterString.value.toLowerCase()));

	if (chosenModelsOnly.value) {
		sorted = filterFavsModels(sorted);
	}

	return sorted.map((item) => ({
		_id: item._id,
		modelo: modelNameToNaturalName(item.modelo),
		profit: (item.total.media_atual * 100).toFixed(2).toLocaleString('pt-BR'),
		ev: item.total.ev.toFixed(2).toLocaleString('pt-BR'),
		media_profit: (item.total.media * 100).toFixed(2).toLocaleString('pt-BR'),
		qtd_jgs: item.total.qtd_jgs_atual,
		last_block_day: item.total.blocks_history?.at(-2)?.Ult_Dia,
		bottom_int_conf: (item.total.intervalo_confianca[0] * 100).toFixed(2).toLocaleString('pt-BR'),
		top_int_conf: (item.total.intervalo_confianca[1] * 100).toFixed(2).toLocaleString('pt-BR'),
		blocks: item.total.blocks_history,
		qtd_blocks: item.total.blocks_history?.length - 1,
		pl_history: item.total.pl_history
	}));
});

const chartData = computed(() => {
	if (!chosenModel.value.pl_history) {
		return {};
	}

	let profits =  chosenModel.value.pl_history.map((item) => item.Profit);
	let data = profits.reduce((acc, curr, index) => {
		if (index === 0) {
			return [curr];
		}

		return [...acc, curr + acc[index - 1]];
	}, []);

	let labels = Array.from({ length: data.length }, (_, i) => i + 1);

	return {
		labels: labels,
		datasets: [
		{
			label: "Acúmulo de capital",
			data: data,
			borderColor: "#6d28d9",
			backgroundColor: "rgb(109, 40, 217, 0.05)",
			pointRadius: 1,
			pointHoverRadius: 7,
			fill: true,
			tension: 0.2,
		},
		],
	};
})

// Métodos
function resetsZoom() {
	chartKey.value++;
}

function filterFavsModels(metricsArray) {
	return _filter(metricsArray, (item) => CHOSEN_MODELS.includes(item.modelo));
}

function invertCardsOrder() {
	invertOrder.value = !invertOrder.value;
}

// Código
if (_isEmpty(store.getPerformanceData)) {
	const { data } = await useFetch(`${apiUrl}/model-performance`);
	store.setPerformanceData(data.value);
}
data.value = store.getPerformanceData;

</script>

<style lang="css" scoped>
.max-h-screen-80 {
	max-height: 80vh;
}

.max-h-screen-30 {
	max-height: 30vh;
}

</style>