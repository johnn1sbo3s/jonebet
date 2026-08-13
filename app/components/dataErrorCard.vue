<template>
  <UCard class="w-full">
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <UIcon :name="icon" class="mb-3 h-12 w-12 text-zinc-400" />

      <p class="font-medium text-zinc-400">{{ message }}</p>
    </div>
  </UCard>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Não foi possível carregar as informações',
  },
  icon: {
    type: String,
    default: 'i-lucide-triangle-alert',
  },
})
</script>
