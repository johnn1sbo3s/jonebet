import { safeParse } from '~/utils/schemas'

const apiUrl = () => useRuntimeConfig().public.API_URL

const defaultFetch = (url) => $fetch(url)

export function useTradingModels({ date, fetchFn = defaultFetch } = {}) {
  const dateRef = isRef(date) ? date : ref(date)
  const daily = ref({ date: null, daily: [] })
  const summary = ref({ week: null, month: null })
  const dailyPending = ref(false)
  const summaryPending = ref(false)
  const dailyError = ref(null)
  const summaryError = ref(null)
  let summaryLoaded = false

  async function loadDaily() {
    if (!dateRef.value) return
    const requestedDate = dateRef.value
    dailyPending.value = true
    try {
      const raw = await fetchFn(`${apiUrl()}/trading-models/daily?date=${encodeURIComponent(requestedDate)}`)
      if (requestedDate !== dateRef.value) return
      daily.value = safeParse('tradingDaily', raw)
    } catch (e) {
      if (requestedDate !== dateRef.value) return
      dailyError.value = e
      daily.value = { date: requestedDate, daily: [] }
    } finally {
      if (requestedDate === dateRef.value) dailyPending.value = false
    }
  }

  async function loadSummary({ force = false } = {}) {
    if (summaryLoaded && !force) return
    summaryLoaded = true
    summaryPending.value = true
    try {
      const raw = await fetchFn(`${apiUrl()}/trading-models/summary`)
      summary.value = safeParse('tradingSummary', raw)
    } catch (e) {
      summaryError.value = e
    } finally {
      summaryPending.value = false
    }
  }

  function refresh() {
    dailyError.value = null
    summaryError.value = null
    loadDaily()
    loadSummary({ force: true })
  }

  watch(dateRef, () => {
    dailyError.value = null
    loadDaily()
  })
  refresh()

  const pending = computed(() => dailyPending.value || summaryPending.value)
  return { daily, summary, dailyPending, summaryPending, pending, dailyError, summaryError, refresh }
}
