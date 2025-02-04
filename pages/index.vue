<template>
	<div class="flex flex-col gap-5">
		<div class="flex justify-between items-start">
			<page-header title="Bem-vindo(a) ao DataPlay!" />

			<div class="flex items-center gap-2">
				<div class="pt-2 flex gap-3">
					<UToggle
					size="md"
					on-icon="i-heroicons-check-20-solid"
					off-icon="i-heroicons-x-mark-20-solid"
					:loading="monthDataStatus === 'pending'"
					v-model="onlyChosenModels"
					@click="onlyChosenModels = !onlyChosenModels"
					/>
				</div>

				<div class="text-sm pt-1.5">Apenas modelos selecionados</div>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<p class="text-sm">{{ batchModels.length }} alertas</p>
			<u-carousel
				v-slot="{ item }"
				:items="batchModels"
				:ui="{ item: 'snap-align-none',
					container: 'relative w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-2',
				 }"
			>
				<batch-alert-card class="p-0.5" :model="item" />
			</u-carousel>
		</div>

		<u-skeleton
			v-if="yesterdayDataStatus === 'pending'"
			class="w-full h-[510px]"
		/>

		<u-card v-else>
			<template #header>
				<p class="font-semibold">Evolução da banca</p>
			</template>

			<div class="w-full">
				<bankroll-evolution
				:model-value="yesterdayDataStatus === 'pending'"
				:bankroll-data="bankrollData"
				/>
			</div>
		</u-card>

		<u-skeleton
			v-if="yesterdayDataStatus === 'pending'"
			class="w-full h-[330px]"
		/>

		<u-card v-else>
			<template #header>
				<p class="font-semibold">{{ !yesterdayDataError ? `Resultados de ontem - ${formatDate(yesterday)}` : `Resultados de anteontem - ${formatDate(dayBeforeYesterday)}`}}</p>
			</template>

			<div class="flex gap-5 w-full">
				<yesterday-metrics-card
				:items="yesterdayMetrics"
				/>

				<ranking-models
				:title="'Top 3 modelos'"
				:items="top3YesterdayModels"
				:all-results-data="yesterdayResults"
				/>

				<yesterday-details-card
				:number-bets="yesterdayTotal.Num_Bets"
				:number-models="yesterdayTotal.Method"
				:positive-models="positiveYesterdayModels"
				/>
			</div>
		</u-card>

		<u-skeleton
		v-if="monthDataStatus === 'pending'"
		class="w-full h-[330px]"
		/>

		<u-card v-else>
			<template #header>
				<p class="font-semibold">Resultados do mês</p>
			</template>

			<div class="flex gap-5 w-full">
				<yesterday-metrics-card
				:items="monthMetrics"
				/>

				<ranking-models
				:title="'Top 3 modelos'"
				:items="top3MonthModels"
				:all-results-data="monthResults"
				/>

				<yesterday-details-card
				:number-bets="monthTotal.Num_Bets"
				:number-models="monthTotal.Method"
				:positive-models="positiveMonthModels"
				/>
			</div>
		</u-card>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon';

const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;

const yesterdayStore = useYesterdayModelsStore();

const timezone = 'America/Sao_Paulo';
const month = DateTime.now().setZone(timezone).toFormat('M');
const yesterday = DateTime.now().setZone(timezone).minus({ days: 1 }).toFormat('yyyy-MM-dd');
const dayBeforeYesterday = DateTime.now().setZone(timezone).minus({ days: 2 }).toFormat('yyyy-MM-dd');
const onlyChosenModels = ref(false);

const requests = [
	useFetch(`${apiUrl}/bankroll-evolution`, { params: { filtered: onlyChosenModels }}),
	useFetch(`${apiUrl}/daily-results/${yesterday}`, { params: { filtered: onlyChosenModels }}),
	useFetch(`${apiUrl}/daily-results/${dayBeforeYesterday}`, { params: { filtered: onlyChosenModels }}),
	useFetch(`${apiUrl}/monthly-results/${month}`, { params: { filtered: onlyChosenModels }}),
	useFetch(`${apiUrl}/model-performance`),
];

const responses = await Promise.all(requests);

const { data: bankrollData } = responses[0];
const { data: yesterdayData, status: yesterdayDataStatus, error: yesterdayDataError } = responses[1];
const { data: dayBeforeYesterdayData } = responses[2];
const { data: monthData, status: monthDataStatus } = responses[3];
const { data: performanceData } = responses[4];

const batchModels = computed(() => {
	let filtered = performanceData.value;

	if (onlyChosenModels.value) {
		filtered = _filter(performanceData.value, (item) => CHOSEN_MODELS.includes(item.modelo));
	}

    filtered.sort((a, b) => b.total.qtd_jgs_atual - a.total.qtd_jgs_atual);
    return _filter(filtered, (item) => item?.total?.qtd_jgs_atual >= 88 || item?.total?.qtd_jgs_atual <= 10);
})

const yesterdayResults = computed(() => {
	let lastResults = yesterdayData?.value ? yesterdayData.value : dayBeforeYesterdayData.value;
	yesterdayStore.setYesterdayModels(lastResults);
	return lastResults;
});

const monthResults = computed(() => {
  return monthData.value;
});

const yesterdayTotal = computed(() => {
	return _find(yesterdayResults.value, { Date: 'Total' });
})

const monthTotal = computed(() => {
	return _find(monthResults.value, { Date: 'Total' });
})

const yesterdayMetrics = computed(() => {
	return [
		{
			name: 'Profit',
			value: yesterdayTotal.value.Profit,
			sufix: 'u'
		},
		{
			name: 'Investido',
			value: yesterdayTotal.value.Responsibility,
			sufix: 'u'
		},
		{
			name: 'ROI',
			value: yesterdayTotal.value.ROI,
			sufix: ''
		}
	]
});

const monthMetrics = computed(() => {
  return [
	{
	  name: 'Profit',
	  value: monthTotal.value.Profit,
	  sufix: 'u'
	},
	{
	  name: 'Investido',
	  value: monthTotal.value.Responsibility,
	  sufix: 'u'
	},
	{
	  name: 'ROI',
	  value: monthTotal.value.ROI,
	  sufix: ''
	}
  ]
});

const top3YesterdayModels = computed(() => {
	if (yesterdayResults.value.length === 0) {
		return []
	}

	let removedLast = yesterdayResults.value.slice(0, -1);
	let sorted = _filter(removedLast).sort((a, b) => {
		return b.Profit - a.Profit
	}).slice(0, 3);

	return sorted.map((item) => ({
		id: item.Method_Id,
		name: item.Method,
		profit: item.Profit
	}))
})

const top3MonthModels = computed(() => {
	if (monthResults.value.length === 0) {
		return []
	}

	let removedLast = monthResults.value.slice(0, -1);
	let sorted = _filter(removedLast).sort((a, b) => {
		return b.Profit - a.Profit
	}).slice(0, 3);

	return sorted.map((item) => ({
		id: item.Method_Id,
		name: item.Method,
		profit: item.Profit
	}))
})

const positiveYesterdayModels = computed(() => {
  let models = _filter(yesterdayResults.value, item => item.Date != 'Total' );
  let positive = _filter(models, item => item.Profit > 0);
  return positive.length;
});

const positiveMonthModels = computed(() => {
  let models = _filter(monthResults.value, item => item.Date != 'Total' );
  let positive = _filter(models, item => item.Profit > 0);
  return positive.length;
});

</script>

<style lang="scss" scoped></style>
