<template>
	<u-card>
		<template #header>
			<p class="font-semibold">Tabela de placares</p>
		</template>
		<u-table
			:rows="scores"
			:ui="tableUi"
			:columns="tableColumns"
		/>
	</u-card>
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

const tableColumns = [
	{
		key: 'team',
		label: 'Time',
	},
	{
		key: 'goals0',
		label: '0 gols',
	},
	{
		key: 'goals1',
		label: '1 gol',
	},
	{
		key: 'goals2',
		label: '2 gols',
	},
	{
		key: 'goals3',
		label: '3 gols',
	},
	{
		key: 'goals4',
		label: '4 gols',
	},
]

const scores = computed(() => {
	let scoresRows = [];
	scoresRows.push({
		team: internalData.value?.Home,
		goals0: (internalData.value?.Prob_0GH * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals1: (internalData.value?.Prob_1GH * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals2: (internalData.value?.Prob_2GH * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals3: (internalData.value?.Prob_3GH * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals4: (internalData.value?.Prob_4GH * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
	});
	scoresRows.push({
		team: internalData.value?.Away,
		goals0: (internalData.value?.Prob_0GA * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals1: (internalData.value?.Prob_1GA * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals2: (internalData.value?.Prob_2GA * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals3: (internalData.value?.Prob_3GA * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
		goals4: (internalData.value?.Prob_4GA * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
	});

	return scoresRows;
})

watch(() => props.data, () => {
	internalData.value = props.data;
});

</script>

<style lang="scss" scoped>

</style>