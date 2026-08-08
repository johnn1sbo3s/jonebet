<template>
  <div v-if="showUnderage" class="flex flex-col gap-4 p-5">
    <div class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
        <UIcon name="i-lucide-shield-alert" class="h-5 w-5 text-red-500" />
      </span>

      <div class="flex flex-col gap-1">
        <p class="font-semibold text-white">Acesso restrito</p>

        <p class="text-sm leading-relaxed text-zinc-300">
          Você é muito novo para este tipo de conteúdo. Este site é destinado apenas a maiores de 18 anos.
        </p>
      </div>
    </div>

    <UButton block color="neutral" variant="outline" size="lg" @click="showUnderage = false"> Voltar </UButton>
  </div>

  <div v-else class="flex flex-col gap-4 p-5">
    <div class="flex items-start gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
        <UIcon name="i-lucide-triangle-alert" class="h-5 w-5 text-amber-400" />
      </span>

      <div class="flex flex-col gap-1">
        <p class="font-semibold text-white">Atenção</p>

        <p class="text-sm leading-relaxed text-zinc-300">
          Este site é destinado apenas a maiores de 18 anos. As apostas envolvem riscos financeiros — aposte com
          responsabilidade e nunca arrisque mais do que pode perder.
        </p>
      </div>
    </div>

    <div class="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
      <UIcon name="i-lucide-landmark" class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

      <p class="text-sm leading-relaxed text-amber-200">O Ministério da Fazenda adverte: aposta não é investimento.</p>
    </div>

    <div class="flex flex-col gap-2">
      <UButton block color="primary" size="lg" @click="$emit('acknowledge')"> Entendo e sou maior de 18 anos </UButton>

      <UButton block color="neutral" variant="outline" size="lg" @click="showUnderage = true">
        Não tenho 18 anos
      </UButton>
    </div>
  </div>
</template>

<script setup>
defineEmits(['acknowledge'])

const showUnderage = ref(false)
</script>
