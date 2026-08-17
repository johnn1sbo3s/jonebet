<template>
  <div>
    <svg
      v-if="bars.length"
      viewBox="0 0 640 158"
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfico de momentum"
      class="w-full"
    >
      <rect x="0" y="0" :width="W1" height="110" fill="#27272a" />

      <rect :x="P2" y="0" :width="W2" height="110" fill="#27272a" />

      <line x1="0" y1="55" x2="640" y2="55" stroke="#3f3f46" stroke-width="1" />

      <rect
        v-for="b in bars"
        :key="`${halfOf(b)}-${b.minute}`"
        class="momentum-bar"
        :x="barX(b)"
        :y="barY(b)"
        width="5"
        :height="barHeight(b)"
        rx="1.5"
        :fill="Number(b.home) > 0 ? '#2dd4bf' : '#3b82f6'"
        opacity="0.85"
      />

      <circle
        v-for="(g, i) in goals"
        :key="i"
        :cx="barX(g) + 2.5"
        :cy="g.team === 'home' ? 9 : 146"
        r="5"
        fill="#f4f4f5"
        :stroke="g.team === 'home' ? '#2dd4bf' : '#3b82f6'"
        stroke-width="2"
      >
        <title>{{ g.player || 'Gol' }} ({{ g.minute }}')</title>
      </circle>

      <template v-for="t in TICKS" :key="`${t.half}-${t.minute}`">
        <line :x1="tickX(t)" y1="51" :x2="tickX(t)" y2="59" stroke="#3f3f46" />

        <text :x="Math.min(tickX(t), 620)" y="153" font-size="18" fill="#52525b" text-anchor="middle">
          {{ t.minute }}'
        </text>
      </template>
    </svg>

    <p v-else class="py-6 text-center text-xs text-zinc-500">aguardando dados do gráfico</p>
  </div>
</template>

<script setup>
const props = defineProps({
  bars: { type: Array, default: () => [] },
  goals: { type: Array, default: () => [] },
})

// Geometria do gráfico do Flashscore (viewBox 640x158, centro em 55):
// mesma moldura — barra de valor 1.0 encosta no topo, como lá.
const CENTER = 55

// Ticks fixos por tempo (posição relativa ao painel).
const TICKS = [
  { half: 1, minute: 15 },
  { half: 1, minute: 30 },
  { half: 1, minute: 45 },
  { half: 2, minute: 50 },
  { half: 2, minute: 75 },
  { half: 2, minute: 90 },
]

// Painéis flexíveis: largura proporcional à duração real de cada tempo
// (45' + acréscimo). h1Len/h2Len derivam do maior minuto observado por half
// nas props (bars + goals), com mínimo 45 (jogo ao vivo — divisor estável)
// e clamp em 50 (backend clampado). Sem `half` (snapshot antigo na janela de
// deploy) mantém o mapeamento legado contínuo no painel 1, h2Len = 45.
// GAP: vão vazio entre os tempos (estilo Flashscore) — os dois painéis têm o
// mesmo fundo zinc-800 e a separação vem do espaço vazio, não de linha/cor.
const GAP = 8
function halfOf(item) {
  return Number(item.half) === 2 ? 2 : 1
}

function halfMaxMinute(half, items) {
  return items.reduce((max, it) => {
    if (halfOf(it) !== half) return max
    const m = (Number(it.minute) || 0) + (Number(it.stoppage_time) || 0)
    return Math.max(max, m)
  }, 0)
}

const h1Len = computed(() => Math.min(50, Math.max(45, halfMaxMinute(1, props.bars), halfMaxMinute(1, props.goals))))
const h2Len = computed(() =>
  Math.min(50, Math.max(45, halfMaxMinute(2, props.bars) - 45, halfMaxMinute(2, props.goals) - 45)),
)
const STEP = computed(() => (640 - GAP) / (h1Len.value + h2Len.value))
const W1 = computed(() => h1Len.value * STEP.value)
const W2 = computed(() => h2Len.value * STEP.value)
// Start do 2º painel: após o painel 1 + o gap.
const P2 = computed(() => W1.value + GAP)

// Minuto relativo ao painel: o 2º tempo recomeça em 1 (46' -> 1). Sem `half`
// mantém o mapeamento legado contínuo. Clamp só no relativo do 2º painel:
// gol de acréscimo longo (90+6' -> rel 51) estoura o viewBox.
function panelMinute(item) {
  const m = Number(item.minute) || 0
  if (halfOf(item) !== 2) return m
  return Math.min(m - 45, 50)
}

function barX(item) {
  return (halfOf(item) === 2 ? P2.value : 0) + (panelMinute(item) - 1) * STEP.value
}

function tickX(t) {
  const rel = t.half === 2 ? t.minute - 45 : t.minute
  return (t.half === 2 ? P2.value : 0) + (rel - 1) * STEP.value
}

function barHeight(b) {
  return Math.max(Number(b.home) || 0, Number(b.away) || 0) * 55
}

function barY(b) {
  return Number(b.home) > 0 ? CENTER - barHeight(b) : CENTER
}
</script>
