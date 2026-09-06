<template>
  <div class="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
    <div class="flex items-center gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="align-middle text-xl font-semibold text-white sm:text-2xl">
          <slot name="title">{{ title }}</slot>
        </h1>

        <div v-if="description" class="text-sm text-zinc-400">
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
