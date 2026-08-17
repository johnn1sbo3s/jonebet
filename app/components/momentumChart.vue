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
      <line x1="0" y1="55" x2="640" y2="55" stroke="#3f3f46" stroke-width="1" />

      <line x1="320" y1="0" x2="320" y2="158" stroke="#71717a" stroke-width="1" stroke-dasharray="4 4" opacity="0.7" />

      <rect
        v-for="b in bars"
        :key="`${halfOf(b)}-${b.minute}`"
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

        <text :x="tickX(t)" y="153" font-size="20" fill="#52525b" text-anchor="middle">{{ t.minute }}'</text>
      </template>
    </svg>

    <p v-else class="py-6 text-center text-xs text-zinc-500">aguardando dados do gráfico</p>
  </div>
</template>

<script setup>
defineProps({
  bars: { type: Array, default: () => [] },
  goals: { type: Array, default: () => [] },
})

// Dois painéis de 320px (metade do viewBox 640), 50 slots de minuto cada.
const PANEL_W = 320
const STEP = PANEL_W / 50
const TICKS = [
  { half: 1, minute: 15 },
  { half: 1, minute: 30 },
  { half: 1, minute: 45 },
  { half: 2, minute: 50 },
  { half: 2, minute: 75 },
  { half: 2, minute: 90 },
]
// Geometria do gráfico do Flashscore (viewBox 640x158, centro em 55):
// mesma moldura — barra de valor 1.0 encosta no topo, como lá.
const CENTER = 55

function halfOf(item) {
  return Number(item.half) === 2 ? 2 : 1
}

// Minuto relativo ao painel: o 2º tempo recomeça em 1 (46' -> 1). Sem `half`
// (snapshot antigo na janela de deploy) mantém o mapeamento legado contínuo.
// Clamp só no relativo do 2º painel: gol de acréscimo longo (90+6' -> rel
// 51) estoura o viewBox (cx 642.5 > 640). 1ºT nunca passa de 50 (barra do
// backend clampada em 50; gol do 1ºT tem minute <= 45); o legado é contínuo
// de propósito.
function panelMinute(item) {
  const m = Number(item.minute) || 0
  if (halfOf(item) !== 2) return m
  return Math.min(m - 45, 50)
}

function barX(item) {
  return (halfOf(item) === 2 ? PANEL_W : 0) + (panelMinute(item) - 1) * STEP
}

function tickX(t) {
  const rel = t.half === 2 ? t.minute - 45 : t.minute
  return (t.half === 2 ? PANEL_W : 0) + (rel - 1) * STEP
}

function barHeight(b) {
  return Math.max(Number(b.home) || 0, Number(b.away) || 0) * 55
}

function barY(b) {
  return Number(b.home) > 0 ? CENTER - barHeight(b) : CENTER
}
</script>
