<template>
  <span
    v-if="comparable && delta != null"
    class="text-2xs inline-flex items-center font-medium"
    :class="deltaClass"
    :title="tooltipText"
    :data-metric="def.key"
  >
    <UIcon :name="deltaIcon" class="h-3 w-3" />
    {{ deltaLabel }}
  </span>
</template>

<script setup>
const props = defineProps({
  def: {
    type: Object,
    required: true,
  },
  real: {
    type: Number,
    default: null,
  },
  val: {
    type: Number,
    default: null,
  },
})

const comparable = computed(() => props.def.comparable && props.real != null && props.val != null)

const delta = computed(() => {
  if (!comparable.value) return null
  return props.real - props.val
})

const deltaLabel = computed(() => {
  if (delta.value == null) return ''
  const factor = props.def.deltaFactor ?? 1
  const formatted = formatNumber(delta.value * factor, 2)
  const sign = delta.value > 0 ? '+' : ''
  return `${sign}${formatted}${props.def.deltaUnit ?? ''}`
})

const deltaClass = computed(() => {
  if (delta.value == null) return 'text-zinc-500'
  if (delta.value > 0) return 'text-teal-400'
  if (delta.value < 0) return 'text-red-400'
  return 'text-zinc-500'
})

const deltaIcon = computed(() => {
  if (delta.value == null) return 'i-lucide-minus'
  if (delta.value > 0) return 'i-lucide-arrow-up'
  if (delta.value < 0) return 'i-lucide-arrow-down'
  return 'i-lucide-minus'
})

const tooltipText = computed(() => {
  if (delta.value == null) return ''
  return `Val: ${props.def.format(props.val)} · Real: ${props.def.format(props.real)}`
})
</script>
