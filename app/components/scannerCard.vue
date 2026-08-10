<template>
  <div class="relative h-full cursor-pointer perspective-distant" @click="flipped = !flipped">
    <div
      class="relative h-full transition-transform duration-500 transform-3d"
      :class="{ 'transform-[rotateY(180deg)]': flipped }"
    >
      <div
        ref="frontEl"
        class="card-shine flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 backface-hidden"
        :class="{ 'glow-card': isRecent, 'opacity-60': game.finished }"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-2xs font-semibold tracking-wide text-zinc-500 uppercase">{{ game.league }}</span>

          <div class="print-hide flex items-center gap-1.5">
            <UBadge
              v-if="game.notifications?.length"
              color="neutral"
              variant="outline"
              size="md"
              class="gap-1 px-2.5"
              title="Notificações recebidas pelo jogo"
            >
              <UIcon name="i-lucide-bell" class="h-3.5 w-3.5" />
              {{ game.notifications.length }}
            </UBadge>

            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-teal-400 hover:text-teal-400"
              title="Tirar print do card"
              @click.stop="captureCard"
            >
              <UIcon name="i-lucide-camera" class="h-3.5 w-3.5" />
            </button>

            <a
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-teal-400 hover:text-teal-400"
              :href="game.flashscore_url"
              target="_blank"
              rel="noopener"
              title="Abrir no Flashscore"
              @click.stop
            >
              <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div class="mb-2.5 flex items-center gap-2 text-sm font-semibold">
          <span class="min-w-0 text-zinc-400">{{ game.home }}</span>

          <span class="shrink-0 text-base font-bold whitespace-nowrap text-zinc-100"
            >{{ game.score.home }} x {{ game.score.away }}</span
          >

          <span class="min-w-0 text-zinc-400">{{ game.away }}</span>

          <UBadge
            v-if="game.finished"
            color="neutral"
            variant="outline"
            size="md"
            class="ml-auto shrink-0 rounded-full font-bold whitespace-nowrap"
            >Encerrado</UBadge
          >

          <UBadge
            v-else-if="isHalftime"
            color="primary"
            variant="subtle"
            size="md"
            class="ml-auto shrink-0 rounded-full font-bold whitespace-nowrap"
            >Intervalo</UBadge
          >

          <UBadge
            v-else
            color="primary"
            variant="subtle"
            size="md"
            class="ml-auto shrink-0 rounded-full font-bold whitespace-nowrap"
            >{{ game.minute }}'</UBadge
          >
        </div>

        <div v-if="hasOdds" class="mb-2.5 grid grid-cols-[1fr_1fr_1fr_0.85fr_0.85fr] gap-x-1 gap-y-0.5">
          <div v-for="col in oddsColumns" :key="col.label" class="flex flex-col gap-0.5">
            <span class="text-2xs text-center font-semibold tracking-wide text-zinc-600 uppercase">{{
              col.label
            }}</span>

            <UBadge color="secondary" variant="soft" size="sm" class="justify-center">{{ col.value ?? '-' }}</UBadge>
          </div>
        </div>

        <MomentumChart :bars="game.momentum" :goals="game.goals" class="mb-3" />

        <div class="mt-auto flex flex-col gap-2">
          <div v-for="row in statRows" :key="row.label" class="flex flex-col gap-0.5">
            <div class="flex items-baseline justify-between text-xs">
              <span class="font-bold text-zinc-200">{{ row.home }}</span>

              <span class="text-2xs tracking-wide text-zinc-500 uppercase">{{ row.label }}</span>

              <span class="font-bold text-zinc-200">{{ row.away }}</span>
            </div>

            <div class="flex h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div v-if="row.pctHome !== null" class="bg-teal-400" :style="{ width: row.pctHome + '%' }"></div>

              <div v-if="row.pctHome !== null" class="bg-blue-500" :style="{ width: 100 - row.pctHome + '%' }"></div>
            </div>
          </div>

          <UButton
            v-if="!game.finished"
            block
            class="mt-1"
            color="neutral"
            variant="outline"
            size="sm"
            title="Ver a análise pré-jogo do jogo (relatório do dia)"
            @click.stop="openPreGame"
          >
            Análise pré-jogo
          </UButton>

          <UButton
            v-if="!game.finished"
            block
            color="primary"
            variant="soft"
            size="sm"
            :disabled="aiLoading"
            title="Avaliar o momento do jogo com IA"
            @click.stop="openAiEvaluation"
          >
            ✨ Avaliar com IA
          </UButton>
        </div>
      </div>

      <div
        class="absolute inset-0 flex transform-[rotateY(180deg)] flex-col overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 backface-hidden"
      >
        <div class="mb-2.5 flex items-center justify-between">
          <span class="flex items-center gap-1.5 text-sm font-bold">
            <UIcon name="i-lucide-bell" class="text-teal-400" /> Notificações
          </span>

          <button
            class="rounded-lg border border-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400 hover:border-teal-400 hover:text-teal-400"
            @click.stop="flipped = false"
          >
            ← Voltar
          </button>
        </div>

        <div v-if="game.notifications?.length" class="flex flex-col gap-1.5">
          <div
            v-for="(n, i) in game.notifications"
            :key="i"
            class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-xs"
          >
            <UIcon name="i-lucide-bell" class="shrink-0 text-teal-400" />

            <span class="flex-1 font-semibold text-zinc-200">{{ n.label }}</span>

            <span class="text-2xs rounded-full bg-teal-500/10 px-1.5 py-0.5 font-bold text-teal-400"
              >{{ n.minute }}'</span
            >

            <span class="text-xs whitespace-nowrap text-zinc-500">{{ formatTime(n.at) }}</span>
          </div>
        </div>

        <p v-else class="m-auto text-center text-xs text-zinc-600">Sem notificações neste jogo ainda</p>
      </div>
    </div>

    <div
      v-if="aiOpen"
      class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/70 p-3"
      @click.stop
    >
      <div class="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-2xs font-bold tracking-wide text-teal-400 uppercase">Análise da IA</span>

          <button
            class="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-400 hover:border-teal-400 hover:text-teal-400"
            @click.stop="aiOpen = false"
          >
            ✕
          </button>
        </div>

        <div v-if="aiLoading" class="flex flex-col items-center gap-2 py-4">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-teal-500/25 border-t-teal-400"></span>

          <span class="text-xs text-zinc-400">Analisando o jogo...</span>
        </div>

        <div v-else-if="aiState.error" class="flex flex-col items-center gap-2 py-2 text-center">
          <p class="text-xs text-zinc-400">Não foi possível avaliar agora.</p>

          <button
            class="rounded-lg border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-400"
            @click.stop="retryAi"
          >
            Tentar de novo
          </button>
        </div>

        <template v-else-if="aiResponse">
          <p class="text-xs leading-relaxed text-zinc-200">{{ aiResponse.leitura_geral }}</p>

          <div class="mt-2 flex flex-col gap-1.5">
            <div
              v-for="e in aiResponse.estrategias"
              :key="e.estrategia"
              class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5"
            >
              <span class="text-xs font-bold text-zinc-100">{{ modelNameToNaturalName(e.estrategia) }}</span>

              <span class="text-xs font-bold" :class="e.recomendacao === 'entrar' ? 'text-teal-400' : 'text-amber-400'">
                {{ e.recomendacao }} · {{ e.confianca }}%
              </span>
            </div>

            <p v-for="e in aiResponse.estrategias" :key="e.estrategia + '-an'" class="text-2xs text-zinc-500">
              {{ e.analise }}
            </p>
          </div>
        </template>
      </div>
    </div>

    <div
      v-if="preGameOpen"
      class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/70 p-3"
      @click.stop
    >
      <div class="max-h-full w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-3">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-2xs font-bold tracking-wide text-teal-400 uppercase">
            {{ preGameResponse?.time ? `Análise pré-jogo · ${preGameResponse.time}` : 'Análise pré-jogo' }}
          </span>

          <button
            class="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 text-xs text-zinc-400 hover:border-teal-400 hover:text-teal-400"
            @click.stop="preGameOpen = false"
          >
            ✕
          </button>
        </div>

        <div v-if="preGameLoading" class="flex flex-col items-center gap-2 py-4">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-teal-500/25 border-t-teal-400"></span>

          <span class="text-xs text-zinc-400">Buscando análise pré-jogo...</span>
        </div>

        <div v-else-if="preGameState.error" class="flex flex-col items-center gap-2 py-2 text-center">
          <p class="text-xs text-zinc-400">Não foi possível carregar a análise pré-jogo.</p>

          <button
            class="rounded-lg border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-400"
            @click.stop="retryPreGame"
          >
            Tentar de novo
          </button>
        </div>

        <template v-else-if="preGameResponse">
          <p class="text-xs leading-relaxed text-zinc-200">{{ preGameResponse.leitura_geral }}</p>

          <div class="mt-2 flex flex-col gap-1.5">
            <div
              v-for="e in preGameResponse.estrategias"
              :key="e.estrategia"
              class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5"
            >
              <span class="text-xs font-bold text-zinc-100">{{ modelNameToNaturalName(e.estrategia) }}</span>

              <span class="text-xs font-bold" :class="e.recomendacao === 'entrar' ? 'text-teal-400' : 'text-amber-400'">
                {{ e.recomendacao }} · {{ e.confianca }}%
              </span>
            </div>

            <p v-for="e in preGameResponse.estrategias" :key="e.estrategia + '-an'" class="text-2xs text-zinc-500">
              {{ e.analise }}
            </p>
          </div>
        </template>

        <div v-else class="flex flex-col items-center gap-1 py-4 text-center">
          <p class="text-xs text-zinc-400">Sem análise pré-jogo para este jogo.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { isRecentNotification } from '~/utils/scanner.js'
