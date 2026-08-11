<template>
  <div
    class="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1"
    :class="fullWidth && 'w-full md:w-auto'"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="rounded-md px-3 py-1 text-sm transition"
      :class="[
        opt.value === modelValue
          ? 'bg-teal-500 font-semibold text-zinc-950'
          : 'font-medium text-zinc-400 hover:text-white',
        fullWidth && 'flex-1 md:flex-none',
      ]"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
  fullWidth: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>
