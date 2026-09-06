<script setup>
import { TRADING_MODEL_BADGE, TRADING_MODEL_RESULT, tradingModelLabel } from '~/utils/enums'
import { formatUnit, formatNumber } from '~/utils/formatNumber'

const props = defineProps({
  model: { type: Object, required: true },
})

const badgeClass = computed(() => TRADING_MODEL_BADGE[props.model.model] ?? 'bg-zinc-700 text-zinc-300')
const modelLabel = computed(() => tradingModelLabel(props.model.model, props.model.model_label))
const subtotalClass = computed(() => (props.model.subtotal >= 0 ? 'pnl-pos' : 'pnl-neg'))
const subtotalFormatted = computed(() => {
  const sign = props.model.subtotal >= 0 ? '+' : ''
  return `${sign}${formatUnit(props.model.subtotal)}`
})
const scoreText = (s) => (s ? `${s[0]}x${s[1]}` : '—')
const goalsText = (h, a) => [...(h ?? []), ...(a ?? [])].map((m) => `${m}'`).join(' ') || '—'
</script>

<template>
  <div class="card rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <div class="mb-3 flex items-baseline justify-between">
      <span :class="['badge rounded-full px-3 py-1 text-xs font-semibold', badgeClass]">
        {{ modelLabel }}
      </span>

      <span data-testid="subtotal" :class="['text-sm font-semibold', subtotalClass]">
        {{ subtotalFormatted }}
      </span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b border-zinc-800 text-left text-zinc-500">
            <th class="pr-3 pb-2 font-medium">Jogo</th>

            <th class="pr-3 pb-2 font-medium">Hora</th>

            <th class="pr-3 pb-2 text-right font-medium">Odd</th>

            <th class="pr-3 pb-2 text-center font-medium">HT</th>

            <th class="pr-3 pb-2 text-center font-medium">70'</th>

            <th class="pr-3 pb-2 text-center font-medium">FT</th>

            <th class="pr-3 pb-2 text-center font-medium">Gols</th>

            <th class="pr-3 pb-2 text-center font-medium">Resultado</th>

            <th class="pb-2 text-right font-medium">PnL</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="bet in model.bets" :key="bet.fixture_id" class="border-b border-zinc-800/50 last:border-b-0">
            <td class="py-2 pr-3 font-semibold text-white">{{ bet.home }} vs {{ bet.away }}</td>

            <td class="py-2 pr-3 text-zinc-400">{{ bet.time }}</td>

            <td class="py-2 pr-3 text-right font-semibold text-white">{{ formatNumber(bet.odd) }}</td>

            <td class="py-2 pr-3 text-center text-zinc-400">{{ scoreText(bet.ht_score) }}</td>

            <td class="py-2 pr-3 text-center text-zinc-400">
              {{ scoreText(bet.minute_70_score) }}
            </td>

            <td class="py-2 pr-3 text-center text-zinc-400">{{ scoreText(bet.ft_score) }}</td>

            <td class="py-2 pr-3 text-center text-zinc-400">{{ goalsText(bet.goals_home, bet.goals_away) }}</td>

            <td class="py-2 pr-3 text-center">
              <span :class="['font-bold', TRADING_MODEL_RESULT[bet.result] ?? 'text-zinc-400']">
                {{ bet.result }}
              </span>
            </td>

            <td class="py-2 text-right">
              <span :class="['font-bold', bet.profit >= 0 ? 'text-green-400' : 'text-red-400']">
                {{ bet.profit >= 0 ? '+' : '' }}{{ formatUnit(bet.profit) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
