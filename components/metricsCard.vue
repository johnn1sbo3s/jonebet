<template>
  <UCard class="h-full">
	<template #header>
	  <p class="font-semibold">{{ cardTitle }}</p>
	</template>
	<div class="text-sm flex flex-col gap-5">
	<div class="grid grid-cols-3 gap-y-5">
		<div class="flex gap-1">
			<p class="font-semibold">Profit:</p>
			<p>{{ metricsData.plb.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">ROI:</p>
			<p>{{ (metricsData.roi * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}%</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">WR:</p>
			<p>{{ (metricsData.wr * 100).toFixed(0) }}%</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">Odd média:</p>
			<p>{{ metricsData.odds.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">Win médio:</p>
			<p>{{ metricsData.med_gain.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">Loss médio:</p>
			<p>{{ metricsData.med_loss.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">EV:</p>
			<p>{{ metricsData.ev.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">Lucro efetivo:</p>
			<p>{{ ((metricsData.ev / -metricsData.med_loss) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}%</p>
		</div>
		<div class="flex gap-1">
			<p class="font-semibold">Máx DD:</p>
			<p>{{ metricsData.dd.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
	</div>
		<div class="grid grid-cols-3">
			<div class="flex gap-1">
				<p class="font-semibold">Entradas:</p>
				<p>{{ metricsData.entradas }}</p>
			</div>
		</div>
	</div>
  </UCard>
</template>

<script setup>
const props = defineProps(["metricsData", "cardTitle"]);
</script>

<style scoped></style>