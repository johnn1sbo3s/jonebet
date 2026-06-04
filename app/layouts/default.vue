<script setup>
const navItems = [
  [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-squares-2x2',
      to: '/',
    },
    {
      label: 'Jogos do Dia',
      icon: 'i-heroicons-calendar-days',
      to: '/fixtures',
    },
    {
      label: 'Apostas do Dia',
      icon: 'i-heroicons-clipboard-document-list',
      to: '/daily-bets',
    },
    {
      label: 'Performance dos modelos',
      icon: 'i-heroicons-chart-bar',
      to: '/performance',
    },
    {
      label: 'Monitoramento em Lotes',
      icon: 'i-heroicons-inbox-stack',
      to: '/batch-monitoring',
    },
  ],
]
</script>

<template>
  <UHeader>
    <template #title>
      <img src="/dataplay-icon.png" alt="DataPlay" class="h-8" />
    </template>

    <UNavigationMenu :items="navItems" />

    <template #body>
      <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>

  <UMain>
    <NuxtPage class="p-6" />
  </UMain>
</template>
