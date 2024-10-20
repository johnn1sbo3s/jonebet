<template>
	<div>
		<USelectMenu
			class="w-1/5"
			v-model="selectedGame"
			:options="options"
			searchable
			option-attribute="name"
		/>

		{{ buildScores }}
	</div>
</template>

<script setup>
const props = defineProps({
	data: {
		type: Object,
		required: true
	},
})

const selectedGame = ref(null);

const options = computed(() => {
	return Object.values(props.data).map((item) => ({
		name: item.Home + ' vs. ' + item.Away,
		value: item._id,
	}));
});

const buildScores = computed(() => {
	let game = props.data.find(item => item._id === selectedGame.value);

	return game;
});

onMounted(() => {
	selectedGame.value = options.value[0].name;
});

</script>

<style lang="scss" scoped>

</style>