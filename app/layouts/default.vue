<script setup>
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
  <UHeader>
    <template #title>
      <img src="/dataplay-icon.png" alt="DataPlay" class="h-8" >
    </template>

    <!-- Desktop: centro quando xl+, escondido menor que xl -->
    <UNavigationMenu :items="navItems" class="hidden xl:flex xl:justify-center" />

    <!-- Mobile/tablet: à direita entre lg e xl, escondido fora disso -->
    <template #right>
      <UNavigationMenu :items="navItems" class="hidden lg:flex xl:hidden" />
    </template>

    <template #body>
      <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>

  <UMain>
    <UContainer class="py-6">
      <NuxtPage />
    </UContainer>
  </UMain>
</template>
