<script setup>
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT } from '~/utils/enums'
import { formatUnit, formatNumber } from '~/utils/formatNumber'

const props = defineProps({
  model: { type: Object, required: true },
})

const badgeClass = computed(() => TRADING_MODEL_BADGE[props.model.model] ?? 'bg-zinc-700 text-zinc-300')
const subtotalClass = computed(() => (props.model.subtotal >= 0 ? 'pnl-pos' : 'pnl-neg'))
const subtotalFormatted = computed(() => {
  const sign = props.model.subtotal >= 0 ? '+' : ''
  return `${sign}${formatUnit(props.model.subtotal)}`
})
</script>

<template>
  <div class="card rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <div class="mb-3 flex items-baseline justify-between">
      <span :class="['badge rounded-full px-3 py-1 text-xs font-semibold', badgeClass]">
        {{ model.model_label }}
      </span>

      <span data-testid="subtotal" :class="['text-sm font-semibold', subtotalClass]">
        {{ subtotalFormatted }}
      </span>
    </div>

    <div
      v-for="bet in model.bets"
      :key="bet.fixture_id"
      class="mt-4 border-t border-zinc-800 pt-4 first:mt-0 first:border-t-0 first:pt-0"
    >
      <div class="text-sm font-semibold text-white">{{ bet.home }} vs {{ bet.away }}</div>

      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span>{{ bet.time }}</span>

        <span class="font-semibold text-white">{{ formatNumber(bet.odd) }}</span>

        <span
          >HT {{ bet.ht_score[0] }}x{{ bet.ht_score[1] }} · 70' {{ bet.minute_70_score[0] }}x{{
            bet.minute_70_score[1]
          }}
          · FT {{ bet.ft_score[0] }}x{{ bet.ft_score[1] }}</span
        >

        <span :class="['font-bold', TRADING_MODEL_RESULT[bet.result]]">{{ bet.result }}</span>

        <span :class="['font-bold', bet.profit >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ bet.profit >= 0 ? '+' : '' }}{{ formatUnit(bet.profit) }}
        </span>
      </div>
    </div>
  </div>
</template>
