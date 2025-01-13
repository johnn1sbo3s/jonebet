<template>
    <div class="flex flex-col">
        <div
            v-for="item in data"
            :key="item._id"
            class="flex gap-7 justify-between items-center w-full border border-gray-200 rounded-lg py-4 px-6 mb-2 cursor-pointer hover:outline hover:outline-teal-400 hover:outline-1"
            :class="item._id === chosen._id ? 'outline outline-teal-400 outline-1' : ''"
            @click="emits('click', item)"
        >
            <div class="flex gap-7 items-center">
                <div
                    class="flex flex-col items-center"
                >
                    <div class="font-semibold">
                        {{ item.Time }}
                    </div>

                    <div class="text-sm text-gray-700">
                        {{ formatDate(item.Date) }}
                    </div>
                </div>

                <div class="flex flex-col gap-2">
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

            <div class="flex flex-col items-end gap-1">
                <div class="text-xs text-gray-500">
                    Modelo
                </div>

                <div class="text-gray-600 text-sm font-semibold">
                    {{ modelNameToNaturalName(item.Modelo) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

const props = defineProps({
    data: {
        type: Array,
        required: true
    },

    clicky: {
        type: Boolean,
        default: false
    },

    chosen: {
        type: Object,
        default: () => {}
    }
});

const emits = defineEmits(['click']);

</script>

<style lang="scss" scoped>

</style>
