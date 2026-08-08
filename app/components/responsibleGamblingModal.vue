<template>
  <UModal v-model:open="showModal" :dismissible="false">
    <template #content>
      <ResponsibleGamblingContent @acknowledge="acknowledge" />
    </template>
  </UModal>

  <UDrawer v-model:open="showDrawer" :ui="{ content: 'bg-zinc-900' }" :dismissible="false">
    <template #content>
      <ResponsibleGamblingContent @acknowledge="acknowledge" />
    </template>
  </UDrawer>
</template>

<script setup>
const STORAGE_KEY = 'jonebet:gambling-alert-dismissed'

const isNarrow = ref(false)
const showModal = ref(false)
const showDrawer = ref(false)

function handleResize() {
  isNarrow.value = window.innerWidth < 1024
}

function wasDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // storage indisponível — mostra o aviso mesmo assim
    return false
  }
}

function close() {
  showModal.value = false
  showDrawer.value = false
}

function acknowledge() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // storage indisponível — segue sem persistir
  }
  close()
}

onMounted(() => {
  isNarrow.value = window.innerWidth < 1024
  window.addEventListener('resize', handleResize)

  if (!wasDismissed()) {
    if (isNarrow.value) {
      showDrawer.value = true
    } else {
      showModal.value = true
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
