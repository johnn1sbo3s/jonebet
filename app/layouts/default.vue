<script setup>
const navUi = {
  item: 'text-[#888888] hover:text-white',
  active: 'text-[#14B8A6] bg-[#1a1a1a] rounded-lg',
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
  <UHeader class="bg-[#0a0a0a] border-b border-[#2a2a2a]" aria-label="Main navigation">
    <template #title>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-chart-bar" class="text-[#14B8A6] w-6 h-6" />

        <span class="text-white font-bold text-lg tracking-tight">DataPlay</span>
      </div>
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

  <UMain class="bg-[#0a0a0a]">
    <UContainer class="py-8">
      <NuxtPage />
    </UContainer>
  </UMain>
</template>