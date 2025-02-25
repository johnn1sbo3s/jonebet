<template>
    <div class="flex flex-col">
        <div
            v-for="item in internalFixtures"
            :key="item._id"
            class="flex gap-3 sm:gap-5 justify-between bg-slate-900 items-center w-full border border-gray-700 rounded-lg py-4 px-4 sm:px-6 mb-2 cursor-pointer hover:border-teal-400"
            :class="item._id === chosen._id ? 'sm:border sm:border-teal-400 border-1' : ''"
            @click="emits('click', item)"
        >
            <div class="flex gap-7 items-center">
                <div
                    class="flex flex-col items-center"
                >
                    <div class="font-semibold text-sm sm:text-base">
                        {{ item.Time }}
                    </div>

                    <div class="text-xs sm:text-sm text-gray-500">
                        {{ formatDate(item.Date) }}
                    </div>
                </div>

                <div class="flex flex-col gap-2 text-sm sm:text-base">
                    <div>
                        {{ item.Home }} x {{ item.Away }}
                    </div>

                    <div class="flex gap-1">
                        <UBadge color="primary" variant="soft">{{ item.FT_Odds_H.toFixed(2) }}</UBadge>
                        <UBadge color="primary" variant="soft">{{ item.FT_Odds_D.toFixed(2) }}</UBadge>
                        <UBadge color="primary" variant="soft">{{ item.FT_Odds_A.toFixed(2) }}</UBadge>
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-end gap-1 min-w-16 text-end">
                <div class="text-xs text-gray-600">
                    Entrada em
                </div>

                <div
                    v-if="countModels(item) === 0"
                    class="text-gray-500 text-xs sm:text-sm font-semibold"
                >
                    Nenhum
                </div>

                <div
                    v-else
                    class="text-gray-500 text-xs sm:text-sm font-semibold"
                >
                    {{ countModels(item) }} {{ countModels(item) === 1 ? 'modelo' : 'modelos' }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

const props = defineProps({
    fixtures: {
        type: Array,
        required: true
    },
    bets: {
        type: Array,
        required: true
    },
    chosen: {
        type: Object,
        default: () => {}
    },
});

const emits = defineEmits(['click']);

const internalFixtures = ref([]);

watch(() => props.fixtures, (value) => {
    internalFixtures.value = value;
}, { immediate: true });

function countModels(fixture) {
    return props.bets.filter((bet) => bet.Date === fixture.Date && bet.Home === fixture.Home && bet.Away === fixture.Away).length;
}

</script>

<style lang="scss" scoped>

</style>
