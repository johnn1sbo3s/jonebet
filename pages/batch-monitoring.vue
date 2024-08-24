<template>
	<div class="flex flex-col gap-4">
		<page-header title="Monitoramento em lotes" />
		<div class="flex gap-4">
			<div class="flex justify-between">
				<div class="p-0.5 pr-4 max-h-screen-90 overflow-auto flex flex-col gap-4">
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
			<u-card class="w-full h-min">
				<template #header>
					<p class="font-semibold">{{ chosenModel.modelo }}</p>
				</template>
				<LineChart
				:chartData="chartData"
				:options="chartOptions"
				:style="chartStyle"
				/>
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
const { data } = await useFetch(`${apiUrl}/model-performance`);
const chosenModel = ref({});

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
	let sorted = _orderBy(data.value, ['total.qtd_jgs_atual'], ['desc']);

	return sorted.map((item) => ({
		_id: item._id,
		modelo: item.modelo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
		profit: (item.total.media_atual * 100).toFixed(2).toLocaleString('pt-BR'),
		ev: item.total.ev.toFixed(2).toLocaleString('pt-BR'),
		media_profit: (item.total.media * 100).toFixed(2).toLocaleString('pt-BR'),
		qtd_jgs: item.total.qtd_jgs_atual,
		last_block_day: item.total.blocks_history?.at(-2)?.Ult_Dia,
		bottom_int_conf: (item.total.intervalo_confianca[0] * 100).toFixed(2).toLocaleString('pt-BR'),
		top_int_conf: (item.total.intervalo_confianca[1] * 100).toFixed(2).toLocaleString('pt-BR'),
		qtd_blocks: item.total.blocks_history?.length - 1,
	}));
});

const chartData = computed(() => {
//   let labels = chosenModel.total.pl_history.map((item) => formatDate(item.Date));
//   let data = props.bankrollData.map((item) => item.Bankroll);
	let labels = [1, 2, 3, 4, 5]
	let data = [1, 2, 3, 4, 5]

	return {
		labels: labels,
		datasets: [
		{
			label: "Acúmulo de capital",
			data: data,
			borderColor: "#6d28d9",
			backgroundColor: "rgb(109, 40, 217, 0.05)",
			pointRadius: 3,
			pointHoverRadius: 7,
			fill: true,
			tension: 0.2,
		},
		],
	};
})

chosenModel.value = sortedSanitizedData.value[0];


</script>

<style lang="css" scoped>
.max-h-screen-90 {
	max-height: 90vh;
}

</style>