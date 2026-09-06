<script setup>
import TradingModelsContent from '~/components/TradingModelsContent.vue'
</script>

<template>
  <div class="min-h-screen p-4">
    <UBreadcrumb :links="[{ label: 'Performance', to: '/performance' }, { label: 'Trading Models' }]" class="mb-4" />

    <TradingModelsContent />
  </div>
</template>
