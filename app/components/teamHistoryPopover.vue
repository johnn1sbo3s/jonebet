<template>
  <UPopover :content="{ align: 'end' }">
    <button
      type="button"
      class="text-2xs rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 font-semibold text-zinc-400 transition-colors hover:border-teal-600 hover:text-teal-400"
      title="Histórico dos times (pipeline pré-live)"
    >
      📊 Histórico
    </button>

    <template #content>
      <div class="w-64 p-3 text-xs text-zinc-200">
        <div class="text-2xs mb-1 flex justify-between tracking-wide text-zinc-500 uppercase">
          <span>{{ home }} <span class="text-zinc-700">(últ. 10)</span></span>

          <span>{{ away }}</span>
        </div>

        <div
          v-if="formHome || formAway"
          class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 border-b border-zinc-800 py-1.5"
        >
          <span class="flex justify-end gap-0.5">
            <span
              v-for="(r, i) in formHome"
              :key="`h${i}`"
              :class="resultClass(r)"
              class="flex size-3.5 items-center justify-center rounded-sm text-[0.5rem] font-bold"
              >{{ r }}</span
            >
          </span>

          <span class="text-2xs text-zinc-500 uppercase">forma</span>

          <span class="flex gap-0.5">
            <span
              v-for="(r, i) in formAway"
              :key="`a${i}`"
              :class="resultClass(r)"
              class="flex size-3.5 items-center justify-center rounded-sm text-[0.5rem] font-bold"
              >{{ r }}</span
            >
          </span>
        </div>

        <div
          v-for="row in rows"
          :key="row.label"
          class="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 border-b border-zinc-800 py-1.5 last:border-b-0"
        >
          <span class="text-right font-semibold text-zinc-100 tabular-nums">{{ row.home }}</span>

          <span class="text-2xs text-zinc-500 uppercase">{{ row.label }}</span>

          <span class="font-semibold text-zinc-100 tabular-nums">{{ row.away }}</span>
        </div>

        <p
          v-if="h2hLine"
          class="text-2xs mt-2 border-t border-dashed border-zinc-800 pt-2 leading-relaxed text-zinc-400"
        >
          <span class="font-bold tracking-wide text-teal-400 uppercase">H2H</span>
          ({{ h2h.count }} jogos): {{ h2hLine }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  history: { type: Object, default: null },
  home: { type: String, required: true },
  away: { type: String, required: true },
})

const RESULT_CLASSES = {
  W: 'bg-teal-500/15 text-teal-400',
  D: 'bg-zinc-500/15 text-zinc-400',
  L: 'bg-red-500/15 text-red-400',
}

function resultClass(letter) {
  return RESULT_CLASSES[letter] ?? 'bg-zinc-500/15 text-zinc-400'
}

const formHome = computed(() => String(props.history?.home_metrics?.form5 ?? ''))
const formAway = computed(() => String(props.history?.away_metrics?.form5 ?? ''))

// Rates chegam como frações (0.4) — formatPercent espera valor em percentual.
const rows = computed(() => {
  const hm = props.history?.home_metrics ?? {}
  const am = props.history?.away_metrics ?? {}
  const out = []
  const push = (label, hv, av, fmt) => {
    if (hv == null && av == null) return
    out.push({ label, home: hv == null ? '—' : fmt(hv), away: av == null ? '—' : fmt(av) })
  }
  push('pts últ. 5', hm.points5, am.points5, (v) => formatNumber(v, 0))
  push('gols/jogo', hm.avg_total_goals, am.avg_total_goals, (v) => formatNumber(v, 1))
  push('BTTS', hm.btts_rate, am.btts_rate, (v) => formatPercent(v * 100, 0))
  push('over 2.5', hm.over25_rate, am.over25_rate, (v) => formatPercent(v * 100, 0))
  push('gol no 1ºT', hm.ht_scored_rate, am.ht_scored_rate, (v) => formatPercent(v * 100, 0))
  return out
})

const h2h = computed(() => props.history?.h2h ?? null)
const h2hLine = computed(() => {
  if (!h2h.value) return ''
  const parts = [`${props.home} ${h2h.value.home_wins} × ${h2h.value.away_wins} ${props.away}`]
  if (h2h.value.draws) parts.push(`${h2h.value.draws} empate${h2h.value.draws > 1 ? 's' : ''}`)
  if (h2h.value.avg_goals != null) parts.push(`${formatNumber(h2h.value.avg_goals, 1)} gols/jogo`)
  return parts.join(' · ')
})
</script>
