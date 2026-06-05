<template>
	<div class="flex flex-col gap-5">
		<div class="flex justify-between items-start">
			<page-header title="Bem-vindo(a) ao DataPlay!" />
		</div>

		<UAlert
			v-if="showAlert"
			color="info"
			variant="soft"
			title="Atenção"
			close
			description="Apostas são para maiores de 18 anos e envolvem riscos financeiros. Aposte com responsabilidade e nunca arrisque mais do que pode perder. Aposte com consciência!"
			@update:open="showAlert = false"
		/>

		<u-skeleton v-if="status === 'pending'" class="w-full h-127.5" />
		<data-error-card
			v-else-if="!data?.bankrollEvolution?.length"
			message="Não foi possível carregar a evolução da banca"
		/>
		<div v-else class="sm:flex gap-3">
			<u-card class="w-full sm:w-7/12">
				<template #header>
					<div>
						<p class="font-semibold">Evolução da banca</p>
						<p class="text-xs text-gray-500">Crescimento da banca mês a mês desde Janeiro de 2024</p>
					</div>
				</template>
				<div class="w-full">
					<bankroll-evolution
						:model-value="status === 'pending'"
						:bankroll-data="data?.bankrollEvolution || []"
					/>
				</div>
			</u-card>
			<u-card class="w-full sm:w-5/12">
				<template #header>
					<div class="flex justify-between items-center font-semibold">
						<p>Resultados por mês</p>
						<p
							class="text-lg"
							:class="totalProfit > 0 ? 'text-teal-600' : 'text-red-600'"
						>
							{{ totalProfit > 0 ? '+' : '' }}{{ totalProfit.toLocaleString('pt-BR') }} u
						</p>
					</div>
				</template>
				<div class="relative">
					<div class="grid grid-cols-2 max-h-112.5 gap-2 overflow-y-scroll p-0.5 pb-6">
						<u-card
							v-for="item in resultsByMonth"
							:key="item.month"
						>
							<div class="text-sm sm:flex items-center text-center justify-center sm:justify-between">
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
					<div class="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-default to-transparent" />
				</div>
			</u-card>
		</div>

		<u-skeleton v-if="status === 'pending'" class="w-full h-82.5" />
		<u-card v-else id="yesterday-metrics">
			<template #header>
				<div class="flex justify-between items-center">
					<p class="font-semibold">Resultados de {{ formatDate(chosenDate) }}</p>
					<div class="flex items-center gap-1">
						<UButton
							icon="i-lucide-chevron-left"
							size="xs"
							color="secondary"
							variant="soft"
							@click="prevDay"
						/>
						<UPopover :popper="{ placement: 'bottom' }">
							<UButton
								:label="formatDate(chosenDate)"
								size="xs"
								color="secondary"
								variant="soft"
								class="w-28 justify-center"
							/>
							<template #content>
								<UCalendar
									v-model="chosenDate"
									:max-value="maxDate"
									@update:model-value="calendarOpen = false"
								/>
							</template>
						</UPopover>
						<UButton
							icon="i-lucide-chevron-right"
							size="xs"
							color="secondary"
							variant="soft"
							:disabled="isAtMaxDate"
							@click="nextDay"
						/>
					</div>
				</div>
			</template>
			<data-error-card
				v-if="!yesterdayData?.results?.length && !dayLoading"
				:message="`Não foi possível carregar os resultados de ${formatDate(chosenDate)}`"
			/>
			<template v-else>
				<u-skeleton v-if="dayLoading" class="w-full h-50" />
				<div v-else class="sm:flex items-stretch gap-3 w-full">
					<div class="flex-1 min-w-0">
						<yesterday-metrics-card :items="dayMetrics" />
					</div>
					<div v-if="yesterdayData?.topModels?.length" class="flex-1 min-w-0 my-3 sm:my-0">
						<ranking-models
							:title="'Top 3 modelos'"
							:items="yesterdayData.topModels"
							:all-results-data="yesterdayData.results"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<yesterday-details-card
							:number-bets="yesterdayData?.metrics?.bets"
							:number-models="yesterdayData?.metrics?.models"
							:positive-models="yesterdayData?.positiveModels || 0"
						/>
					</div>
				</div>
			</template>
		</u-card>

		<u-skeleton v-if="status === 'pending'" class="w-full h-82.5" />
		<data-error-card
			v-else-if="!data?.month?.results?.length"
			message="Não foi possível carregar os resultados do mês"
		/>
		<u-card v-else id="month-metrics">
			<template #header>
				<p class="font-semibold">Resultados do mês</p>
			</template>
			<div class="sm:flex items-stretch gap-3 w-full">
				<div class="flex-1 min-w-0">
					<yesterday-metrics-card :items="monthMetrics" />
				</div>
				<div v-if="data?.month?.topModels?.length" class="flex-1 min-w-0 my-3 sm:my-0">
					<ranking-models
						:title="'Top 3 modelos'"
						:items="data.month.topModels"
						:all-results-data="data.month.results"
					/>
				</div>
				<div class="flex-1 min-w-0">
					<yesterday-details-card
						:number-bets="data?.month?.metrics?.bets"
						:number-models="data?.month?.metrics?.models"
						:positive-models="data?.month?.positiveModels || 0"
					/>
				</div>
			</div>
		</u-card>
	</div>
