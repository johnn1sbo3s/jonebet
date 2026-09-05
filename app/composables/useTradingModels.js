import { safeParse } from '~/utils/schemas'

const apiUrl = () => useRuntimeConfig().public.API_URL
const useCache = () => useState('trading-models-cache', () => ({}))
const CACHE_CAP = 50

function cacheGet(cache, key) {
  const v = cache.value[key]
  if (v === undefined) return undefined
  delete cache.value[key]
  cache.value[key] = v
  return v
}

function cacheSet(cache, key, value) {
  if (key in cache.value) delete cache.value[key]
  cache.value[key] = value
  const keys = Object.keys(cache.value)
  while (keys.length > CACHE_CAP) delete cache.value[keys.shift()]
}

export function useTradingModels({ date } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const cache = useCache()
  const cacheKey = computed(() => `tm-${dateRef.value ?? 'today'}`)
  const query = computed(() => (dateRef.value ? { date: dateRef.value } : {}))

  return useFetch(`${apiUrl()}/trading-models`, {
    key: 'trading-models',
    query,
    default: () => ({ date: null, daily: [], weekly: {}, monthly: {} }),
    watch: [dateRef],
    getCachedData: () => cacheGet(cache, cacheKey.value),
    onResponse({ response }) {
      if (response?.ok && response._data) {
        const parsed = safeParse('tradingModelsList', response._data)
        cacheSet(cache, cacheKey.value, parsed)
        response._data = parsed
      }
    },
  })
}
