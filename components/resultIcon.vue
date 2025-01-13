<template>
    <u-tooltip :text="result">
        <div class="flex items-center">
            <u-icon
                v-if="!lostResult"
                name="i-heroicons-check-circle"
                class="text-teal-600 w-5 h-5"
            />

            <u-icon
                v-else
                name="i-heroicons-x-circle"
                class="text-red-600 w-5 h-5"
            />
        </div>
    </u-tooltip>
</template>

<script setup>
defineProps({
    lostResult: {
        type: Boolean,
        required: true
    },
    result: {
        type: String,
        required: true
    }
});
</script>

<style lang="scss" scoped>

</style>
