<template>
	<div>
		<u-table
			:rows="scores"
			:ui="tableUi"
		/>
	</div>
</template>

<script setup>

const props = defineProps({
	data: {
		type: Object,
		required: true,
	},
});

const internalData = ref([]);
const tableUi = { wrapper: 'relative overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg' };

const scores = computed(() => {
	let scoresRows = [];
	scoresRows.push({
		team: internalData.value?.Home,
		goals0: internalData.value?.Prob_0GH,
		goals1: internalData.value?.Prob_1GH,
		goals2: internalData.value?.Prob_2GH,
		goals3: internalData.value?.Prob_3GH,
	});
	scoresRows.push({
		team: internalData.value?.Away,
		goals0: internalData.value?.Prob_0GA,
		goals1: internalData.value?.Prob_1GA,
		goals2: internalData.value?.Prob_2GA,
		goals3: internalData.value?.Prob_3GA,
	});

	return scoresRows;
})

watch(() => props.data, () => {
	internalData.value = props.data;
});

</script>

<style lang="scss" scoped>

</style>