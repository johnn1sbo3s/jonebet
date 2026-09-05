<script setup>
const route = useRoute()

const navUi = {
  item: 'text-zinc-400 hover:text-white',
  active: 'text-teal-500 bg-zinc-900 rounded-lg',
}

const headerMenuUi = {
  overlay: 'bg-transparent',
  content:
    'bg-zinc-950/60 backdrop-blur-2xl divide-y-0 data-[state=open]:animate-[menu-fade-in_220ms_ease-out] data-[state=closed]:animate-[menu-fade-out_180ms_ease-in]',
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
      label: 'Scanner',
      icon: 'i-lucide-activity',
      to: '/scanner',
    },
    {
      label: 'Performance',
      icon: 'i-lucide-bar-chart-3',
      to: '/performance',
    },
    {
      label: 'Trading Models',
      icon: 'i-lucide-trending-up',
      to: '/trading-models',
    },
    {
      label: 'Academia',
      icon: 'i-lucide-graduation-cap',
      to: '/academy',
    },
  ],
]
</script>

<template>
  <UHeader
    class="border-b border-zinc-800/50 bg-zinc-950/60 backdrop-blur-xl"
    aria-label="Main navigation"
    :menu="{ transition: true }"
    :ui="headerMenuUi"
  >
    <template #title>
      <img src="/dataplay-icon.png" alt="DataPlay" class="h-8" />
    </template>

    <UNavigationMenu :items="navItems" class="hidden xl:flex xl:justify-center" :ui="navUi" />

    <template #right>
      <div class="flex items-center gap-1.5">
        <UNavigationMenu :items="navItems" class="hidden lg:flex xl:hidden" :ui="navUi" />

        <InstallButton />
      </div>
    </template>

    <template #body>
      <div class="flex h-full flex-col">
        <p class="text-2xs mb-4 text-center font-semibold tracking-[0.22em] text-zinc-500 uppercase">Menu principal</p>

        <ul class="flex flex-1 flex-col justify-center gap-1">
          <li v-for="(item, i) in navItems[0]" :key="item.to" :style="{ '--i': i }" class="mobile-menu-item">
            <NuxtLink
              :to="item.to"
              :aria-current="route.path === item.to ? 'page' : undefined"
              exact-active-class="border-teal-400/25 bg-teal-400/10 text-teal-400"
              class="flex items-center gap-3.5 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-zinc-400 transition-colors duration-150 hover:bg-white/5 hover:text-zinc-100"
            >
              <UIcon :name="item.icon" class="size-5" />

              <span>{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>

        <p class="text-2xs mt-5 text-center text-zinc-600">© DataPlay</p>
      </div>
    </template>
  </UHeader>

  <UMain class="bg-zinc-950">
    <UContainer class="pt-5 pb-8">
      <NuxtPage />
    </UContainer>
  </UMain>

  <InstallDrawer />
</template>
