const runtimeConfig = useRuntimeConfig()
const apiUrl = runtimeConfig.public.API_URL

export function useModelsList({ playedOn = null } = {}) {
  const query = {}
  if (playedOn) query.playedOn = playedOn

  return useFetch(`${apiUrl}/models`, {
    key: `models-list-${playedOn ?? 'default'}`,
    query,
    default: () => ({ items: [] }),
  })
}

export function useModel(id) {
  return useFetch(`${apiUrl}/models/${id}`, {
    key: `model-${id}`,
    default: () => null,
  })
}

export function useModelChart(id, groupBy) {
  return useFetch(`${apiUrl}/models/${id}/chart`, {
    key: `model-${id}-chart-${groupBy}`,
    query: { groupBy },
    default: () => ({ labels: [], data: [], annotationIndex: 0 }),
    watch: [groupBy],
  })
}

export function useModelTrend(id, enabled) {
  return useFetch(`${apiUrl}/models/${id}/chart/trend`, {
    key: `model-${id}-trend`,
    immediate: enabled,
    default: () => ({ slope: 0, intercept: 0, line: [], distance: 0 }),
    watch: [enabled],
  })
}

export function useModelResults(id, period) {
  return useFetch(`${apiUrl}/models/${id}/results`, {
    key: `model-${id}-results-${period}`,
    query: { period },
    default: () => [],
    watch: [period],
  })
}

export function useModelBets(id, { page, size, sort, order }) {
  return useFetch(`${apiUrl}/models/${id}/bets`, {
    key: `model-${id}-bets-${page}-${size}-${sort}-${order}`,
    query: { page, size, sort, order },
    default: () => ({ items: [], total: 0, page: 1, size }),
    watch: [page, size, sort, order],
  })
}
