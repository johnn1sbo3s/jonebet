<template>
  <div
    class="min-h-28 cursor-pointer rounded-2xl border border-l-[3px] border-zinc-800 bg-zinc-900 p-4 transition-colors hover:bg-zinc-800/60"
    :class="borderColorClass"
    @click="expanded = !expanded"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <h3 class="text-base font-semibold text-white">{{ term.name }}</h3>

      <span class="text-xs font-semibold" :class="textColorClass">
        {{ term.category }}
      </span>
    </div>

    <p class="line-clamp-2 text-sm leading-relaxed text-zinc-400">{{ term.short }}</p>

    <Transition name="expand">
      <div v-if="expanded" class="mt-4 space-y-3 overflow-hidden">
        <div>
          <p class="mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">Detalhe</p>

          <p class="text-sm leading-relaxed whitespace-pre-line text-zinc-300">{{ term.long }}</p>
        </div>

        <div>
          <p class="mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">Exemplo</p>

          <p class="text-sm leading-relaxed text-zinc-300">{{ term.example }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  term: {
    type: Object,
    required: true,
  },
})

const expanded = ref(false)

const borderColorClass = computed(() => {
  const map = {
    Conceito: 'border-l-teal-500',
    Estratégia: 'border-l-violet-500',
    Modelo: 'border-l-amber-500',
  }
  return map[props.term.category] || 'border-l-zinc-500'
})

const textColorClass = computed(() => {
  const map = {
    Conceito: 'text-teal-500',
    Estratégia: 'text-violet-500',
    Modelo: 'text-amber-500',
  }
  return map[props.term.category] || 'text-zinc-500'
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
