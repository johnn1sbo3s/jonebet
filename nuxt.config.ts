export default defineNuxtConfig({
  app: {
    head: {
      title: 'Dataplay Bets',
    },
  },
  modules: ['@nuxt/ui', '@nuxt/fonts', '@pinia/nuxt', '@nuxtjs/device', '@nuxt/eslint'],

  css: ['@/assets/css/main.css'],

  devtools: { enabled: false },

  compatibilityDate: '2026-06-05',

  colorMode: {
    preference: 'dark',
  },

  runtimeConfig: {
    public: {
      API_URL: 'https://api.jonebet.xyz',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom', 'luxon', 'pinia', 'vue-chart-3', 'zod'],
    },
  },
})
