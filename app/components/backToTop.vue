<template>
  <button
    type="button"
    aria-label="Voltar ao topo"
    class="fixed right-6 bottom-6 z-40 flex size-11 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 transition-transform duration-200 active:scale-[0.97] hover:border-zinc-600 hover:text-white"
    :class="visible ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    @click="scrollTop"
  >
    <UIcon name="i-lucide-arrow-up" class="size-5" />
  </button>
</template>

<script setup>
const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > window.innerHeight
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
