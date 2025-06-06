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

		<div class="flex flex-col gap-2">
			<p class="text-sm">{{ batchModels.length }} alertas</p>
			<u-carousel
				v-slot="{ item }"
				id="carousel"
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

		<u-card
			v-else
			id="bankroll-evolution"
		>
			<template #header>
				<div class="row gap-1">
					<p class="font-semibold">Evolução da banca</p>

					<p class="text-sm text-gray-500">Crescimento da banca mês a mês desde Janeiro de 2024</p>
				</div>
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

		<u-card
			v-else
			id="yesterday-metrics"
		>
			<template #header>
				<p class="font-semibold">{{ !yesterdayDataError ? `Resultados de ontem - ${formatDate(yesterday)}` : `Resultados de anteontem - ${formatDate(dayBeforeYesterday)}`}}</p>
			</template>

			<div class="row sm:flex gap-3 w-full">
				<div class="w-full">
					<yesterday-metrics-card :items="yesterdayMetrics" />
				</div>

				<div class="my-3 sm:my-0 w-full">
					<ranking-models
						:title="'Top 3 modelos'"
						:items="top3YesterdayModels"
						:all-results-data="yesterdayResults"
					/>
				</div>

				<div class="w-full">
					<yesterday-details-card
						:number-bets="yesterdayTotal.Num_Bets"
						:number-models="yesterdayTotal.Method"
						:positive-models="positiveYesterdayModels"
					/>
				</div>
			</div>
		</u-card>

		<u-skeleton
		v-if="monthDataStatus === 'pending'"
		class="w-full h-[330px]"
		/>

		<u-card
			v-else
			id="month-metrics"
		>
			<template #header>
				<p class="font-semibold">Resultados do mês</p>
			</template>

			<div class="row sm:flex gap-3 w-full">
				<yesterday-metrics-card :items="monthMetrics" />

				<div class="my-3 sm:my-0 w-full">
					<ranking-models
						:title="'Top 3 modelos'"
						:items="top3MonthModels"
						:all-results-data="monthResults"
					/>
				</div>

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
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
const { isMobile } = useDevice();

const driverObj = driver({
	showProgress: true,
	allowClose: false,
	steps: [
		{
			element: '#carousel',
			popover: {
				title: 'Alertas',
				description: 'Os alertas mostram os modelos que estão próximos ou acabaram de completar um bloco de 100 entradas.',
				side: 'left',
				align: 'start'
			}
		},
		{
			element: '#bankroll-evolution',
			popover: {
				title: 'Evolução da banca',
				description: 'O gráfico apresenta a evolução da banca desde janeiro de 2024, somando os ganhos de todos os modelos e considerando a stake como 1un da banca e banca inicial de R$ 100,00.',
				side: 'left',
				align: 'start'
			}
		},
		{
			element: '#yesterday-metrics',
			popover: {
				title: 'Resultados do dia anterior',
				description: 'Os dados mostram o resultado do dia anterior, como o ROI, o investimento e o ganho.',
				side: 'left',
				align: 'start'
			}
		},
		{
			element: '#month-metrics',
			popover: {
				title: 'Resultados do mês',
				description: 'Os dados mostram o resultado do mês atual, como o ROI, o investimento e o ganho.',
				side: 'left',
				align: 'start'
			}
		},
	],
	onDestroyStarted: () => {
		if (!driverObj.hasNextStep()) {
			localStorage.setItem('doneTourHome', true);
			driverObj.destroy();
		}
	},
});

onMounted(() => {
	if (!isMobile && localStorage.getItem('doneTourHome') !== 'true') {
		driverObj.drive();
	}
});

const showAlert = ref(true);

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
