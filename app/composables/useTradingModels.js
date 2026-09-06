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
      model_label: '0x1',
      subtotal: 10.0,
      bets: [
        {
          fixture_id: 9001,
          home: 'Flamengo',
          away: 'Palmeiras',
          time: '20:00',
          odd: 3.4,
          ht_score: [0, 0],
          minute_70_score: [0, 1],
          ft_score: [1, 1],
          result: 'GREEN',
          profit: 10.0,
        },
      ],
    },
    {
      model: 'back_home',
      model_label: 'Casa',
      subtotal: 10.0,
      bets: [
        {
          fixture_id: 9002,
          home: 'São Paulo',
          away: 'Corinthians',
          time: '18:30',
          odd: 2.1,
          ht_score: [1, 0],
          minute_70_score: [1, 0],
          ft_score: [2, 0],
          result: 'GREEN',
          profit: 10.0,
        },
      ],
    },
    {
      model: 'ltd',
      model_label: 'Empate',
      subtotal: -3.0,
      bets: [
        {
          fixture_id: 9003,
          home: 'Grêmio',
          away: 'Internacional',
          time: '21:30',
          odd: 3.2,
          ht_score: [1, 1],
          minute_70_score: [1, 1],
          ft_score: [1, 1],
          result: 'RED',
          profit: -3.0,
        },
      ],
    },
  ],
  weekly: {
    start_date: '2026-08-30',
    end_date: '2026-09-05',
    rows: [
      { model: 'lay_0x1', model_label: '0x1', bets_count: 14, green: 9, red_light: 2, red: 3, pnl: 45.0, roi: 32.14 },
      {
        model: 'back_home',
        model_label: 'Casa',
        bets_count: 22,
        green: 13,
        red_light: 4,
        red: 5,
        pnl: 18.0,
        roi: 8.18,
      },
      {
        model: 'lay_goleada_home',
        model_label: 'AOHW',
        bets_count: 10,
        green: 8,
        red_light: 1,
        red: 1,
        pnl: 65.0,
        roi: 65.0,
      },
      { model: 'ltd', model_label: 'Empate', bets_count: 18, green: 10, red_light: 3, red: 5, pnl: 5.0, roi: 2.78 },
      {
        model: 'lay_away',
        model_label: 'Fora',
        bets_count: 15,
        green: 6,
        red_light: 2,
        red: 7,
        pnl: -28.0,
        roi: -18.67,
      },
    ],
  },
  monthly: {
    year: 2026,
    month: 9,
    rows: [
      { model: 'lay_0x1', model_label: '0x1', bets_count: 14, green: 9, red_light: 2, red: 3, pnl: 45.0, roi: 32.14 },
      {
        model: 'back_home',
        model_label: 'Casa',
        bets_count: 22,
        green: 13,
        red_light: 4,
        red: 5,
        pnl: 18.0,
        roi: 8.18,
      },
      {
        model: 'lay_goleada_home',
        model_label: 'AOHW',
        bets_count: 10,
        green: 8,
        red_light: 1,
        red: 1,
        pnl: 65.0,
        roi: 65.0,
      },
      { model: 'ltd', model_label: 'Empate', bets_count: 18, green: 10, red_light: 3, red: 5, pnl: 5.0, roi: 2.78 },
      {
        model: 'lay_away',
        model_label: 'Fora',
        bets_count: 15,
        green: 6,
        red_light: 2,
        red: 7,
        pnl: -28.0,
        roi: -18.67,
      },
    ],
  },
}

export function useTradingModels({ date } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const cache = useCache()
  const cacheKey = computed(() => `tm-${dateRef.value ?? 'today'}`)
  const query = computed(() => (dateRef.value ? { date: dateRef.value } : {}))

  const { data, pending, error, refresh } = useFetch(`${apiUrl()}/trading-models`, {
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
  })

  // API não existe ainda (ticket 3) — retorna mock quando fetch falha
  return {
    data: computed(() => (error.value ? MOCK_DATA : data.value)),
    pending,
    error: computed(() => null),
    refresh,
  }
}
