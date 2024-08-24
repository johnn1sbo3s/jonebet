<template>
    <div class="flex flex-col gap-4">
        <page-header title="Acompanhamento em lotes" />

        <div class="p-0.5 max-h-[850px] overflow-auto flex flex-col gap-4">
            <batch-card
                v-for="item in sortedSanitizedData"
                :key="item.id"
                :metric-item="item"
            />
        </div>
    </div>
</template>

<script setup>
const runtimeConfig = useRuntimeConfig();
const apiUrl = runtimeConfig.public.API_URL;

const { data } = await useFetch(`${apiUrl}/model-performance`);

const sortedSanitizedData = computed(() => {
    let sorted = _orderBy(data.value, ['total.qtd_jgs_atual'], ['desc']);

    return sorted.map((item) => ({
        _id: item._id,
        modelo: item.modelo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        profit: (item.total.media_atual * 100).toFixed(2).toLocaleString('pt-BR'),
        ev: item.total.ev.toFixed(2).toLocaleString('pt-BR'),
        media_profit: (item.total.media * 100).toFixed(2).toLocaleString('pt-BR'),
        qtd_jgs: item.total.qtd_jgs_atual,
        last_block_day: item.total.blocks_history?.at(-2)?.Ult_Dia,
        bottom_int_conf: (item.total.intervalo_confianca[0] * 100).toFixed(2).toLocaleString('pt-BR'),
        top_int_conf: (item.total.intervalo_confianca[1] * 100).toFixed(2).toLocaleString('pt-BR'),
        qtd_blocks: item.total.blocks_history?.length - 1,
    }));
});

console.log(sortedSanitizedData.value);


</script>

<style lang="scss" scoped>

</style>