<script setup>
import PunterModelsContent from '~/components/PunterModelsContent.vue'

const route = useRoute()
</script>

<template>
  <PunterModelsContent :initial-model="route.params.model" />
</template>
