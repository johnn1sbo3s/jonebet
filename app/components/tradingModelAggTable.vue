<script setup>
import { formatUnit } from '~/utils/formatNumber'

defineProps({
  title: { type: String, required: true },
  agg: { type: Object, required: true },
})

const cellClass = (val) => (val >= 0 ? 'text-green-400' : 'text-red-400')
</script>

<template>
  <div class="card rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <h4 class="mb-3 text-sm font-semibold text-white">{{ title }}</h4>

    <table class="w-full text-xs">
      <thead>
        <tr class="border-b border-zinc-800 text-zinc-500">
          <th class="px-3 py-2 text-left">Modelo</th>

          <th class="px-3 py-2 text-center">Jogos</th>

          <th class="px-3 py-2 text-center">G</th>

          <th class="px-3 py-2 text-center">RL</th>

          <th class="px-3 py-2 text-center">R</th>

          <th class="px-3 py-2 text-right">Total</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in agg.rows" :key="row.model" class="border-b border-zinc-900">
          <td class="px-3 py-2 text-white capitalize">{{ row.model }}</td>

          <td class="px-3 py-2 text-center text-zinc-300">{{ row.games }}</td>

          <td class="px-3 py-2 text-center text-green-400">{{ row.green }}</td>

          <td class="px-3 py-2 text-center text-amber-400">{{ row.red_light }}</td>

          <td class="px-3 py-2 text-center text-red-400">{{ row.red }}</td>

          <td :class="['px-3 py-2 text-right font-semibold', cellClass(row.total)]">
            {{ formatUnit(row.total) }}
          </td>
        </tr>

        <tr data-testid="agg-total" class="bg-zinc-950 font-bold">
          <td colspan="5" class="px-3 py-2 text-white">TOTAL</td>

          <td :class="['px-3 py-2 text-right', cellClass(agg.total)]">
            {{ formatUnit(agg.total) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