import { modelNameToNaturalName } from '~/utils/resolveModelName'
import { toBlob } from 'html-to-image'
import { useAiEvaluation } from '~/composables/useAiEvaluation'
import { usePreGameAnalysis } from '~/composables/usePreGameAnalysis'

const props = defineProps({
  game: { type: Object, required: true },
})

const { get: getAiState, evaluate: evaluateAi } = useAiEvaluation()
const aiOpen = ref(false)
const aiState = computed(() => getAiState(props.game.id))
const aiLoading = computed(() => aiState.value.status === 'loading')
const aiResponse = computed(() => aiState.value.response)

async function openAiEvaluation() {
  aiOpen.value = true
  try {
    await evaluateAi(props.game.id)
  } catch {
    // erro fica no estado (aiState.error) e o popover mostra retry
  }
}

function retryAi() {
  evaluateAi(props.game.id).catch(() => {})
}

const { get: getPreGame, load: loadPreGame } = usePreGameAnalysis()
const preGameOpen = ref(false)
const preGameState = computed(() => getPreGame(props.game.id))
const preGameLoading = computed(() => preGameState.value.status === 'loading')
const preGameResponse = computed(() => preGameState.value.response)

async function openPreGame() {
  preGameOpen.value = true
  try {
    await loadPreGame(props.game.id)
  } catch {
    // erro fica no estado (preGameState.error) e o modal mostra retry
  }
}

