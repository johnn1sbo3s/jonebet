<template>
	<div class="flex gap-5">
		<div class="flex gap-3 items-center">
			<div class="flex flex-col gap-1">
				<h1 class="text-xl sm:text-2xl font-semibold align-middle">{{ title }}</h1>

				<div
					v-if="description"
					class="text-sm text-slate-500"
				>
					{{ description }}
				</div>
			</div>
		</div>

		<slot name="right"/>
	</div>
</template>

<script setup>
defineProps({
	title: {
			type: String,
			required: true,
	},
	description: {
			type: String,
			required: false,
			default: () => ''
	}
})
</script>
