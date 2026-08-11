<template>
  <article class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
    <header class="flex flex-wrap items-center gap-2">
      <span class="text-2xs font-bold text-zinc-500">{{ game.time }}</span>

      <h3 class="text-sm font-bold text-zinc-100">{{ game.home }} x {{ game.away }}</h3>

      <span class="ml-auto flex items-center gap-1.5">
        <span v-if="game.odds?.h" class="text-2xs whitespace-nowrap text-zinc-500">
          {{ game.odds.h }} / {{ game.odds.d }} / {{ game.odds.a }}
        </span>

        <button
          type="button"
          class="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
          :class="
            isFavorite(game.jogo_id)
              ? 'star-fill text-amber-400 hover:text-amber-300'
              : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
          "
          :title="isFavorite(game.jogo_id) ? 'Remover dos favoritos' : 'Favoritar jogo'"
          :aria-label="isFavorite(game.jogo_id) ? 'Remover dos favoritos' : 'Favoritar jogo'"
          @click="toggleFavorite(game.jogo_id)"
        >
          <UIcon name="i-lucide-star" mode="svg" class="size-4" />
        </button>
      </span>
    </header>

    <p class="text-xs leading-relaxed text-zinc-300">{{ game.leitura_geral }}</p>

    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="e in game.estrategias"
        :key="e.estrategia"
        class="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-zinc-100"
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="e.recomendacao === 'entrar' ? 'bg-teal-400' : 'bg-amber-400'"
        ></span>

        {{ modelNameToNaturalName(e.estrategia) }}

        <span class="font-semibold text-zinc-400">· {{ e.recomendacao }} {{ e.confianca }}%</span>
      </span>
    </div>

    <p
      v-for="e in game.estrategias"
      :key="e.estrategia + '-an'"
      class="border-l-2 border-zinc-700 pl-2 text-xs leading-relaxed text-zinc-400"
    >
      {{ e.analise }}
    </p>
  </article>
</template>

<script setup>
import { modelNameToNaturalName } from '~/utils/resolveModelName'
import { useFavorites } from '~/composables/useFavorites'

defineProps({
  game: { type: Object, required: true },
})

const { isFavorite, toggleFavorite } = useFavorites()
</script>
