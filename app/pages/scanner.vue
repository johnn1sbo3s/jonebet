<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Scanner ao vivo">
      <template #title>
        Scanner ao vivo
        <span
          class="ml-2 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 align-middle text-xs font-semibold text-zinc-400"
        >
          {{ games.length }} {{ games.length === 1 ? 'jogo' : 'jogos' }}
        </span>
      </template>

      <template #right>
        <div class="ml-auto flex items-center gap-2 text-xs text-zinc-400">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>

            <span class="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
          </span>

          <USkeleton v-if="loading && !snapshot" class="h-3 w-28" />

          <span v-else-if="updatedAgo" class="w-36 whitespace-nowrap">Atualizado {{ updatedAgo }}</span>

          <span v-else class="text-zinc-600">sem dados</span>

          <span v-if="offline" class="text-zinc-600">· sem conexão</span>
        </div>
      </template>
    </PageHeader>

    <ScannerSkeleton v-if="loading && !snapshot" />

    <div
      v-else-if="fetchError && !snapshot"
      class="rounded-2xl border border-zinc-800 bg-zinc-900 py-16 text-center text-sm text-zinc-500"
    >
      Não foi possível carregar os jogos ao vivo. Tente novamente em instantes.
    </div>

    <div v-else-if="games.length === 0" class="py-16 text-center text-sm text-zinc-500">Nenhum jogo ao vivo agora</div>

    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <ScannerCard v-for="game in games" :key="game.id" :game="game" />
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()

const snapshot = ref(null)
const loading = ref(true)
const fetchError = ref(false)
const offline = ref(false)
const updatedAgo = ref('')

let inFlight = false
let pollTimer
let tickTimer

const games = computed(() => snapshot.value?.games || [])

async function loadSnapshot() {
  if (inFlight) return
  inFlight = true
  try {
    const data = await $fetch(config.public.SCANNER_SNAPSHOT_URL)
    const parsed = safeParse('scannerSnapshot', data)
    const localHistory = loadLocalHistory()
    const games = (parsed.games || []).map((g) => {
      const merged = mergeHistories(g.notifications, localHistory[g.id])
      return { ...g, notifications: merged }
    })
    saveLocalHistory(pruneLocalHistory(games))
    snapshot.value = { ...parsed, games }
    fetchError.value = false
    offline.value = false
  } catch {
    fetchError.value = true
    offline.value = true
  } finally {
    inFlight = false
    loading.value = false
  }
}

function tick() {
  updatedAgo.value = formatUpdatedAgo(snapshot.value?.generated_at)
}

onMounted(() => {
  loadSnapshot()
  pollTimer = setInterval(loadSnapshot, 40_000)
  tickTimer = setInterval(tick, 1000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(tickTimer)
})
</script>
