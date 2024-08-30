export const usePerformanceStore = defineStore('performance', () => {
    const performanceData = ref({});
    const betsData = ref({});

    const getPerformanceData = computed(() => performanceData.value);
    const getBetsData = computed(() => betsData.value);

    function setPerformanceData(data) {
        performanceData.value = data;
    }

    function setBetsData(data) {
        betsData.value = data;
    }

    return { getPerformanceData, getBetsData, setPerformanceData, setBetsData };
});