<template>
    <u-card class="max-w-[520px] hover:cursor-pointer hover:outline hover:outline-violet-400 hover:outline-1 group">
        <template #header>
            <div class="flex justify-between align-baseline">
                <div class="flex gap-5 group-hover:text-violet-700">
                    <p class="font-semibold">LTD V1 Betfair</p>
                    <div class="flex gap-3">
                        <p>+14,5 u</p>
                        <u-divider orientation="vertical" class="w-min"/>
                        <p>12 jogos</p>
                    </div>
                </div>
                <i class="i-heroicons-chevron-right text-2xl group-hover:text-violet-700"></i>
            </div>
        </template>

        <template #default>
            <div class="w-full flex gap-8">
                <div class="w-64">
                    <span class="font-semibold">Médias</span> (3 blocos)
                    <div class="mt-3 flex flex-col gap-2">
                        <p>Média Profit: 12 u</p>
                        <p>Odd média: 4.3</p>
                        <p>EV: 12 u</p>
                    </div>
                </div>

                <u-divider orientation="vertical" class="w-min" />

                <div class="w-full">
                    <p class="font-semibold text-center">Intervalo de confiança</p>
                    <div class="flex gap-3 h-[80%]">
                        <p class="text-red-600 self-center font-semibold">-15.3</p>
                        <u-divider label="a" />
                        <p class="text-green-600 self-center font-semibold">+15.3</p>
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