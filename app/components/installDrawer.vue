<template>
  <USlideover
    :open="state.open"
    side="bottom"
    :ui="{ content: 'bg-zinc-900 border-t border-zinc-800' }"
    @update:open="
      (v) => {
        if (!v) closeDrawer()
      }
    "
  >
    <template #content>
      <div class="flex flex-col gap-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-zinc-400">
            {{ state.view === 'ios' ? 'Instalar no iPhone' : 'Instale o DataPlay como app' }}
          </p>

          <UButton icon="i-lucide-x" variant="ghost" color="gray" aria-label="Fechar" size="sm" @click="closeDrawer" />
        </div>

        <template v-if="state.view === 'home'">
          <div class="flex justify-center py-2">
            <div class="relative w-24 rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-1.5">
              <div class="mb-1.5 flex justify-center gap-1">
                <span class="size-1 rounded-full bg-zinc-600" />

                <span class="h-1 w-8 rounded-full bg-zinc-700" />
              </div>

              <div class="grid grid-cols-3 gap-1">
                <div class="aspect-square rounded-md bg-zinc-800" />

                <div class="aspect-square rounded-md bg-zinc-800" />

                <div class="aspect-square overflow-hidden rounded-md bg-teal-500">
                  <img src="/pwa-icon-192.png" alt="" class="size-full object-cover" />
                </div>

                <div class="aspect-square rounded-md bg-zinc-800" />

                <div class="aspect-square rounded-md bg-zinc-800" />

                <div class="aspect-square rounded-md bg-zinc-800" />
              </div>
            </div>
          </div>

          <p class="text-center text-sm font-bold text-white">Leve o DataPlay para sua tela inicial</p>

          <p class="text-center text-xs text-zinc-400">Ícone na home, abre como app, sempre atualizado.</p>

          <UButton color="primary" size="lg" block class="mt-1" @click="onInstall"> Instalar agora </UButton>

          <button type="button" class="text-xs text-zinc-500 underline" @click="confirmDismiss">
            Não mostrar novamente
          </button>
        </template>

        <template v-else>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <span
                class="text-2xs flex size-5 items-center justify-center rounded-full border border-zinc-700 font-bold text-zinc-400"
                >1</span
              >

              <div class="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div class="h-2 flex-1 rounded bg-zinc-700" />

                <span class="flex size-5 items-center justify-center rounded bg-teal-500 text-zinc-950">
                  <UIcon name="i-lucide-share" class="size-3" />
                </span>
              </div>

              <p class="flex-1 text-xs text-zinc-300">Toque no botão Compartilhar na barra do Safari</p>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="text-2xs flex size-5 items-center justify-center rounded-full border border-zinc-700 font-bold text-zinc-400"
                >2</span
              >

              <div class="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div class="h-2 flex-1 rounded bg-zinc-700" />

                <div class="h-2 flex-1 rounded border border-teal-500 bg-teal-500/20" />

                <div class="h-2 flex-1 rounded bg-zinc-700" />
              </div>

              <p class="flex-1 text-xs text-zinc-300">Role e toque em "Adicionar à Tela de Início"</p>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="text-2xs flex size-5 items-center justify-center rounded-full border border-zinc-700 font-bold text-zinc-400"
                >3</span
              >

              <div class="flex flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                <div class="h-2 flex-1 rounded bg-zinc-700" />

                <span class="text-xs font-bold text-white">Adicionar</span>
              </div>

              <p class="flex-1 text-xs text-zinc-300">Toque em "Adicionar" no canto superior</p>
            </div>
          </div>

          <p class="text-center text-xs text-zinc-500">Pronto! O ícone aparece na tela inicial.</p>

          <button type="button" class="text-xs text-zinc-500 underline" @click="confirmDismiss">
            Não mostrar novamente
          </button>
        </template>
      </div>
    </template>
  </USlideover>
</template>

<script setup>
import { usePwaInstall } from '~/composables/usePwaInstall'
import { platform } from '~/utils/pwaInstall'

const { state, closeDrawer, promptInstall, showInstructions, confirmDismiss, maybeAutoOpen } = usePwaInstall()
const device = useDevice()

onMounted(() => {
  maybeAutoOpen()
})

function onInstall() {
  if (platform({ canPrompt: state.canPrompt, isIos: device.isIos }) === 'android') {
    promptInstall()
  } else {
    showInstructions()
  }
}
</script>
