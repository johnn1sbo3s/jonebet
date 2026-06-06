<template>
  <div class="flex gap-5">
    <div class="flex items-center gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="align-middle text-xl font-semibold sm:text-2xl">{{ title }}</h1>

        <div v-if="description" class="text-sm text-slate-500">
          {{ description }}
        </div>
      </div>
    </div>

    <slot name="right" />
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
    default: () => '',
  },
})
</script>
