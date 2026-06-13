<template>
  <UCard class="border border-zinc-800 bg-zinc-900">
    <template #header>
      <p class="font-semibold">Jogos reais</p>
    </template>

    <div class="mb-3 flex items-end justify-between">
      <p class="text-sm">{{ betsTotal }} jogos</p>

      <div class="flex items-center gap-2">
        <UButton size="xs" variant="soft" :disabled="betsPage <= 1" @click="$emit('update:page', betsPage - 1)"
          >Anterior</UButton
        >

        <span class="text-muted text-sm">Página {{ betsPage }} de {{ betsTotalPages }}</span>

        <UButton
          size="xs"
          variant="soft"
          :disabled="betsPage >= betsTotalPages"
          @click="$emit('update:page', betsPage + 1)"
          >Próxima</UButton
        >
      </div>
    </div>

    <UTable
      class="h-96"
      :ui="{ wrapper: 'relative overflow-x-auto border border-muted rounded-lg' }"
      :data="betsItems"
      :columns="allBetsDataFilteredColumns"
    />
  </UCard>
</template>

<script setup>
defineProps({
  betsItems: { type: Array, required: true },
  betsTotal: { type: Number, required: true },
  betsPage: { type: Number, required: true },
  betsTotalPages: { type: Number, required: true },
})

defineEmits(['update:page'])

const allBetsDataFilteredColumns = [
  { id: 'Date', accessorKey: 'Date', header: 'Data' },
  { id: 'Home', accessorKey: 'Home', header: 'Casa' },
  { id: 'Away', accessorKey: 'Away', header: 'Fora' },
  { id: 'Odds', accessorKey: 'Odds', header: 'Odds' },
  { id: 'Resultado', accessorKey: 'Resultado', header: 'Resultado' },
  { id: 'Profit', accessorKey: 'Profit', header: 'Lucro' },
]
</script>
