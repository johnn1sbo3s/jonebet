<template>
	<div class="flex gap-3">
		<div class="w-7/12">
			<LineChart
			:chartData="chartData"
			:options="chartOptions"
			:style="chartStyle"
			/>
		</div>

		<div class="w-5/12 pt-8 pb-7 h-full">
			<u-card class="h-full">
				<template #header>
					<div class="flex justify-between items-center font-semibold">
						<p>Acúmulo total</p>
						<p
							class="text-lg"
							:class="totalProfit > 0 ? 'text-teal-600' : 'text-red-600'"
						>
							{{ totalProfit > 0 ? '+' : '' }}{{ totalProfit.toLocaleString('pt-BR') }} u
						</p>
					</div>
				</template>

				<template #default>
					<div class="grid grid-cols-2 max-h-56 gap-2 overflow-y-scroll p-0.5">
						<u-card
							v-for="item in resultsByMonth"
							:key="item.month"
						>
							<div class="text-sm flex justify-between">
								<p>{{ item.month }}</p>
								<p
									class="font-semibold"
									:class="item.profit >= 0 ? 'text-teal-600' : 'text-red-600'"
								>
									{{ item.profit.toLocaleString('pt-BR') }} u
								</p>
							</div>
						</u-card>
					</div>
				</template>
			</u-card>
		</div>
	</div>
</template>

<script setup>
import { Chart, registerables } from "chart.js";
import { LineChart } from "vue-chart-3";

const props = defineProps({
  modelValue: {
	type: Boolean,
	required: true,
	default: () => true
  },

  bankrollData: {
	type: Object,
	required: true,
	default: () => {}
  }
})

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

const chartData = computed(() => {
  let labels = props.bankrollData.map((item) => item.Month);
  let data = props.bankrollData.map((item) => item.Bankroll);

  return {
	labels: labels,
	datasets: [
	  {
		label: "Acúmulo de capital",
		data: data,
		borderColor: "#25D88B",
		backgroundColor: "rgb(37, 216, 139, 0.05)",
		pointRadius: 3,
		pointHoverRadius: 7,
		fill: true,
		tension: 0.2,
	  },
	],
  };
})

const resultsByMonth = computed(() => {
	let removedInitialMonth = props.bankrollData.slice(1);
	let months = removedInitialMonth.map((item) => {
		return {
			month: item.Month,
			profit: item.Profit,
		}
	})

	return months.reverse();
})

const totalProfit = computed(() => {
	return (props.bankrollData.at(-1).Bankroll - props.bankrollData.at(0).Bankroll);
})

</script>

<style lang="scss" scoped>

</style>