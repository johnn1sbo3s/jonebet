<template>
    <u-card
        class="max-w-[600px] hover:cursor-pointer hover:outline hover:outline-violet-400 hover:outline-1 group"
        @click="emit('click')"
    >
        <template #header>
            <div class="flex justify-between align-baseline">
                <div class="font-semibold flex gap-5">
                    <p>{{ metricItem.modelo }}</p>
                    <div class="flex gap-3">
                        <p :class="metricItem.profit > 0 ? 'text-green-600' : 'text-red-600'">{{ metricItem.profit > 0 ? '+' : '' }}{{ metricItem.profit }} u</p>
                        <u-divider orientation="vertical" class="w-min"/>
                        <p>{{ metricItem.qtd_jgs }} jogos</p>
                    </div>
                </div>
                <i class="i-heroicons-chevron-right text-2xl text-violet-500 hidden group-hover:block"></i>
            </div>
        </template>

        <template #default>
            <div class="w-full flex gap-8">
                <div class="w-80">
                    <span class="font-semibold">Médias</span> ({{ metricItem.qtd_blocks }} blocos)
                    <div class="mt-3 flex flex-col gap-2">
                        <p>Média Profit: {{ metricItem.media_profit }} u</p>
                        <p>EV: {{ metricItem.ev }}</p>
                        <p>Dias: {{ blockDays }}</p>
                    </div>
                </div>

                <u-divider orientation="vertical" class="w-min" />

                <div class="w-full">
                    <p class="font-semibold text-center">Intervalo de confiança</p>
                    <div class="flex gap-3 h-[80%]">
                        <p class="text-red-600 self-center font-semibold">{{ metricItem.bottom_int_conf }}</p>
                        <u-divider label="a" />
                        <p class="text-green-600 self-center font-semibold">{{  metricItem.top_int_conf }}</p>
                    </div>
                </div>
            </div>
            <u-divider orientation="vertical" class="w-min" />
        </template>
    </u-card>
</template>

<script setup>
import { DateTime } from 'luxon';

// Props
const props = defineProps({
    metricItem: {
        type: Object,
        required: true,
        default: () => {}
    },
});

// Emits
const emit = defineEmits(['click']);

// Variáveis computadas
const blockDays = computed(() => {
    let lastDay = DateTime.fromISO(props.metricItem.last_block_day);
    return Math.floor(DateTime.now().diff(lastDay, 'days').toObject().days);
})

</script>

<style lang="scss" scoped>

</style>