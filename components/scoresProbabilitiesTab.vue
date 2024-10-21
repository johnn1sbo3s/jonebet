<template>
	<USelectMenu
		class="w-1/4 mb-4"
		v-model="selectedOption"
		:options="options"
		searchable
		option-attribute="label"
	/>

	<div class="flex gap-4">
		<div class="flex gap-3 w-3/5">
			<score-card
				:data="selectedOption"
				title="Placar mais provável"
				score-probability="most"
			/>

			<score-card
				:data="selectedOption"
				title="Placar menos provável"
				score-probability="less"
			/>
		</div>

		<div class="w-2/5 h-full">
			<scores-table :data="selectedOption" />
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	data: {
		type: Array,
		required: true
	},
})

const selectedOption = ref(null);
const options = ref([]);

onMounted(() => {
	options.value = props.data.filter(item => item.Date === new Date().toISOString().split('T')[0]).map((item) => ({
		...item,
		label: item.Home + ' vs. ' + item.Away,
		value: item._id,
	}));
	selectedOption.value = options.value[0];
});

</script>

<style lang="scss" scoped>

</style>