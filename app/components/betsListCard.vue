<template>
  <div class="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs text-zinc-500">{{ formatDate(bet.date, { style: 'short' }) }}</span>

      <div class="flex items-center gap-2">
        <span
          v-if="bet.result"
          class="text-2xs rounded-full px-2 py-0.5 font-semibold tracking-wide uppercase"
          :class="bet.result.toLowerCase() === 'green' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'"
        >
          {{ bet.result[0].toUpperCase() + bet.result.slice(1) }}
        </span>

        <span v-else class="text-xs text-zinc-500">—</span>

        <span
          class="text-sm font-bold"
          :class="bet.profit > 0 ? 'text-teal-400' : bet.profit < 0 ? 'text-red-400' : 'text-white'"
        >
          {{ formatUnit(bet.profit) }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-1.5">
        <span :title="bet.home" class="truncate text-sm font-semibold text-zinc-100">{{ bet.home }}</span>

        <span class="shrink-0 text-xs text-zinc-500">vs</span>

        <span :title="bet.away" class="truncate text-sm font-semibold text-zinc-100">{{ bet.away }}</span>
      </div>

      <span class="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm font-semibold text-white">
        {{ formatNumber(bet.odds) }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  bet: {
    type: Object,
    required: true,
  },
})
</script>
