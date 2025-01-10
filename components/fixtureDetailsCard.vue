<template>
    <div class="flex flex-col gap-3 w-full">
        <div class="text-gray-600 flex justify-center">
            {{ formatDate(fixture.Date) }} - {{ fixture.Time }}
        </div>

        <div class="font-semibold text-2xl flex justify-center">
            {{ fixture.Home }} x {{ fixture.Away }}
        </div>

        <div class="flex gap-1 justify-center">
            <UBadge
                color="primary"
                variant="soft"
                size="md"
            >
                {{ fixture.FT_Odds_H.toFixed(2) }}
            </UBadge>

            <UBadge
                color="primary"
                variant="soft"
                size="md"
            >
                {{ fixture.FT_Odds_D.toFixed(2) }}
            </UBadge>

            <UBadge
                color="primary"
                variant="soft"
                size="md"
            >
                {{ fixture.FT_Odds_A.toFixed(2) }}
            </UBadge>
        </div>

        <div class="mt-6 w-full">
            <div class="flex flex-col gap-2 text-sm mb-3">
                Modelos que deram entrada para este jogo:
            </div>

            <div
                v-for="model in fixtureAllowedModels"
                :key="model"
                class="mb-1"
            >
                - {{ model }}
            </div>
        </div>
    </div>
</template>

<script setup>

const props = defineProps({
    fixture: {
        type: Object,
        required: true
    },
    bets: {
        type: Array,
        required: true
    }
})

const fixtureAllowedModels = computed(() => {
    return props.bets.map((item) => modelNameToNaturalName(item.Modelo));
})

</script>

<style lang="scss" scoped>

</style>
