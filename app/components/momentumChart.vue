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
        :key="b.minute"
        :x="(b.minute - 1) * (640 / 96)"
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
        :cx="(g.minute - 1) * (640 / 96) + 2.5"
        :cy="g.team === 'home' ? 9 : 146"
        r="5"
        fill="#f4f4f5"
        :stroke="g.team === 'home' ? '#2dd4bf' : '#3b82f6'"
        stroke-width="2"
      >
        <title>{{ g.player || 'Gol' }} ({{ g.minute }}')</title>
      </circle>

      <template v-for="t in TICKS" :key="t">
        <line :x1="(t - 1) * (640 / 96)" y1="51" :x2="(t - 1) * (640 / 96)" y2="59" stroke="#3f3f46" />

        <text :x="(t - 1) * (640 / 96)" y="153" font-size="20" fill="#52525b" text-anchor="middle">{{ t }}'</text>
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

const TICKS = [15, 30, 45, 60, 75, 90]
// Geometria do gráfico do Flashscore (viewBox 640x158, centro em 55):
// mesma moldura — barra de valor 1.0 encosta no topo, como lá.
const CENTER = 55

function barHeight(b) {
  return Math.max(Number(b.home) || 0, Number(b.away) || 0) * 55
}

function barY(b) {
  return Number(b.home) > 0 ? CENTER - barHeight(b) : CENTER
}
</script>
