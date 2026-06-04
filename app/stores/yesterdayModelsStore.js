export const useYesterdayModelsStore = defineStore('yesterdayModels', () => {
    const yesterdayModels = ref({});

    const getYesterdayModels = computed(() => yesterdayModels.value);

    function setYesterdayModels(data) {
        yesterdayModels.value = data;
    }

    return { getYesterdayModels, setYesterdayModels };
});