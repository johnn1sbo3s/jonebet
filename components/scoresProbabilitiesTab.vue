<template>
	<div class="flex gap-5 items-baseline justify-between">
		<USelectMenu
			class="w-1/4 mb-4"
			v-model="selectedOption"
			:options="options"
			searchable
		>
			<template #option="{ option }">
				<div class="flex gap-2 items-center my-1">
					<span>
						{{ option.label }}
					</span>

					<span class="text-xs text-purple-500 font-semibold mt-0.5">
						{{ isGameLive(option) ? 'AO VIVO' : '' }}
					</span>
				</div>
			</template>
		</USelectMenu>

		<div
			v-if="isGameLive(selectedOption)"
			class="text-purple-500 font-semibold flex items-center"
		>
			<span class="mr-2 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
			JOGO AO VIVO
		</div>
	</div>

	<div class="grid gap-3 grid-cols-2">
		<div class="flex gap-3">
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

		<div class="h-full">
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
const timeNow = ref(null);

onMounted(() => {
	options.value = props.data.filter(item => item.Date === new Date().toISOString().split('T')[0]).map((item) => ({
		...item,
		label: item.Home + ' vs. ' + item.Away,
		value: item._id,
	}));
	selectedOption.value = options.value[0];
	timeNow.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

import { DateTime } from 'luxon';

function isGameLive(game) {
	if (!game) {
		return false;
	}
	let now = DateTime.now();
	let gameTime = DateTime.fromFormat(game.Time, 'HH:mm');
	let diffInMinutes = now.diff(gameTime, 'minutes').minutes;

	return diffInMinutes >= 0 && diffInMinutes <= 120;
}

</script>

<style lang="scss" scoped>

</style>