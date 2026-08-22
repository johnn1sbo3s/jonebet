<template>
  <article class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="text-2xs font-bold text-zinc-500">{{ game.time }}</span>

        <UBadge v-if="game.league" color="neutral" variant="soft" size="sm" class="font-semibold">
          {{ game.league }}
        </UBadge>
      </div>

      <span class="flex items-center gap-1.5">
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition-colors hover:border-amber-400 hover:text-amber-400"
          :class="{ 'star-fill border-amber-400/60 bg-amber-400/10 text-amber-400': isFavorite(game.jogo_id) }"
          :title="isFavorite(game.jogo_id) ? 'Remover dos favoritos' : 'Favoritar jogo'"
          :aria-label="isFavorite(game.jogo_id) ? 'Remover dos favoritos' : 'Favoritar jogo'"
          @click="toggleFavorite(game.jogo_id, reportDate)"
        >
          <UIcon
            name="i-lucide-star"
            mode="svg"
            class="h-3.5 w-3.5"
            :class="isFavorite(game.jogo_id) ? 'text-amber-400' : ''"
          />
        </button>

        <a
          class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-teal-400 hover:text-teal-400"
          :href="flashscoreUrl(game.jogo_id)"
          target="_blank"
          rel="noopener"
          title="Abrir no Flashscore"
          @click.stop
        >
          <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
        </a>

        <UPopover v-if="preLiveBets.length > 0" :ui="{ content: 'bg-zinc-900 border-zinc-700 p-2' }">
          <button
            type="button"
            class="flex h-7 items-center gap-1 rounded-lg border border-zinc-800 px-2 text-zinc-400 transition-colors hover:border-teal-400 hover:text-teal-400"
            title="Modelos com apostas pré-live"
          >
            <UIcon name="i-lucide-target" class="h-3.5 w-3.5" />

            <span class="text-2xs font-semibold"
              >{{ preLiveBets.length }} {{ preLiveBets.length === 1 ? 'modelo' : 'modelos' }}</span
            >
          </button>

          <template #content>
            <div class="flex min-w-40 flex-col gap-1">
              <div v-for="(bet, i) in preLiveBets" :key="i" class="flex items-center justify-between gap-3 text-xs">
                <span class="font-semibold text-zinc-100">{{ modelNameToNaturalName(bet.Modelo) }}</span>

                <span class="font-semibold whitespace-nowrap text-teal-400">
                  {{ bet.Market }} · {{ formatNumber(bet.Odd, 2) }}
                </span>
              </div>
            </div>
          </template>
        </UPopover>
      </span>
    </header>

    <h3 class="text-sm font-bold text-zinc-100">
      {{ game.home }} x {{ game.away }}

      <span v-if="game.odds?.h" class="ml-2 text-xs font-semibold text-zinc-400">
        {{ game.odds.h }} / {{ game.odds.d }} / {{ game.odds.a }}
      </span>
    </h3>

    <p class="text-sm leading-snug text-zinc-200">{{ game.leitura_geral }}</p>

    <div class="flex flex-wrap gap-1.5">
      <UBadge
        v-for="e in game.estrategias"
        :key="e.estrategia"
        :color="e.recomendacao === 'entrar' ? 'primary' : 'warning'"
        variant="soft"
        size="md"
        class="gap-1.5"
      >
        {{ modelNameToNaturalName(e.estrategia) }}

        <span class="font-semibold opacity-70">· {{ e.recomendacao }} {{ e.confianca }}%</span>
      </UBadge>
    </div>

    <p
      v-for="e in game.estrategias"
      :key="e.estrategia + '-an'"
      class="border-l-2 pl-2 text-sm leading-snug text-zinc-400"
      :class="e.recomendacao === 'entrar' ? 'border-teal-400/40' : 'border-amber-400/40'"
    >
      {{ e.analise }}
    </p>
  </article>
</template>

<script setup>
import { modelNameToNaturalName } from '~/utils/resolveModelName'
import { formatNumber } from '~/utils/formatNumber'
import { useFavorites } from '~/composables/useFavorites'
import { flashscoreUrl } from '~/utils/flashscore'

defineProps({
  game: { type: Object, required: true },
  // Data do relatório (yyyy-MM-dd) — usada para gravar o favorito com a
  // data correta do jogo, não "hoje". Assim favoritos de relatórios de
  // amanhã (vistos à noite) sobrevivem à purga da meia-noite.
  reportDate: { type: String, default: '' },
  preLiveBets: { type: Array, default: () => [] },
})

const { isFavorite, toggleFavorite } = useFavorites()
</script>
