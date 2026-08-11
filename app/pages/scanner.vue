<template>
  <div class="flex flex-col gap-5">
    <PageHeader title="Scanner ao vivo">
      <template #title>
        Scanner ao vivo
        <span
          class="ml-2 inline-block rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 align-middle text-xs font-semibold whitespace-nowrap text-zinc-400"
        >
          {{ games.length }} {{ games.length === 1 ? 'jogo' : 'jogos' }}
        </span>
      </template>

      <template #right>
        <div
          class="flex w-full items-center justify-between gap-3 text-xs text-zinc-400 sm:ml-auto sm:w-auto sm:justify-end"
        >
          <UButton to="/daily-report" target="_blank" color="primary" variant="soft" size="xs">
            Relatório do dia
          </UButton>

          <span class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>

              <span class="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
            </span>

            <USkeleton v-if="loading && !snapshot" class="h-3 w-28" />

            <span v-else-if="updatedAgo">Atualizado {{ updatedAgo }}</span>

            <span v-else class="text-zinc-600">sem dados</span>

            <span v-if="offline" class="text-zinc-600">· sem conexão</span>
          </span>
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

    <div v-else class="flex flex-col gap-4">
      <template v-if="favoriteGames.length">
        <section class="rounded-2xl border border-teal-500/30 bg-zinc-900 p-4">
          <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
              <UIcon name="i-lucide-star" mode="svg" class="star-fill size-4 text-amber-400" />
              Jogos favoritos
            </h2>

            <span
              class="text-2xs rounded-full border border-teal-500/30 bg-zinc-950 px-2.5 py-0.5 font-semibold whitespace-nowrap text-zinc-400"
            >
              {{ favoriteGames.length }} {{ favoriteGames.length === 1 ? 'jogo' : 'jogos' }}
            </span>
          </header>

          <TransitionGroup tag="div" name="fav" appear class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ScannerCard
              v-for="game in favoriteGames"
              :id="`game-${game.id}`"
              :key="game.id"
              :game="game"
              :highlighted="game.id === activeHighlight"
            />
          </TransitionGroup>
        </section>

        <USeparator />
      </template>

      <div v-if="otherGames.length" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ScannerCard
          v-for="game in otherGames"
          :id="`game-${game.id}`"
          :key="game.id"
          :game="game"
          :highlighted="game.id === activeHighlight"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFavorites } from '~/composables/useFavorites'

const config = useRuntimeConfig()
const route = useRoute()
const router = useRouter()

const snapshot = ref(null)
const loading = ref(true)
const fetchError = ref(false)
const offline = ref(false)
const updatedAgo = ref('')

// Destaque vindo do Telegram (?game=<id>): id ainda não encontrado no
// snapshot (highlightId) vs. id atualmente destacado (activeHighlight).
const highlightId = ref(route.query.game ? String(route.query.game) : null)
const activeHighlight = ref(null)
let highlightTimer

let inFlight = false
let pollTimer
let tickTimer

const games = computed(() => snapshot.value?.games || [])

// Favoritos no topo (só ao vivo — jogo finalizado sai da seção e volta pro
// grid normal até sair do snapshot). O resto segue no grid principal.
const { isFavorite } = useFavorites()
const favoriteGames = computed(() => games.value.filter((g) => !g.finished && isFavorite(g.id)))
const otherGames = computed(() => games.value.filter((g) => !(!g.finished && isFavorite(g.id))))

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
    maybeHighlight(games)
  } catch {
    fetchError.value = true
    offline.value = true
  } finally {
    inFlight = false
    loading.value = false
  }
}

// Se o jogo do Telegram está na lista E ainda ao vivo: rola até ele e acende
// o destaque por 12s. Se não está (não é mais transmitido) ou já encerrou
// (fica 15 min no snapshot com finished=true), descarta sem scrollar —
// highlight só dispara para jogo ao vivo presente num snapshot.
function maybeHighlight(list) {
  if (!highlightId.value) return
  const target = highlightId.value
  highlightId.value = null
  const game = list.find((g) => String(g.id) === target)
  if (!game || game.finished) return
  activeHighlight.value = target
  nextTick(() => {
    document.getElementById(`game-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    activeHighlight.value = null
  }, 12_000)
}

function tick() {
  updatedAgo.value = formatUpdatedAgo(snapshot.value?.generated_at)
}

onMounted(() => {
  // URL limpa depois de ler o parâmetro: refresh não re-dispara o destaque.
  if (route.query.game) router.replace({ query: {} })
  loadSnapshot()
  pollTimer = setInterval(loadSnapshot, 40_000)
  tickTimer = setInterval(tick, 1000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(tickTimer)
  clearTimeout(highlightTimer)
})
</script>
