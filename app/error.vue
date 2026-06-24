<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
    <UCard class="max-w-md border border-zinc-800 bg-zinc-900">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-alert-triangle" class="text-3xl text-red-400" />

          <div>
            <p class="text-lg font-semibold text-white">
              {{ is404 ? 'Página não encontrada' : 'Algo deu errado' }}
            </p>

            <p class="text-xs text-zinc-400">DataPlay Bets</p>
          </div>
        </div>
      </template>

      <p class="text-sm text-zinc-300">
        {{
          is404
            ? 'A rota que você procura não existe ou foi movida.'
            : 'Ocorreu um erro inesperado ao carregar esta página.'
        }}
      </p>

      <p v-if="statusMessage" class="mt-3 text-xs text-zinc-500">
        Código: {{ error.statusCode }} — {{ statusMessage }}
      </p>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="secondary" variant="soft" @click="handleHome">Voltar ao início</UButton>

          <UButton color="primary" @click="handleClear">Tentar novamente</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    required: true,
  },
})

const is404 = computed(() => props.error?.statusCode === 404)
const statusMessage = computed(() => {
  const code = props.error?.statusCode
  if (code === 404) return 'Not Found'
  if (code === 500) return 'Internal Server Error'
  if (code === 503) return 'Service Unavailable'
  return props.error?.message || null
})

function handleHome() {
  clearError({ redirect: '/' })
}

function handleClear() {
  clearError({ redirect: '/' })
}
</script>
