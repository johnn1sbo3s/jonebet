const apiUrl = () => useRuntimeConfig().public.API_URL

// Single shared cache for all model data, persisted across model
// switches and SPA navigations within the same Nuxt app instance.
// Cleared on hard reload.
const useCache = () => useState('model-api-cache', () => ({}))

export function useModelsList({ playedOn = null } = {}) {
  const cache = useCache()
  const key = `models-list-${playedOn ?? 'default'}`
  const query = {}
  if (playedOn) query.playedOn = playedOn

  return useFetch(`${apiUrl()}/models`, {
    key,
    query,
    default: () => ({ items: [] }),
    getCachedData: (k) => cache.value[k],
    onResponse({ response }) {
      if (response?.ok && response._data) cache.value[key] = response._data
    },
  })
}

export function useModelById(id) {
  const cache = useCache()
  const key = computed(() => `model-${id.value}`)
  return useFetch(() => `${apiUrl()}/models/${id.value}`, {
    key,
    default: () => null,
    watch: [id],
    getCachedData: (k) => cache.value[k],
    onResponse({ response }) {
      if (response?.ok && response._data) cache.value[key.value] = response._data
    },
  })
}

export function useModelChart(id, groupBy) {
  const cache = useCache()
  const key = computed(() => `model-chart-${id.value}-${groupBy.value}`)
  return useFetch(() => `${apiUrl()}/models/${id.value}/chart`, {
    key,
    query: computed(() => ({ groupBy: groupBy.value })),
    default: () => ({ labels: [], data: [], annotationIndex: 0 }),
    watch: [id, groupBy],
    getCachedData: (k) => cache.value[k],
    onResponse({ response }) {
      if (response?.ok && response._data) cache.value[key.value] = response._data
    },
  })
}

export function useModelTrend(id, enabled) {
  const cache = useCache()
  const key = computed(() => `model-trend-${id.value}`)
  return useFetch(() => `${apiUrl()}/models/${id.value}/chart/trend`, {
    key,
    default: () => ({ slope: 0, intercept: 0, line: [], distance: 0 }),
    watch: [id, enabled],
    getCachedData: (k) => cache.value[k],
    onResponse({ response }) {
      if (response?.ok && response._data) cache.value[key.value] = response._data
    },
  })
}

export function useModelResults(id, period) {
  const cache = useCache()
  const key = computed(() => `model-results-${id.value}-${period.value}`)
  return useFetch(() => `${apiUrl()}/models/${id.value}/results`, {
    key,
    query: computed(() => ({ period: period.value })),
    default: () => [],
    watch: [id, period],
    getCachedData: (k) => cache.value[k],
    onResponse({ response }) {
      if (response?.ok && response._data) cache.value[key.value] = response._data
    },
  })
}

export function useModelBets(id, { page, size, sort, order }) {
  const cache = useCache()
  const key = computed(() => `model-bets-${id.value}-${page.value}-${size.value}-${sort.value}-${order.value}`)
  return useFetch(() => `${apiUrl()}/models/${id.value}/bets`, {
    key,
    query: computed(() => ({ page: page.value, size: size.value, sort: sort.value, order: order.value })),
    default: () => ({ items: [], total: 0, page: page.value, size: size.value }),
    watch: [id, page, size, sort, order],
    getCachedData: (k) => cache.value[k],
    onResponse({ response }) {
      if (response?.ok && response._data) cache.value[key.value] = response._data
    },
  })
}
