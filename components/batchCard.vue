<template>
    <u-card class="max-w-[500px]">
        <template #header>
            <div class="flex justify-between align-baseline hover:text-purple-600 hover:cursor-pointer">
                <div class="flex gap-5">
                    <p class="font-semibold">LTD V1 Betfair</p>
                    <p>+14,5 u</p>
                    <p>12 jogos</p>
                </div>
                <i class="i-heroicons-chevron-right text-2xl"></i>
            </div>
        </template>

        <template #default>
            <div class="w-full flex gap-8">
                <div class="w-4/6">
                    <p class="font-semibold">Médias</p>
                    <div class="mt-3 flex flex-col gap-2">
                        <p>Média Profit: 12 u</p>
                        <p>Odd média: 4.3</p>
                        <p>EV: 12 u</p>
                    </div>
                </div>

                <u-divider orientation="vertical" class="w-min" />

                <div class="w-full">
                    <p class="font-semibold text-center">Intervalo de confiança</p>
                    <div class="flex gap-3 h-full">
                        <p class="text-red-600 self-center">-15.3</p>
                        <u-divider label="a" />
                        <p class="text-green-600 self-center">+15.3</p>
                    </div>
                </div>
            </div>
            <u-divider orientation="vertical" class="w-min" />
        </template>
    </u-card>
</template>

<script setup>

</script>

<style lang="scss" scoped>

</style>