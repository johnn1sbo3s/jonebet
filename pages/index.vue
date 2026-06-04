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
			v-else-if="!yesterdayData?.results?.length && !dayLoading"
			:message="`Não foi possível carregar os resultados de ${formatDate(chosenDate)}`"
		/>
		<u-card v-else id="yesterday-metrics">
			<template #header>
				<div class="flex justify-between items-center">
					<p class="font-semibold">Resultados de {{ formatDate(chosenDate) }}</p>
					<UInput
						type="date"
						v-model="chosenDate"
						:max="maxDate"
						size="sm"
					/>
				</div>
			</template>
			<u-skeleton v-if="dayLoading" class="w-full h-[200px]" />
			<div v-else class="row sm:flex gap-3 w-full">
				<div class="w-full">
					<yesterday-metrics-card :items="dayMetrics" />
				</div>
				<div v-if="yesterdayData?.topModels?.length" class="my-3 sm:my-0 w-full">
					<ranking-models
						:title="'Top 3 modelos'"
						:items="yesterdayData.topModels"
						:all-results-data="yesterdayData.results"
					/>
				</div>
				<div class="w-full">
					<yesterday-details-card
						:number-bets="yesterdayData?.metrics?.bets"
						:number-models="yesterdayData?.metrics?.models"
						:positive-models="yesterdayData?.positiveModels || 0"
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
import { DateTime } from 'luxon';

const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;
const yesterdayStore = useYesterdayModelsStore();
const showAlert = ref(true);

const { data: rawData, status, error } = await useFetch(`${apiUrl}/dashboard`);

// Clean undefined properties for SSR serialization
function cleanObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}
function cleanArray(arr) {
  if (!arr?.length) return [];
  return arr.map(item => cleanObj(item));
}

const data = computed(() => {
  if (!rawData.value) return null;
  const d = rawData.value;
  return {
    ...d,
    bankrollEvolution: cleanArray(d.bankrollEvolution),
    yesterday: d.yesterday ? {
      ...d.yesterday,
      topModels: cleanArray(d.yesterday.topModels),
      results: cleanArray(d.yesterday.results),
    } : null,
    month: d.month ? {
      ...d.month,
      topModels: cleanArray(d.month.topModels),
      results: cleanArray(d.month.results),
    } : null,
  };
});

// Date picker
const timezone = 'America/Sao_Paulo';
const yesterday = DateTime.now().setZone(timezone).minus({ days: 1 }).toFormat('yyyy-MM-dd');
const chosenDate = ref(yesterday);
const maxDate = DateTime.now().setZone(timezone).minus({ days: 1 }).toFormat('yyyy-MM-dd');
const dayLoading = ref(false);
const yesterdayData = ref({});
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const dayMetrics = computed(() => {
  const m = yesterdayData.value?.metrics;
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

async function fetchDayResults(date) {
  dayLoading.value = true;
  try {
    const result = await $fetch(`${apiUrl}/daily-results/${date}`);
    yesterdayData.value = result;
  } catch (e) {
    yesterdayData.value = null;
  } finally {
    dayLoading.value = false;
  }
}

// Load initial date (use dashboard fallback data or fetch)
if (data.value?.yesterday?.results?.length) {
  yesterdayData.value = data.value.yesterday;
  chosenDate.value = data.value.yesterday.date;
} else {
  await fetchDayResults(yesterday);
}

// Refetch when date changes
watch(chosenDate, (newDate) => {
  if (newDate) fetchDayResults(newDate);
});

// Store for other pages
watch(() => yesterdayData.value?.results, (val) => {
  if (val?.length) {
    yesterdayStore.setYesterdayModels(val);
  }
}, { immediate: true });
</script>
