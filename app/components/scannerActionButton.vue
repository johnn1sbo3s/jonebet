<template>
  <component
    :is="href ? 'a' : 'button'"
    :type="href ? undefined : 'button'"
    :href="href || undefined"
    :target="href ? target : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
    :class="[base, square ? squareCls : textCls, color === 'amber' ? amberHover : tealHover, active ? activeCls : '']"
    v-bind="$attrs"
  >
    <UIcon v-if="icon" :name="icon" mode="svg" class="h-3.5 w-3.5" />

    <slot />
  </component>
</template>

<script setup>
defineOptions({ inheritAttrs: false })
defineProps({
  icon: { type: String, default: '' },
  href: { type: String, default: '' },
  target: { type: String, default: '_blank' },
  square: { type: Boolean, default: false },
  color: { type: String, default: 'teal' },
  active: { type: Boolean, default: false },
})
const base = 'flex h-7 rounded-lg border border-zinc-800 text-zinc-400 transition-colors'
const squareCls = 'w-7 items-center justify-center'
const textCls = 'items-center gap-1 px-2'
const tealHover = 'hover:border-teal-400 hover:text-teal-400'
const amberHover = 'hover:border-amber-400 hover:text-amber-400'
const activeCls = 'border-amber-400/60 bg-amber-400/10 text-amber-400'
</script>
