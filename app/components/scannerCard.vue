<template>
  <div class="h-full cursor-pointer [perspective:1200px]" @click="flipped = !flipped">
    <div
      class="relative h-full transition-transform duration-500 [transform-style:preserve-3d]"
      :class="{ '[transform:rotateY(180deg)]': flipped }"
    >
      <div
        ref="frontEl"
        class="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 [backface-visibility:hidden]"
        :class="{ 'glow-card': isRecent, 'opacity-75': game.finished }"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-2xs font-semibold tracking-wide text-zinc-500 uppercase">{{ game.league }}</span>

          <div class="print-hide flex items-center gap-1.5">
            <button
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-teal-400 hover:text-teal-400"
              title="Tirar print do card"
              @click.stop="captureCard"
            >
              <UIcon name="i-lucide-camera" class="h-3.5 w-3.5" />
            </button>

            <a
              class="flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1.5 text-xs font-semibold text-zinc-400 hover:border-teal-400 hover:text-teal-400"
              :href="game.flashscore_url"
              target="_blank"
              rel="noopener"
              @click.stop
            >
              Flashscore <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
            </a>
          </div>
        </div>

        <div class="mb-2.5 flex items-center gap-2 text-sm font-semibold">
          <span class="min-w-0 text-zinc-400">{{ game.home }}</span>

          <span class="shrink-0 text-base font-bold whitespace-nowrap text-zinc-100"
            >{{ game.score.home }} x {{ game.score.away }}</span
          >

          <span class="min-w-0 text-zinc-400">{{ game.away }}</span>

          <span
            v-if="game.finished"
            class="ml-auto shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs font-bold whitespace-nowrap text-zinc-400"
            >Encerrado</span
          >

          <span
            v-else
            class="ml-auto shrink-0 rounded-full border border-teal-500/25 bg-teal-500/10 px-1.5 py-0.5 text-xs font-bold whitespace-nowrap text-teal-400"
            >{{ game.minute }}'</span
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
        </div>
      </div>

      <div
        class="absolute inset-0 flex [transform:rotateY(180deg)] flex-col overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 [backface-visibility:hidden]"
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { isRecentNotification } from '~/utils/scanner.js'
import { toBlob } from 'html-to-image'

const props = defineProps({
  game: { type: Object, required: true },
})

const STAT_LABELS = [
  ['xg', 'XG'],
  ['possession', 'POSSE'],
  ['shots', 'FINALIZAÇÕES'],
  ['big_chances', 'CHANCES CLARAS'],
  ['box_touches', 'TOQUES NA ÁREA'],
]

const flipped = ref(false)

const isRecent = computed(() => isRecentNotification(props.game.notifications))

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
