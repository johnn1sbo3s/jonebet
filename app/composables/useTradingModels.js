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

const MOCK_DATA = {
  daily: [
    {
      model: 'lay_0x1',
      bets: 3,
      green: 2,
      red_light: 0,
      red: 1,
      pnl: 12.5,
      roi: 41.67,
    },
    {
      model: 'back_home',
      bets: 5,
      green: 3,
      red_light: 1,
      red: 1,
      pnl: 7.0,
      roi: 14.0,
    },
    {
      model: 'lay_goleada_home',
      bets: 2,
      green: 2,
      red_light: 0,
      red: 0,
      pnl: 20.0,
      roi: 100.0,
    },
    {
      model: 'ltd',
      bets: 4,
      green: 2,
      red_light: 1,
      red: 1,
      pnl: 3.0,
      roi: 7.5,
    },
    {
      model: 'lay_away',
      bets: 3,
      green: 1,
      red_light: 0,
      red: 2,
      pnl: -15.0,
      roi: -50.0,
    },
  ],
  weekly: {
    start_date: '2026-08-30',
    end_date: '2026-09-05',
    rows: [
      { model: 'lay_0x1', bets: 14, green: 9, red_light: 2, red: 3, pnl: 45.0, roi: 32.14 },
      { model: 'back_home', bets: 22, green: 13, red_light: 4, red: 5, pnl: 18.0, roi: 8.18 },
      { model: 'lay_goleada_home', bets: 10, green: 8, red_light: 1, red: 1, pnl: 65.0, roi: 65.0 },
      { model: 'ltd', bets: 18, green: 10, red_light: 3, red: 5, pnl: 5.0, roi: 2.78 },
      { model: 'lay_away', bets: 15, green: 6, red_light: 2, red: 7, pnl: -28.0, roi: -18.67 },
    ],
  },
  monthly: {
    year: 2026,
    month: 9,
    rows: [
      { model: 'lay_0x1', bets: 14, green: 9, red_light: 2, red: 3, pnl: 45.0, roi: 32.14 },
      { model: 'back_home', bets: 22, green: 13, red_light: 4, red: 5, pnl: 18.0, roi: 8.18 },
      { model: 'lay_goleada_home', bets: 10, green: 8, red_light: 1, red: 1, pnl: 65.0, roi: 65.0 },
      { model: 'ltd', bets: 18, green: 10, red_light: 3, red: 5, pnl: 5.0, roi: 2.78 },
      { model: 'lay_away', bets: 15, green: 6, red_light: 2, red: 7, pnl: -28.0, roi: -18.67 },
    ],
  },
}

export function useTradingModels({ date } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const cache = useCache()
  const cacheKey = computed(() => `tm-${dateRef.value ?? 'today'}`)
  const query = computed(() => (dateRef.value ? { date: dateRef.value } : {}))

  const result = useFetch(`${apiUrl()}/trading-models`, {
    key: 'trading-models',
    query,
    default: () => MOCK_DATA,
    watch: [dateRef],
    getCachedData: () => cacheGet(cache, cacheKey.value),
    onResponse({ response }) {
      if (response?.ok && response._data) {
        const parsed = safeParse('tradingModelsList', response._data)
        cacheSet(cache, cacheKey.value, parsed)
        response._data = parsed
      }
    },
    onResponseError() {
      // API não existe ainda (ticket 3) — retorna mock
      result.data.value = MOCK_DATA
      result.error.value = null
    },
  })

  return result
}
