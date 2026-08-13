import { safeParse } from '~/utils/schemas'

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
  const cacheKey = computed(() => `models-list-${playedOnRef.value ?? 'default'}`)
  const query = computed(() => (playedOnRef.value ? { playedOn: playedOnRef.value } : {}))

  return useFetch(`${apiUrl()}/models`, {
    key: 'models-list',
    query,
    default: () => ({ items: [] }),
    watch: [playedOnRef],
    getCachedData: () => cacheGet(cache, cacheKey.value),
    onResponse({ response }) {
      if (response?.ok && response._data) {
        const parsed = safeParse('modelsList', response._data)
        cacheSet(cache, cacheKey.value, parsed)
        response._data = parsed
      }
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
      if (response?.ok && response._data) {
        const parsed = safeParse('modelById', response._data)
        cacheSet(cache, key.value, parsed)
        response._data = parsed
      }
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
      if (response?.ok && response._data) {
        const parsed = safeParse('modelChart', response._data)
        cacheSet(cache, key.value, parsed)
        response._data = parsed
      }
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
      if (response?.ok && response._data) {
        const parsed = safeParse('modelTrend', response._data)
        cacheSet(cache, key.value, parsed)
        response._data = parsed
      }
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
      if (response?.ok && response._data) {
        const parsed = safeParse('modelResults', response._data)
        cacheSet(cache, key.value, parsed)
        response._data = parsed
      }
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
      if (response?.ok && response._data) {
        const parsed = safeParse('modelBets', response._data)
        cacheSet(cache, key.value, parsed)
        response._data = parsed
      }
    },
  })
}

export function useDailyBets({ date, model = null } = {}) {
  const cache = useCache()
  const modelRef = isRef(model) ? model : ref(model)
  const cacheKey = computed(() => `daily-bets-${date.value ?? 'any'}-${modelRef.value ?? 'any'}`)
  return useFetch(() => `${apiUrl()}/daily-bets`, {
    key: 'daily-bets',
    query: computed(() => {
      const q = {}
      if (date.value) q.date = date.value
      if (modelRef.value) q.model = modelRef.value
      return q
    }),
    default: () => ({ date: null, bets: [], total: 0 }),
    watch: [date, modelRef],
    getCachedData: (key, nuxtApp) => {
      const cached = cacheGet(cache, cacheKey.value)
      if (cached) return cached
      // SSR payload fallback is keyed by the static useFetch key, not by
      // the date-aware cacheKey. Use it only when its resolved date still
      // matches the current date (or `date` hasn't been set yet) — i.e.
      // the initial hydration or the immediate `dailyBetsResponse` watch
      // that mirrors the API date. Once the user navigates to a different
      // date the payload is stale and must not be returned, or the
      // refetch is skipped and the page renders the previous date's bets.
      const payloadData = nuxtApp?.payload?.data?.[key]
      if (payloadData && (date.value === null || date.value === payloadData.date)) {
        return payloadData
      }
      return undefined
    },
    onResponse({ response }) {
      if (response?.ok && response._data !== undefined) {
        const parsed = safeParse('dailyBets', response._data)
        cacheSet(cache, cacheKey.value, parsed)
        response._data = parsed
      }
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
      if (response?.ok && response._data) {
        const parsed = safeParse('dailyBetsDates', response._data)
        cacheSet(cache, key, parsed)
        response._data = parsed
      }
    },
  })
}
