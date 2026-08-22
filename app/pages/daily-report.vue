<template>
  <div class="flex flex-col gap-5">
    <PageHeader :title="`Relatório do dia — ${reportDateLabel}`">
      <template #title>
        <div class="flex flex-wrap items-center gap-2">
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="outline" size="xs" @click="goBack">
            Voltar
          </UButton>

          <span class="text-sm text-zinc-500">·</span>

          <DatePicker v-model="selectedDate" :max-value="maxDate" />
        </div>
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
      <div class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <USkeleton class="h-9 w-full md:w-72" />

        <USkeleton class="h-9 w-full md:w-64" />

        <USkeleton class="h-9 w-full md:w-80" />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div v-for="i in 4" :key="i" class="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
          <div class="flex items-center justify-between">
            <USkeleton class="h-3 w-16" />

            <div class="flex gap-1.5">
              <USkeleton class="size-7 rounded-lg" />

              <USkeleton class="size-7 rounded-lg" />
            </div>
          </div>

          <USkeleton class="h-4 w-48" />

          <USkeleton class="h-3.5 w-full" />

          <USkeleton class="h-3.5 w-3/4" />

          <div class="flex gap-1.5">
            <USkeleton class="h-6 w-24 rounded-full" />

            <USkeleton class="h-6 w-20 rounded-full" />
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
        @click="() => loadReport()"
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
      <template v-if="favoriteGames.length">
        <section class="rounded-2xl bg-amber-400/10 p-4">
          <header class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
              <UIcon name="i-lucide-star" mode="svg" class="star-fill size-4 text-amber-400" />
              Jogos favoritos

              <span
                class="text-2xs rounded-full border border-teal-500/30 bg-zinc-950 px-2.5 py-0.5 font-semibold whitespace-nowrap text-zinc-400"
              >
                {{ favoriteGames.length }} {{ favoriteGames.length === 1 ? 'jogo' : 'jogos' }}
              </span>
            </h2>
          </header>

          <TransitionGroup tag="div" name="fav" appear class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReportGameCard v-for="j in favoriteGames" :key="j.jogo_id" :game="j" :report-date="selectedDate" />
          </TransitionGroup>
        </section>

        <USeparator />
      </template>

      <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div class="flex flex-col gap-1.5">
          <span class="text-2xs font-semibold tracking-wide text-zinc-500 uppercase">Filtros</span>

          <div class="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
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

            <SegmentedControl v-model="oddsPreset" :options="oddsPresetOptions" full-width />
          </div>
        </div>

        <div class="flex flex-col gap-1.5 md:self-start">
          <span class="text-2xs font-semibold tracking-wide text-zinc-500 uppercase">Visualização</span>

          <SegmentedControl v-model="viewMode" :options="viewOptions" full-width />
        </div>
      </div>

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
            <ReportGameCard v-for="j in group.jogos" :key="j.jogo_id" :game="j" :report-date="selectedDate" />
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
import { ODDS_PRESET_OPTIONS } from '~/utils/oddsPresets'

const { state, load } = useDailyReport()
const { favoritesOf } = useFavorites()

const route = useRoute()
const router = useRouter()

// --- Navegação de data ---
// Suporta ?date=yyyy-MM-dd na URL. Depois das 23h, se não houver ?date=,
// defaulta para amanhã (quando o scanner já gerou os dados).
function defaultDate() {
  const now = DateTime.now().setZone(SP_TZ)
  if (route.query.date) return route.query.date
  // Depois das 23h: amanhã (dados do scanner já disponíveis)
  if (now.hour >= 23) return now.plus({ days: 1 }).toFormat('yyyy-MM-dd')
  return now.toFormat('yyyy-MM-dd')
}

const selectedDate = ref(defaultDate())
const reportDateLabel = computed(() => formatDate(selectedDate.value, { style: 'long' }))

// Max date para o DatePicker: amanhã só depois das 23h (scanner já gerou os
// dados); antes disso, max = hoje (não adianta navegar para amanhã sem dados).
const maxDate = computed(() => {
  const now = DateTime.now().setZone(SP_TZ)
  const max = now.hour >= 23 ? now.plus({ days: 1 }) : now
  return max.toFormat('yyyy-MM-dd')
})

// Favoritos do dia, ordenados por horário do jogo (como os grupos de liga).
// Seção fixa no topo, independente da visualização por liga/horário.
const favoriteGames = computed(() =>
  favoritesOf(state.response?.jogos || []).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
)

const byLeague = computed(() => {
  // Jogos filtrados (busca + estratégias + odds); favoritos continuam duplicados na
  // seção de cima, de propósito (usam a lista completa, não a filtrada).
  const jogos = filteredJogos.value
  const map = new Map()
  for (const j of jogos) {
    const key = j.league || 'Outras'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(j)
  }
  // Ordena os grupos por tier (0=elite → 1=fortes → 2=resto) usando o
  // campo 'tier' que já vem injetado pelo backend em cada jogo.
  // Dentro do mesmo tier, mantém a ordem original da API.
  return [...map.entries()]
    .map(([league, items]) => ({
      key: league,
      label: league,
      tier: items[0]?.tier ?? 2,
      jogos: items.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    }))
    .sort((a, b) => a.tier - b.tier)
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

// --- Filtros client-side (busca + estratégias + odds) ---
// Estado transitório de exploração — NÃO persiste entre visitas (diferente do
// viewMode, que é preferência de visualização). Reseta naturalmente no
// re-mount da página.
const query = ref('')
const selected = ref([])
const oddsPreset = ref('todos')
const oddsPresetOptions = ODDS_PRESET_OPTIONS

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
// A limpeza das estratégias fica no X embutido do próprio select (clear).
const triggerLabel = computed(() => {
  const n = selected.value.length
  if (n === 0) return 'Estratégias'
  if (n === 1) return strategyLabel(selected.value[0])
  return `${n} estratégias`
})

// Jogos que passam busca + estratégias + preset de odds; alimenta os dois
// agrupamentos (liga/horário). Favoritos continuam na lista completa — seção
// fixa no topo.
const filteredJogos = computed(() =>
  filterReportGames(state.response?.jogos || [], {
    query: query.value,
    selected: selected.value,
    oddsPreset: oddsPreset.value,
  }),
)

// Agrupa por bloco de hora do kickoff (ex.: "14h" junta 14:00, 14:30).
// Jogo sem horário parseável cai no grupo "Outros", no final.
const byHour = computed(() => {
  // Jogos filtrados (busca + estratégias + odds); favoritos continuam duplicados na
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
      label: hour,
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

// Sincroniza a data selecionada com a URL (deep-linkável, sem recarregar).
watch(selectedDate, (v) => {
  router.replace({ query: { ...route.query, date: v } })
})

// Recarrega o relatório sempre que a data muda.
async function loadReport(date) {
  const dateIso = date || selectedDate.value
  try {
    await load(dateIso)
  } catch {
    // erro fica no estado (state.error) e a página mostra retry
  }
}

// Carrega ao montar e re-observa mudanças na data.
onMounted(() => loadReport())
watch(selectedDate, (v) => loadReport(v))
</script>