</template>

<script setup>
import { DateTime } from 'luxon';
import { CalendarDate } from '@internationalized/date';

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
const yesterdayParts = yesterday.split('-').map(Number);
const chosenDate = ref(new CalendarDate(yesterdayParts[0], yesterdayParts[1], yesterdayParts[2]));
const maxDate = new CalendarDate(...DateTime.now().setZone(timezone).minus({ days: 1 }).toFormat('yyyy-MM-dd').split('-').map(Number));
const dayLoading = ref(false);
const yesterdayData = ref({});

function calendarToDateStr(cal) {
  if (!cal) return '';
  return `${cal.year}-${String(cal.month).padStart(2, '0')}-${String(cal.day).padStart(2, '0')}`;
}

function formatDate(cal) {
  if (!cal) return '';
  return `${String(cal.day).padStart(2, '0')}/${String(cal.month).padStart(2, '0')}/${cal.year}`;
}

function addDays(cal, days) {
  const d = new Date(cal.year, cal.month - 1, cal.day + days);
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function isSameDate(a, b) {
  return a && b && a.year === b.year && a.month === b.month && a.day === b.day;
}

const calendarOpen = ref(false);
const isAtMaxDate = computed(() => isSameDate(chosenDate.value, maxDate));

function prevDay() {
  chosenDate.value = addDays(chosenDate.value, -1);
}

function nextDay() {
  if (!isAtMaxDate.value) {
    chosenDate.value = addDays(chosenDate.value, 1);
  }
}

const resultsByMonth = computed(() => {
	if (!data.value?.bankrollEvolution?.length) return [];
	return data.value.bankrollEvolution.map((item) => ({
		month: item.month,
		profit: item.profit,
	})).reverse();
});

const totalProfit = computed(() => {
	const b = data.value?.bankrollEvolution;
	if (!b?.length || b.length < 2) return 0;
	return b.at(-1).bankroll - b.at(0).bankroll;
});

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
  const parts = data.value.yesterday.date.split('-').map(Number);
  chosenDate.value = new CalendarDate(parts[0], parts[1], parts[2]);
} else {
  await fetchDayResults(yesterday);
}

// Refetch when date changes
watch(chosenDate, (newDate) => {
  if (newDate) fetchDayResults(calendarToDateStr(newDate));
});

// Store for other pages
watch(() => yesterdayData.value?.results, (val) => {
  if (val?.length) {
    yesterdayStore.setYesterdayModels(val);
  }
}, { immediate: true });
</script>
