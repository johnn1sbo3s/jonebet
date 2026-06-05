<template>
    <UCard
        class="max-w-150 bg-zinc-900 border border-zinc-800 hover:cursor-pointer hover:outline hover:outline-teal-500 group"
        @click="emit('click')"
    >
        <template #header>
            <div class="flex justify-between align-baseline">
                <div class="font-semibold flex gap-5">
                    <p class="text-white">{{ metricItem.modelo }}</p>

                    <div class="flex gap-3">
                        <p :class="metricItem.profit >= 0 ? 'text-teal-500' : 'text-red-500'">{{ metricItem.profit > 0 ? '+' : '' }}{{ metricItem.profit }} u</p>

                        <UDivider orientation="vertical" class="w-min"/>

                        <p class="text-zinc-300">{{ metricItem.qtd_jgs }} jogos</p>
                    </div>
                </div>

                <i class="i-lucide-chevron-right text-2xl text-teal-500 hidden group-hover:block"/>
            </div>
        </template>

        <template #default>
            <div class="w-full flex gap-8">
                <div class="w-80">
                    <p class="font-semibold text-zinc-300">Médias</p>

<span class="text-zinc-400">({{ metricItem.qtd_blocks }} blocos)</span>

                    <div class="mt-3 flex flex-col gap-2">
                        <p class="text-zinc-300">Média Profit: {{ metricItem.media_profit }} u</p>

                        <p class="text-zinc-300">EV: {{ metricItem.ev }}</p>

                        <p class="text-zinc-300">Dias: {{ blockDays }}</p>
                    </div>
                </div>

                <UDivider orientation="vertical" class="w-min" />

                <div class="w-full">
                    <p class="font-semibold text-center text-zinc-300">Intervalo de confiança</p>

                    <div class="flex gap-3 h-[80%]">
                        <p class="text-red-500 self-center font-semibold">{{ metricItem.bottom_int_conf }}</p>

                        <UDivider label="a" />

                        <p class="text-teal-500 self-center font-semibold">{{  metricItem.top_int_conf }}</p>
                    </div>
                </div>
            </div>

            <UDivider orientation="vertical" class="w-min" />
        </template>
    </UCard>
</template>

<script setup>
import { DateTime } from 'luxon';

// Props
const props = defineProps({
    metricItem: {
        type: Object,
        required: true,
    },
});

// Emits
const emit = defineEmits(['click']);

// Variáveis computadas
const blockDays = computed(() => {
    const lastDay = DateTime.fromISO(props.metricItem.last_block_day);
    return Math.floor(DateTime.now().diff(lastDay, 'days').toObject().days);
})

</script>

<style lang="scss" scoped>

</style>
