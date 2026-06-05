<template>
  <UCard class="h-full bg-[#1a1a1a] border border-[#2a2a2a]">
	<template #header>
	  <p class="font-semibold text-white">{{ cardTitle }}</p>
	</template>

	<div class="text-sm flex flex-col gap-5">
	<div class="grid grid-cols-3 gap-y-5">
		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">Profit:</p>

			<p class="text-white">{{ metricsData.plb.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">ROI:</p>

			<p class="text-white">{{ (metricsData.roi * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}%</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">WR:</p>

			<p class="text-white">{{ (metricsData.wr * 100).toFixed(0) }}%</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">Odd média:</p>

			<p class="text-white">{{ metricsData.odds.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">Win médio:</p>

			<p class="text-white">{{ metricsData.med_gain.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">Loss médio:</p>

			<p class="text-white">{{ metricsData.med_loss.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">EV:</p>

			<p class="text-white">{{ metricsData.ev.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">Lucro efetivo:</p>

			<p class="text-white">{{ metricsData.med_loss !== 0 ? ((metricsData.ev / -metricsData.med_loss) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) : '0.00' }}%</p>
		</div>

		<div class="flex gap-1">
			<p class="font-semibold text-[#888888]">Máx DD:</p>

			<p class="text-white">{{ metricsData.dd.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) }}</p>
		</div>
	</div>

		<div class="grid grid-cols-3">
			<div class="flex gap-1">
				<p class="font-semibold text-[#888888]">Entradas:</p>

				<p class="text-white">{{ metricsData.entradas }}</p>
			</div>
		</div>
	</div>
  </UCard>
</template>

<script setup>
defineProps(["metricsData", "cardTitle"]);
</script>

<style scoped></style>