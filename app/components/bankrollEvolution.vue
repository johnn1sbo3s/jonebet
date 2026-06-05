<template>
	<LineChart
		:chartData="chartData"
		:options="chartOptions"
		:style="chartStyle"
	/>
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
  if (!props.bankrollData?.length) {
    return { labels: [], datasets: [] };
  }
  let labels = props.bankrollData.map((item) => item.month);
  let data = props.bankrollData.map((item) => item.bankroll);

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


</script>

<style lang="scss" scoped>

</style>