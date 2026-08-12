<template>
  <UTooltip v-if="isMobileOrTablet && !state.standalone" text="Instalar app">
    <UButton icon="i-lucide-download" color="primary" square size="sm" aria-label="Instalar app" @click="onClick" />
  </UTooltip>
</template>

<script setup>
import { platform } from '~/utils/pwaInstall'
import { usePwaInstall } from '~/composables/usePwaInstall'
import { useDevice } from '../../node_modules/@nuxtjs/device/dist/runtime/composables/useDevice'

const { state, openDrawer, promptInstall, showInstructions } = usePwaInstall()
const device = useDevice()
const isMobileOrTablet = computed(() => device.isMobileOrTablet)

function onClick() {
  if (platform({ canPrompt: state.canPrompt, isIos: device.isIos }) === 'android') {
    promptInstall()
  } else {
    showInstructions()
    openDrawer()
  }
}
</script>
