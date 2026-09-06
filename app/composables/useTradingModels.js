import { safeParse } from '~/utils/schemas'

const apiUrl = () => useRuntimeConfig().public.API_URL

const defaultFetch = (url) => $fetch(url)

export function useTradingModels({ date, fetchFn = defaultFetch } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const daily = ref({ date: null, daily: [] })
  const summary = ref({ week: null, month: null })
  const dailyPending = ref(false)
  const summaryPending = ref(false)
  const error = ref(null)
  let summaryLoaded = false

  async function loadDaily() {
    if (!dateRef.value) return
    dailyPending.value = true
    try {
      const raw = await fetchFn(`${apiUrl()}/trading-models/daily?date=${dateRef.value}`)
      daily.value = safeParse('tradingDaily', raw)
    } catch (e) {
      error.value = e
      daily.value = { date: dateRef.value, daily: [] }
    } finally {
      dailyPending.value = false
    }
  }

  async function loadSummary() {
    if (summaryLoaded) return
    summaryLoaded = true
    summaryPending.value = true
    try {
      const raw = await fetchFn(`${apiUrl()}/trading-models/summary`)
      summary.value = safeParse('tradingSummary', raw)
    } catch (e) {
      error.value = e
    } finally {
      summaryPending.value = false
    }
  }

  function refresh() {
    error.value = null
    loadDaily()
    loadSummary()
  }

  watch(dateRef, loadDaily)
  refresh()

  const pending = computed(() => dailyPending.value || summaryPending.value)
  return { daily, summary, dailyPending, summaryPending, pending, error, refresh }
}
