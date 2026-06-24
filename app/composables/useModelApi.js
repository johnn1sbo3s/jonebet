const apiUrl = () => useRuntimeConfig().public.API_URL

// Single shared cache for all model data, persisted across model
// switches and SPA navigations within the same Nuxt app instance.
// Cleared on hard reload.
const useCache = () => useState('model-api-cache', () => ({}))
// Bounded LRU cache. Cap at 200 entries — plenty for a single-tab session
// (the cache is in-memory and cleared on hard reload). When the cap is hit,
// the least-recently-read entry is evicted before a new one is written.
const CACHE_CAP = 200

function cacheGet(cache, key) {
  const value = cache.value[key]
  if (value === undefined) return undefined
  // Move to end (most recently used). Delete + reassign preserves LRU order.
  delete cache.value[key]
  cache.value[key] = value
  return value
}

function cacheSet(cache, key, value) {
  if (key in cache.value) delete cache.value[key]
  cache.value[key] = value
  const keys = Object.keys(cache.value)
  while (keys.length > CACHE_CAP) {
    delete cache.value[keys.shift()]
  }
}

export function useModelsList({ playedOn = null } = {}) {
  const cache = useCache()
  const playedOnRef = isRef(playedOn) ? playedOn : ref(playedOn)
  const key = computed(() => `models-list-${playedOnRef.value ?? 'default'}`)
  const query = computed(() => (playedOnRef.value ? { playedOn: playedOnRef.value } : {}))

  return useFetch(`${apiUrl()}/models`, {
    key,
    query,
    default: () => ({ items: [] }),
    watch: [playedOnRef],
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key.value, response._data)
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
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key.value, response._data)
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
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key.value, response._data)
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
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key.value, response._data)
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
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key.value, response._data)
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
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key.value, response._data)
    },
  })
}

export function useDailyBets({ date, model }) {
  const cache = useCache()
  const key = computed(() => `daily-bets-${date.value ?? 'any'}-${model.value ?? 'any'}`)
  return useFetch(() => `${apiUrl()}/daily-bets`, {
    key,
    query: computed(() => {
      const q = {}
      if (date.value) q.date = date.value
      if (model.value) q.model = model.value
      return q
    }),
    default: () => ({ date: null, bets: [], total: 0 }),
    watch: [date, model],
    getCachedData: (k) => cacheGet(cache, k),
    onResponse({ response }) {
      if (response?.ok && response._data !== undefined) cacheSet(cache, key.value, response._data)
    },
  })
}

export function useDailyBetsDates() {
  const cache = useCache()
  const key = 'daily-bets-available-dates'
  return useFetch(`${apiUrl()}/daily-bets/available-dates`, {
    key,
    default: () => [],
    getCachedData: () => cacheGet(cache, key),
    onResponse({ response }) {
      if (response?.ok && response._data) cacheSet(cache, key, response._data)
    },
  })
}
