<template>
	<u-card class="w-full" :ui="{ body: { background: 'h-[77%]'}}">
		<template #header>
			<p class="font-semibold">{{ title }}</p>
		</template>

		<template #default>
			<div class="flex flex-col h-full w-full items-center justify-center gap-5">
				<div class="font-semibold">
					<div
						v-if="chosenScoreHome"
						class="flex gap-3 items-center"
					>
						<span class="text-sm text-slate-500 font-normal">
							{{ chosenScoreHome[1] * 100 + '%' }}
						</span>

						<span class="text-5xl">
							{{ chosenScoreHome[0] }} x {{ chosenScoreAway[0] }}
						</span>

						<span class="text-sm text-slate-500 font-normal">
							{{ chosenScoreAway[1] * 100 + '%' }}
						</span>
					</div>
				</div>

				<div class="flex gap-2">
					<u-badge
						:label="probability.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2}) + '%'"
						variant="subtle"
						size="md"
					/>
					<u-badge
						:label="'Odds ' + odds"
						variant="subtle"
						size="md"
					/>
				</div>
			</div>
		</template>
	</u-card>
</template>

<script setup>
const props = defineProps({
	title: {
		type: String,
		required: true,
	},
	data: {
		type: Object,
		required: true
	},
	scoreProbability: {
		type: String,
		required: true,
		validator: (value) => ['most', 'less'].includes(value)
	}
});

const internalData = ref({});

const chosenScoreHome = computed(() => {
	const scoresHome = {
		'0': internalData.value?.Prob_0GH,
		'1': internalData.value?.Prob_1GH,
		'2': internalData.value?.Prob_2GH,
		'3': internalData.value?.Prob_3GH,
	};

	if (props.scoreProbability === 'most') {
		return _maxBy(Object.entries(scoresHome), (item) => item[1]);
	} else {
		return _minBy(Object.entries(scoresHome), (item) => item[1]);
	}
});

const chosenScoreAway = computed(() => {
	const scoresAway = {
		'0': internalData.value?.Prob_0GA,
		'1': internalData.value?.Prob_1GA,
		'2': internalData.value?.Prob_2GA,
		'3': internalData.value?.Prob_3GA,
	};

	if (props.scoreProbability === 'most') {
		return _maxBy(Object.entries(scoresAway), (item) => item[1]);
	} else {
		return _minBy(Object.entries(scoresAway), (item) => item[1]);
	}
});

const probability = computed(() => {
	if (chosenScoreHome.value && chosenScoreAway.value) {
		return (chosenScoreHome.value[1] * chosenScoreAway.value[1]) * 100;
	} else {
		return 0;
	}
});

const odds = computed(() => (100 / probability.value).toFixed(0));

watch(() => props.data, () => {
	internalData.value = props.data;
}, { immediate: true, deep: true });

</script>

<style lang="scss" scoped>

</style>