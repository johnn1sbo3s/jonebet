<template>
	<u-card class="w-full">
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-gray-400 mb-3" />
			<p class="text-gray-500 font-medium">{{ message }}</p>
		</div>
	</u-card>
</template>

<script setup>
defineProps({
	message: {
		type: String,
		default: 'Não foi possível carregar as informações'
	}
})
</script>
