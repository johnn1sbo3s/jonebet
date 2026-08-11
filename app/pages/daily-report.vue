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
          <div v-for="j in 2" :key="j" class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
            <div class="flex items-center gap-2">
              <USkeleton class="h-3 w-8" />

              <USkeleton class="h-3 w-32" />

              <USkeleton class="ml-auto h-3 w-14" />
            </div>

            <USkeleton class="h-3 w-full" />

            <USkeleton class="h-3 w-2/3" />

            <div class="flex gap-1.5">
              <USkeleton class="h-6 w-20 rounded-full" />

              <USkeleton class="h-6 w-24 rounded-full" />
            </div>
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
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <SegmentedControl v-model="viewMode" :options="viewOptions" full-width />

        <div class="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <UInput v-model="query" icon="i-lucide-search" placeholder="Buscar time ou liga…" class="w-full md:w-72" />

          <USelectMenu
            v-model="selected"
            :items="strategyOptions"
            multiple
            clear
            value-key="value"
            class="w-full md:w-64"
          >
            <template #default>
              <span class="truncate" :class="selected.length === 0 ? 'text-zinc-500' : ''">{{ triggerLabel }}</span>
            </template>
          </USelectMenu>

          <UButton
            v-if="hasActiveFilter"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-x"
            class="shrink-0 self-start"
            @click="clearFilters"
          >
            Limpar
          </UButton>
        </div>
      </div>

      <template v-if="favoriteGames.length">
        <section class="rounded-2xl border border-teal-500/30 bg-zinc-900 p-4">
          <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
              <UIcon name="i-lucide-star" mode="svg" class="star-fill size-4 text-amber-400" />
              Jogos favoritos
            </h2>

            <span
              class="text-2xs rounded-full border border-teal-500/30 bg-zinc-950 px-2.5 py-0.5 font-semibold whitespace-nowrap text-zinc-400"
            >
              {{ favoriteGames.length }} {{ favoriteGames.length === 1 ? 'jogo' : 'jogos' }}
            </span>
          </header>

          <TransitionGroup tag="div" name="fav" appear class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReportGameCard v-for="j in favoriteGames" :key="j.jogo_id" :game="j" />
          </TransitionGroup>
        </section>

        <USeparator />
      </template>

      <template v-if="filteredJogos.length === 0">
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900 py-14 text-center text-sm text-zinc-500">
          Nenhum jogo corresponde ao filtro.
        </div>
      </template>

      <template v-else>
        <section v-for="group in groups" :key="group.key" class="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-zinc-100">{{ group.label }}</h2>

            <span
              class="text-2xs rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-semibold whitespace-nowrap text-zinc-400"
            >
              {{ group.jogos.length }} {{ group.jogos.length === 1 ? 'jogo' : 'jogos' }}
            </span>
          </header>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReportGameCard v-for="j in group.jogos" :key="j.jogo_id" :game="j" />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { DateTime } from 'luxon'
import { useDailyReport } from '~/composables/useDailyReport'
import { useFavorites } from '~/composables/useFavorites'
import { formatDate } from '~/utils/formatDate'
import { SP_TZ } from '~/utils/timezone'
import { ANY_STRATEGY, filterReportGames } from '~/utils/filterReportGames'
import { modelNameToNaturalName } from '~/utils/resolveModelName'

const { state, load } = useDailyReport()
const { favoritesOf } = useFavorites()

// Favoritos do dia, ordenados por horário do jogo (como os grupos de liga).
// Seção fixa no topo, independente da visualização por liga/horário.
const favoriteGames = computed(() =>
  favoritesOf(state.response?.jogos || []).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
)

// Data de hoje em America/Sao_Paulo (o relatório de hoje foi gerado ontem à
// noite pelo pipeline). NUNCA usar new Date().toISOString() aqui: é UTC e
// entre 21h-23h59 BRT o relatório pedido seria o de amanhã, ainda inexistente.
const todayIso = DateTime.now().setZone(SP_TZ).toFormat('yyyy-MM-dd')

