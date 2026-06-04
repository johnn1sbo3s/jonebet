<template>
    <div>
        <NuxtLink
            :to="`/performance/${model.modelo}`"
        >
            <u-card class="hover:outline hover:outline-teal-400 hover:outline-1">
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between gap-3">
                        <div class="flex gap-2 items-center font-semibold">
                            <p class="text-ellipsis line-clamp-1">{{ modelName }}</p>
                            <p
                                v-if="model.total.qtd_jgs_atual >= 88"
                                :class="profit >= 0 ? 'text-teal-600' : 'text-red-600'"
                            >
                                {{ profit >= 0 ? '+' : '' }}{{ profit.toFixed(2).toLocaleString('pt-BR') }} u
                            </p>
                        </div>
                    </div>

                    <div class="text-sm" v-html="cardDescription" />
                </div>
            </u-card>
        </NuxtLink>
    </div>
</template>

<script setup>

// Props
const props = defineProps({
    model: {
        type: Object,
        required: true,
    }
});

//Variáveis computadas
const modelName = computed(() => props.model?.modelo ? modelNameToNaturalName(props.model.modelo) : '');
const profit = computed(() => (props.model?.total?.media_atual || 0) * 100);

const lastDay = computed(() => {
    const blocks = props.model?.total?.blocks_history || [];
    const entry = blocks?.length >= 2 ? blocks.at(-2) : blocks?.at(-1);
    if (!entry?.Ult_Dia) return '';
    return formatDate(entry.Ult_Dia);
});

const cardDescription = computed(() => {
    if (!props.model?.total || props.model.total.qtd_jgs_atual >= 88) {
        return `<b>${100 - props.model.total.qtd_jgs_atual} jogos</b> para completar um bloco de 100`;
    }

    return `Completou um bloco de 100 jogos dia <b>${lastDay.value}</b>`;
});

</script>

<style lang="css" scoped>

</style>