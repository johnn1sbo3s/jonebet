<template>
  <div>
    <svg
      v-if="bars.length"
      viewBox="0 0 640 124"
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfico de momentum"
      class="w-full"
    >
      <line x1="0" y1="62" x2="640" y2="62" stroke="#3f3f46" stroke-width="1" />

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
        :cy="g.team === 'home' ? 9 : 115"
        r="5"
        fill="#f4f4f5"
        :stroke="g.team === 'home' ? '#2dd4bf' : '#3b82f6'"
        stroke-width="2"
      >
        <title>{{ g.player || 'Gol' }} ({{ g.minute }}')</title>
      </circle>

      <template v-for="t in TICKS" :key="t">
        <line :x1="(t - 1) * (640 / 96)" y1="58" :x2="(t - 1) * (640 / 96)" y2="66" stroke="#3f3f46" />

        <text :x="(t - 1) * (640 / 96)" y="120" font-size="9" fill="#52525b" text-anchor="middle">{{ t }}'</text>
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
const CENTER = 62

function barHeight(b) {
  return Math.max(Number(b.home) || 0, Number(b.away) || 0) * 56
}

function barY(b) {
  return Number(b.home) > 0 ? CENTER - barHeight(b) : CENTER
}
</script>