function retryPreGame() {
  loadPreGame(props.game.id).catch(() => {})
}

const STAT_LABELS = [
  ['xg', 'XG'],
  ['possession', 'POSSE'],
  ['shots', 'FINALIZAÇÕES'],
  ['big_chances', 'CHANCES CLARAS'],
  ['box_touches', 'TOQUES NA ÁREA'],
]

const flipped = ref(false)

const isRecent = computed(() => isRecentNotification(props.game.notifications))

// Intervalo: Flashscore entrega "Half time"/"HALF TIME"/"Halftime"/"HT"/
// "Interval(o)" conforme locale — o backend fixa o minuto em 45, e aqui o
// badge troca o minuto por "Intervalo" (não confundir com "1ST HALF"/"2nd Half").
const isHalftime = computed(() => /^(ht|halftime)$|interval|half[\s-]*time/i.test((props.game.status || '').trim()))

const statRows = computed(() =>
  STAT_LABELS.map(([key, label]) => {
    const pair = props.game.stats?.[key] || {}
    const home = pair.home
    const away = pair.away
    const total = (Number(home) || 0) + (Number(away) || 0)
    return {
      label,
      home: home ?? '—',
      away: away ?? '—',
      pctHome: total > 0 ? ((Number(home) || 0) / total) * 100 : null,
    }
  }),
)

const odds = computed(() => props.game.odds || {})
const prematch = computed(() => odds.value.prematch || {})

const hasAnyOdds = (o) => [o.home, o.draw, o.away, o.over25, o.btts].some((v) => v != null)
const hasOdds = computed(() => hasAnyOdds(prematch.value))

// Colunas de odds sempre presentes (label + valor empilhados na mesma célula);
// valor ausente vira "-" — assim o grid nunca desalinha por auto-placement.
const oddsColumns = computed(() => [
  { label: 'Casa', value: prematch.value.home },
  { label: 'Empate', value: prematch.value.draw },
  { label: 'Fora', value: prematch.value.away },
  { label: 'O2.5', value: prematch.value.over25 },
  { label: 'BTTS', value: prematch.value.btts },
])

function formatTime(at) {
  return new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const frontEl = ref(null)
const toast = useToast()

async function captureCard() {
  const node = frontEl.value
  if (!node) return
  // Print sem o glow: remove a classe só durante a captura (o glow é animado
  // via box-shadow e "vaza" para fora do card na imagem). O front face é o
  // alvo — o verso (flip) é irmão no DOM e não entra no subtree.
  const hadGlow = node.classList.contains('glow-card')
  if (hadGlow) node.classList.remove('glow-card')
  try {
    const blob = await toBlob(node, {
      pixelRatio: window.devicePixelRatio || 1,
      // Botões de ação (print/Flashscore) não entram no print — o hover do
      // clique ficaria congelado na imagem.
      filter: (n) => !(n instanceof HTMLElement && n.classList.contains('print-hide')),
    })
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.add({ title: 'Print copiado!', color: 'success' })
        return
      } catch {
        // clipboard negada — cai no download abaixo
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scanner-${props.game.id}.png`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: 'Clipboard indisponível — print baixado', color: 'warning' })
  } catch {
    toast.add({ title: 'Não foi possível gerar o print', color: 'error' })
  } finally {
    if (hadGlow) node.classList.add('glow-card')
  }
}
</script>

<style scoped>
.glow-card {
  border-color: rgba(45, 212, 191, 0.75);
  animation: glow-breathe 2.6s ease-in-out infinite;
}

@keyframes glow-breathe {
  0%,
  100% {
    box-shadow:
      0 0 8px rgba(45, 212, 191, 0.14),
      0 0 2px rgba(45, 212, 191, 0.2);
  }

  50% {
    box-shadow:
      0 0 26px rgba(45, 212, 191, 0.38),
      0 0 6px rgba(45, 212, 191, 0.3);
  }
}
</style>
