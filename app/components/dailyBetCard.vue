<template>
  <div class="grid grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
    <div class="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-center sm:px-3">
      <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">{{ dateBadge.month }}</div>

      <div class="text-lg leading-tight font-bold text-teal-400">{{ dateBadge.day }}</div>
    </div>

    <div class="flex min-w-0 flex-col gap-1.5">
      <div class="flex items-center justify-between gap-3">
        <span class="truncate text-sm text-zinc-200"
          >{{ bet.Time }} · <span class="font-semibold text-teal-400">{{ bet.Modelo }}</span></span
        >

        <a
          v-if="bet.Fixture_ID"
          :href="flashscoreUrl(bet.Fixture_ID)"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver no Flashscore"
          class="shrink-0"
        >
          <UIcon name="i-lucide-external-link" class="text-lg text-zinc-500 hover:text-teal-400" />
        </a>
      </div>

      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 flex-col">
          <span :title="bet.Home" class="truncate text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.Home }}</span>

          <span :title="bet.Away" class="truncate text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.Away }}</span>
        </div>

        <div class="flex shrink-0 gap-1 sm:gap-1.5">
          <div class="rounded-lg border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-center sm:px-2.5">
            <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">H</div>

            <div class="text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.FT_Odds_H }}</div>
          </div>

          <div class="rounded-lg border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-center sm:px-2.5">
            <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">D</div>

            <div class="text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.FT_Odds_D }}</div>
          </div>

          <div class="rounded-lg border border-zinc-800 bg-zinc-950 px-1.5 py-1 text-center sm:px-2.5">
            <div class="text-2xs font-medium tracking-wide text-zinc-500 uppercase">A</div>

            <div class="text-xs font-semibold text-zinc-100 sm:text-sm">{{ bet.FT_Odds_A }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { DateTime } from 'luxon'

const props = defineProps({
  bet: { type: Object, required: true },
})

const dateBadge = computed(() => {
  const dt = DateTime.fromISO(props.bet.Date, { zone: 'America/Sao_Paulo' })
  return { month: dt.toFormat('LLL'), day: dt.toFormat('dd') }
})
</script>
