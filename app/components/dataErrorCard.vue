<template>
	<UCard class="w-full">
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<UIcon name="i-lucide-triangle-alert" class="w-12 h-12 text-gray-400 mb-3" />

			<p class="text-gray-500 font-medium">{{ message }}</p>
		</div>
	</UCard>
</template>

<script setup>
defineProps({
	message: {
		type: String,
		default: 'Não foi possível carregar as informações'
	}
})
</script>
