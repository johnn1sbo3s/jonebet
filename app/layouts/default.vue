<script setup>
const navUi = {
  item: 'text-zinc-400 hover:text-white',
  active: 'text-teal-500 bg-zinc-900 rounded-lg',
}

const navItems = [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-grid',
      to: '/',
    },
    {
      label: 'Jogos do Dia',
      icon: 'i-lucide-calendar-days',
      to: '/fixtures',
    },
    {
      label: 'Apostas do Dia',
      icon: 'i-lucide-clipboard-list',
      to: '/daily-bets',
    },
    {
      label: 'Performance',
      icon: 'i-lucide-bar-chart-3',
      to: '/performance',
    },
    {
      label: 'Monitoramento',
      icon: 'i-lucide-inbox',
      to: '/batch-monitoring',
    },
  ],
]
</script>

<template>
  <UHeader class="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50" aria-label="Main navigation">
    <template #title>
      <img src="/dataplay-icon.png" alt="DataPlay" class="h-8" >
    </template>

    <UNavigationMenu
      :items="navItems"
      class="hidden xl:flex xl:justify-center"
      :ui="navUi"
    />

    <template #right>
      <UNavigationMenu
        :items="navItems"
        class="hidden lg:flex xl:hidden"
        :ui="navUi"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        class="-mx-2.5"
        :ui="navUi"
      />
    </template>
  </UHeader>

  <UMain class="bg-zinc-950">
    <UContainer class="py-8">
      <NuxtPage />
    </UContainer>
  </UMain>
</template>