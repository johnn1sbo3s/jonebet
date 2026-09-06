<script setup>
import PunterModelsContent from '~/components/PunterModelsContent.vue'
import TradingModelsContent from '~/components/TradingModelsContent.vue'

const route = useRoute()

const tabs = [
  { label: 'Modelos Punter', value: 'punter', slot: 'punter' },
  { label: 'Modelos Trader', value: 'trader', slot: 'trader' },
]

const activeTab = ref('punter')
</script>

<template>
  <div class="min-h-screen p-4">
    <PageHeader title="Performance" description="Acompanhe o desempenho dos modelos punter e trader" class="mb-4" />

    <UTabs :model-value="activeTab" :items="tabs" @update:model-value="activeTab = $event">
      <template #punter>
        <PunterModelsContent :initial-model="route.query.model" />
      </template>

      <template #trader>
        <TradingModelsContent :initial-date="route.query.date" />
      </template>
    </UTabs>
  </div>
</template>
