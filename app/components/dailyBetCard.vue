<template>
  <div class="grid grid-cols-[auto_1fr] items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
    <div class="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-center">
      <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">{{ dateBadge.month }}</div>

      <div class="text-xl font-bold text-teal-400">{{ dateBadge.day }}</div>
    </div>

    <div>
      <div class="mb-6">
        <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">Horário · Modelo</div>

        <div class="flex items-center justify-between text-sm text-zinc-200">
          <span
            >{{ bet.Time }} · <span class="font-semibold text-teal-400">{{ bet.Modelo }}</span></span
          >

          <a
            v-if="bet.Fixture_ID"
            :href="flashscoreUrl(bet.Fixture_ID)"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver no Flashscore"
          >
            <UIcon name="i-lucide-external-link" class="text-lg text-zinc-500 hover:text-teal-400" />
          </a>
        </div>
      </div>

      <div class="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-zinc-100">{{ bet.Home }}</span>

          <span class="text-xs text-zinc-500">Casa</span>
        </div>

        <div class="my-1.5 h-px bg-zinc-800"></div>

        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-zinc-100">{{ bet.Away }}</span>

          <span class="text-xs text-zinc-500">Fora</span>
        </div>
      </div>

      <div class="mt-2.5 grid grid-cols-3 gap-1.5">
        <div class="rounded-lg border border-zinc-800 bg-zinc-950 py-2 text-center">
          <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">H</div>

          <div class="text-sm font-semibold text-zinc-100">{{ bet.FT_Odds_H }}</div>
        </div>

        <div class="rounded-lg border border-zinc-800 bg-zinc-950 py-2 text-center">
          <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">D</div>

          <div class="text-sm font-semibold text-zinc-100">{{ bet.FT_Odds_D }}</div>
        </div>

        <div class="rounded-lg border border-zinc-800 bg-zinc-950 py-2 text-center">
          <div class="text-xs font-medium tracking-wide text-zinc-500 uppercase">A</div>

          <div class="text-sm font-semibold text-zinc-100">{{ bet.FT_Odds_A }}</div>
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
