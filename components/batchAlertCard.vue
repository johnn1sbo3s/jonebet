<template>
    <div>
        <u-card>
            <div class="flex flex-col gap-3">
                <div class="flex justify-between gap-2">
                    <div class="flex gap-2 items-center font-semibold">
                        <p class="text-ellipsis line-clamp-1">{{ modelName }}</p>
                        <p
                            v-if="model.total.qtd_jgs_atual >= 88"
                            :class="profit >= 0 ? 'text-violet-600' : 'text-red-600'"
                        >
                            {{ profit >= 0 ? '+' : '' }}{{ profit.toFixed(2).toLocaleString('pt-BR') }} u
                        </p>
                    </div>

                    <NuxtLink :to="`/performance/${model.modelo}`">
                        <u-button size="2xs" variant="soft" color="blue">Performance</u-button>
                    </NuxtLink>
                </div>

                <div class="text-sm" v-html="cardDescription" />
            </div>
        </u-card>
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
const modelName = computed(() => modelNameToNaturalName(props.model.modelo));
const profit = computed(() => (props.model.total.media_atual * 100));

const lastDay = computed(() => {
    let lastDay = props.model.total.blocks_history.at(-2).Ult_Dia;
    return formatDate(lastDay);
});

const cardDescription = computed(() => {
    if (props.model.total.qtd_jgs_atual >= 88) {
        return `O modelo está a <b>${100 - props.model.total.qtd_jgs_atual} jogos</b> de completar 100 jogos.`;
    }

    return `O modelo completou 100 jogos dia <b>${lastDay.value}</b>.`;
});

</script>

<style lang="css" scoped>

</style>