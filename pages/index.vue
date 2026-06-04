<template>
	<div class="flex flex-col gap-5">
		<div class="flex justify-between items-start">
			<page-header title="Bem-vindo(a) ao DataPlay!" />
		</div>

		<UAlert
			v-if="showAlert"
			color="blue"
			variant="soft"
			title="Atenção"
			:close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
			description="Apostas são para maiores de 18 anos e envolvem riscos financeiros. Aposte com responsabilidade e nunca arrisque mais do que pode perder. Aposte com consciência!"
			@close="showAlert = false"
		/>


		<u-skeleton v-if="status === 'pending'" class="w-full h-[510px]" />
		<data-error-card
			v-else-if="!data?.bankrollEvolution?.length"
			message="Não foi possível carregar a evolução da banca"
		/>
		<u-card v-else id="bankroll-evolution">
			<template #header>
				<div class="row gap-1">
					<p class="font-semibold">Evolução da banca</p>
					<p class="text-sm text-gray-500">Crescimento da banca mês a mês desde Janeiro de 2024</p>
				</div>
			</template>
			<div class="w-full">
				<bankroll-evolution
					:model-value="status === 'pending'"
					:bankroll-data="data?.bankrollEvolution || []"
				/>
			</div>
		</u-card>

		<u-skeleton v-if="status === 'pending'" class="w-full h-[330px]" />
		<data-error-card
			v-else-if="!data?.yesterday?.results?.length"
			:message="`Não foi possível carregar os resultados de ${data?.yesterday?.isFallback ? 'anteontem' : 'ontem'}`"
		/>
		<u-card v-else id="yesterday-metrics">
			<template #header>
				<p class="font-semibold">{{ data?.yesterday?.isFallback ? `Resultados de anteontem - ${formatDate(data?.yesterday?.date)}` : `Resultados de ontem - ${formatDate(data?.yesterday?.date)}` }}</p>
			</template>
			<div class="row sm:flex gap-3 w-full">
				<div class="w-full">
					<yesterday-metrics-card :items="yesterdayMetrics" />
				</div>
				<div v-if="data?.yesterday?.topModels?.length" class="my-3 sm:my-0 w-full">
					<ranking-models
						:title="'Top 3 modelos'"
						:items="data.yesterday.topModels"
						:all-results-data="data.yesterday.results"
					/>
				</div>
				<div class="w-full">
					<yesterday-details-card
						:number-bets="data?.yesterday?.metrics?.bets"
						:number-models="data?.yesterday?.metrics?.models"
						:positive-models="data?.yesterday?.positiveModels || 0"
					/>
				</div>
			</div>
		</u-card>

		<u-skeleton v-if="status === 'pending'" class="w-full h-[330px]" />
		<data-error-card
			v-else-if="!data?.month?.results?.length"
			message="Não foi possível carregar os resultados do mês"
		/>
		<u-card v-else id="month-metrics">
			<template #header>
				<p class="font-semibold">Resultados do mês</p>
			</template>
			<div class="row sm:flex gap-3 w-full">
				<yesterday-metrics-card :items="monthMetrics" />
				<div v-if="data?.month?.topModels?.length" class="my-3 sm:my-0 w-full">
					<ranking-models
						:title="'Top 3 modelos'"
						:items="data.month.topModels"
						:all-results-data="data.month.results"
					/>
				</div>
				<yesterday-details-card
					:number-bets="data?.month?.metrics?.bets"
					:number-models="data?.month?.metrics?.models"
					:positive-models="data?.month?.positiveModels || 0"
				/>
			</div>
		</u-card>
  </div>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;
const yesterdayStore = useYesterdayModelsStore();
const showAlert = ref(true);

const { data, status, error } = await useFetch(`${apiUrl}/dashboard`);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const yesterdayMetrics = computed(() => {
  const m = data.value?.yesterday?.metrics;
  if (!m) return [];
  return [
    { name: 'Profit', value: m.profit, sufix: 'u' },
    { name: 'Investido', value: m.invested, sufix: 'u' },
    { name: 'ROI', value: m.roi, sufix: '' }
  ];
});

const monthMetrics = computed(() => {
  const m = data.value?.month?.metrics;
  if (!m) return [];
  return [
    { name: 'Profit', value: m.profit, sufix: 'u' },
    { name: 'Investido', value: m.invested, sufix: 'u' },
    { name: 'ROI', value: m.roi, sufix: '' }
  ];
});

watch(() => data.value?.yesterday, (val) => {
  if (val?.results?.length) {
    yesterdayStore.setYesterdayModels(val.results);
  }
}, { immediate: true });
</script>

<style lang="scss" scoped></style>