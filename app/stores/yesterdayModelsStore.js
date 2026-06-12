// Used by /pages/index.vue to track which models played on a given date
// (powers the "Top 3 modelos" widget on the dashboard). Replaced on
// /performance/... by the new /models?playedOn=... endpoint — no overlap.
export const useYesterdayModelsStore = defineStore('yesterdayModels', () => {
  const yesterdayModels = ref({})

  const getYesterdayModels = computed(() => yesterdayModels.value)

  function setYesterdayModels(data) {
    yesterdayModels.value = data
  }

  return { getYesterdayModels, setYesterdayModels }
})
