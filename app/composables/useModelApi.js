export function useModelsList({ playedOn = null } = {}) {
  const apiUrl = useRuntimeConfig().public.API_URL
  const query = {}
  if (playedOn) query.playedOn = playedOn

  return useFetch(`${apiUrl}/models`, {
    key: `models-list-${playedOn ?? 'default'}`,
    query,
    default: () => ({ items: [] }),
  })
}

export function useModelById(id) {
  const apiUrl = useRuntimeConfig().public.API_URL
  return useFetch(() => `${apiUrl}/models/${id.value}`, {
    key: () => `model-${id.value}`,
    default: () => null,
    watch: [id],
  })
}

export function useModelChart(id, groupBy) {
  const apiUrl = useRuntimeConfig().public.API_URL
  return useFetch(() => `${apiUrl}/models/${id.value}/chart`, {
    key: () => `model-${id.value}-chart-${groupBy.value}`,
    query: computed(() => ({ groupBy: groupBy.value })),
    default: () => ({ labels: [], data: [], annotationIndex: 0 }),
    watch: [id, groupBy],
  })
}

export function useModelTrend(id, enabled) {
  const apiUrl = useRuntimeConfig().public.API_URL
  return useFetch(() => `${apiUrl}/models/${id.value}/chart/trend`, {
    key: () => `model-${id.value}-trend`,
    immediate: enabled,
    default: () => ({ slope: 0, intercept: 0, line: [], distance: 0 }),
    watch: [id, enabled],
  })
}

export function useModelResults(id, period) {
  const apiUrl = useRuntimeConfig().public.API_URL
  return useFetch(() => `${apiUrl}/models/${id.value}/results`, {
    key: () => `model-${id.value}-results-${period.value}`,
    query: computed(() => ({ period: period.value })),
    default: () => [],
    watch: [id, period],
  })
}

export function useModelBets(id, { page, size, sort, order }) {
  const apiUrl = useRuntimeConfig().public.API_URL
  return useFetch(() => `${apiUrl}/models/${id.value}/bets`, {
    key: () => `model-${id.value}-bets-${page.value}-${size.value}-${sort.value}-${order.value}`,
    query: computed(() => ({ page: page.value, size: page.value, sort: sort.value, order: order.value })),
    default: () => ({ items: [], total: 0, page: page.value, size: size.value }),
    watch: [id, page, size, sort, order],
  })
}
