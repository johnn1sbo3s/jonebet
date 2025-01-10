<template>
    <div class="flex flex-col gap-3 w-full">
        <div class="text-gray-500 flex justify-center">
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
                Home: {{ fixture.FT_Odds_H.toFixed(2) }}
            </UBadge>

            <UBadge
                color="primary"
                variant="soft"
                size="md"
            >
                Draw: {{ fixture.FT_Odds_D.toFixed(2) }}
            </UBadge>

            <UBadge
                color="primary"
                variant="soft"
                size="md"
            >
                Away: {{ fixture.FT_Odds_A.toFixed(2) }}
            </UBadge>
        </div>

        <div class="flex justify-between gap-3 items-center mt-3 mb-2 text-lg font-semibold text-center">
            <div class="flex flex-col items-center gap-2 w-1/2">
                <div>
                    Over 2.5
                </div>

                <div class="flex gap-2 items-center">
                    <UBadge
                        color="primary"
                        variant="soft"
                        size="md"
                        class="w-fit"
                    >
                        Over: {{ fixture.Odds_O25.toFixed(2) }}
                    </UBadge>

                    <UBadge
                        color="primary"
                        variant="soft"
                        size="md"
                        class="w-fit"
                    >
                        Under: {{ fixture.Odds_U25.toFixed(2) }}
                    </UBadge>
                </div>
            </div>

            <div class="flex flex-col items-center gap-2 w-1/2">
                <div>
                    BTTS
                </div>

                <div class="flex gap-2 items-center">
                    <UBadge
                        color="primary"
                        variant="soft"
                        size="md"
                        class="w-fit"
                    >
                        Sim: {{ fixture.BTTS_Yes.toFixed(2) }}
                    </UBadge>

                    <UBadge
                        color="primary"
                        variant="soft"
                        size="md"
                        class="w-fit"
                    >
                        Não: {{ fixture.BTTS_No.toFixed(2) }}
                    </UBadge>
                </div>
            </div>
        </div>

        <div class="mt-6 w-full">
            <div class="flex flex-col gap-2 text-sm mb-3">
                {{ fixtureAllowedModels.length > 0 ? 'Modelos com entrada para este jogo: ' : 'Nenhum modelo com entrada para este jogo.' }}
            </div>

            <div
                v-for="model in fixtureAllowedModels"
                :key="model"
                class="mb-1"
            >
                • {{ model }}
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
