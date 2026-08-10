<template>
  <div class="flex flex-col gap-5">
    <PageHeader :title="`Relatório do dia — ${reportDateLabel}`">
      <template #title>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="outline" size="xs" class="mr-3" @click="goBack">
          Voltar
        </UButton>
        Relatório do dia — {{ reportDateLabel }}
      </template>

      <template #right>
        <span
          v-if="state.response?.jogos.length > 0"
          class="w-full text-xs whitespace-nowrap text-zinc-400 sm:ml-auto sm:w-auto"
        >
          {{ state.response.jogos.length }}
          {{ state.response.jogos.length === 1 ? 'jogo analisado' : 'jogos analisados' }}
        </span>
      </template>
    </PageHeader>

    <div v-if="state.status === 'loading'" class="flex flex-col gap-4">
      <div v-for="i in 2" :key="i" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <USkeleton class="h-4 w-40" />

          <USkeleton class="h-4 w-16 rounded-full" />
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div v-for="j in 4" :key="j" class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
            <div class="flex items-center gap-2">
              <USkeleton class="h-3 w-8" />

              <USkeleton class="h-3 w-32" />

              <USkeleton class="ml-auto h-3 w-16" />
            </div>

            <USkeleton class="h-3 w-full" />

            <USkeleton class="h-3 w-2/3" />

            <div class="flex flex-wrap gap-1.5">
              <USkeleton class="h-6 w-20 rounded-full" />

              <USkeleton class="h-6 w-24 rounded-full" />
            </div>

            <USkeleton class="h-3 w-5/6" />

            <USkeleton class="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="state.status === 'error'"
      class="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 py-14 text-center"
    >
      <p class="text-sm text-zinc-400">Não foi possível carregar o relatório do dia.</p>

      <button
        class="rounded-lg border border-teal-500/30 px-4 py-1.5 text-xs font-semibold text-teal-400"
        @click="loadReport"
      >
        Tentar de novo
      </button>
    </div>

    <div
      v-else-if="state.response?.jogos.length === 0"
      class="rounded-2xl border border-zinc-800 bg-zinc-900 py-14 text-center text-sm text-zinc-500"
    >
      Relatório ainda não disponível para a data.
    </div>

    <div v-else-if="state.response" class="flex flex-col gap-4">
      <section v-for="group in byLeague" :key="group.league" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-bold text-zinc-100">{{ group.league }}</h2>

          <span
            class="text-2xs rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-semibold whitespace-nowrap text-zinc-400"
          >
            {{ group.jogos.length }} {{ group.jogos.length === 1 ? 'jogo' : 'jogos' }}
          </span>
        </header>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <article
            v-for="j in group.jogos"
            :key="j.jogo_id"
            class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3"
          >
            <header class="flex flex-wrap items-center gap-2">
              <span class="text-2xs font-bold text-zinc-500">{{ j.time }}</span>

              <h3 class="text-sm font-bold text-zinc-100">{{ j.home }} x {{ j.away }}</h3>

              <span v-if="j.odds?.h" class="text-2xs ml-auto whitespace-nowrap text-zinc-500">
                {{ j.odds.h }} / {{ j.odds.d }} / {{ j.odds.a }}
              </span>
            </header>

            <p class="text-xs leading-relaxed text-zinc-300">{{ j.leitura_geral }}</p>

            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="e in j.estrategias"
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
              v-for="e in j.estrategias"
              :key="e.estrategia + '-an'"
              class="border-l-2 border-zinc-700 pl-2 text-xs leading-relaxed text-zinc-400"
            >
              {{ e.analise }}
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { useDailyReport } from '~/composables/useDailyReport'
import { formatDate } from '~/utils/formatDate'
import { modelNameToNaturalName } from '~/utils/resolveModelName'
import { SP_TZ } from '~/utils/timezone'

const { state, load } = useDailyReport()

// Data de hoje em America/Sao_Paulo (o relatório de hoje foi gerado ontem à
// noite pelo pipeline). NUNCA usar new Date().toISOString() aqui: é UTC e
// entre 21h-23h59 BRT o relatório pedido seria o de amanhã, ainda inexistente.
const todayIso = DateTime.now().setZone(SP_TZ).toFormat('yyyy-MM-dd')

const reportDateLabel = computed(() => formatDate(state.response?.date || todayIso, { style: 'long' }))

const byLeague = computed(() => {
  const jogos = state.response?.jogos || []
  const map = new Map()
  for (const j of jogos) {
    const key = j.league || 'Outras'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  return [...map.entries()]
    .map(([league, items]) => ({
      league,
      jogos: items.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    }))
    .sort((a, b) => a.league.localeCompare(b.league))
})

function goBack() {
  // Abriu em nova aba — sem histórico de origem; navegação determinística.
  navigateTo('/scanner')
}

async function loadReport() {
  try {
    await load(todayIso)
  } catch {
    // erro fica no estado (state.error) e a página mostra retry
  }
}

onMounted(loadReport)
</script>