const reportDateLabel = computed(() => formatDate(state.response?.date || todayIso, { style: 'long' }))

const byLeague = computed(() => {
  // Jogos filtrados (busca + estratégias); favoritos continuam duplicados na
  // seção de cima, de propósito (usam a lista completa, não a filtrada).
  const jogos = filteredJogos.value
  const map = new Map()
  for (const j of jogos) {
    const key = j.league || 'Outras'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  // Ordem dos grupos = ordem de chegada da API: o backend já ordena por tier
  // (T1 primeiro) e liga — reordenar alfabeticamente aqui quebraria isso.
  return [...map.entries()].map(([league, items]) => ({
    key: league,
    label: league,
    jogos: items.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
  }))
})

// View mode escolhido pelo usuário: 'by_league' | 'by_hour'. Persistido em
// localStorage; guarda de import.meta.client porque o setup roda em SSR.
const viewMode = ref('by_league')

if (import.meta.client) {
  viewMode.value = localStorage.getItem('dailyReport.viewMode') || 'by_league'
}

watch(viewMode, (v) => {
  if (import.meta.client) localStorage.setItem('dailyReport.viewMode', v)
})

const viewOptions = [
  { value: 'by_league', label: 'Por liga' },
  { value: 'by_hour', label: 'Por horário' },
]

// --- Filtros client-side (busca + estratégias) ---
// Estado transitório de exploração — NÃO persiste entre visitas (diferente do
// viewMode, que é preferência de visualização). Reseta naturalmente no
// re-mount da página.
const query = ref('')
const selected = ref([])

// Opções do multiselect: "Com recomendação" + as estratégias distintas do
// relatório do dia, em ordem alfabética do nome natural (nunca lista fixa).
const strategyOptions = computed(() => {
  const keys = [
    ...new Set((state.response?.jogos || []).flatMap((j) => (j.estrategias || []).map((e) => e.estrategia))),
  ]
  const rest = keys
    .map((key) => ({ value: key, label: modelNameToNaturalName(key) }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ value: ANY_STRATEGY, label: 'Com recomendação' }, ...rest]
})

const strategyLabel = (value) => (value === ANY_STRATEGY ? 'Com recomendação' : modelNameToNaturalName(value))

// Gatilho compacto do multiselect: evita o label padrão do USelectMenu
// (labels unidos por vírgula), que transborda no mobile com 3+ selecionadas.
const triggerLabel = computed(() => {
  const n = selected.value.length
  if (n === 0) return 'Estratégias'
  if (n === 1) return strategyLabel(selected.value[0])
  return `${n} estratégias`
})

const hasActiveFilter = computed(() => query.value.trim() !== '' || selected.value.length > 0)

function clearFilters() {
  query.value = ''
  selected.value = []
}

// Jogos que passam busca + estratégias; alimenta os dois agrupamentos
// (liga/horário). Favoritos continuam na lista completa — seção fixa no topo.
const filteredJogos = computed(() =>
  filterReportGames(state.response?.jogos || [], { query: query.value, selected: selected.value }),
)

// Agrupa por bloco de hora do kickoff (ex.: "14h" junta 14:00, 14:30).
// Jogo sem horário parseável cai no grupo "Outros", no final.
const byHour = computed(() => {
  // Jogos filtrados (busca + estratégias); favoritos continuam duplicados na
  // seção de cima, de propósito (usam a lista completa, não a filtrada).
  const jogos = filteredJogos.value
  const map = new Map()
  for (const j of jogos) {
    const match = /^(\d{1,2}):/.exec(j.time || '')
    const key = match ? `${match[1]}h` : 'Outros'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  return [...map.entries()]
    .map(([hour, items]) => ({
      key: hour,
      label: hour === 'Outros' ? 'Outros' : `${hour}h`,
      jogos: items.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    }))
    .sort((a, b) => {
      if (a.key === 'Outros') return 1
      if (b.key === 'Outros') return -1
      return a.key.localeCompare(b.key)
    })
})

const groups = computed(() => (viewMode.value === 'by_hour' ? byHour.value : byLeague.value))

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
