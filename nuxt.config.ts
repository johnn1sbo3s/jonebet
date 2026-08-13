export default defineNuxtConfig({
  app: {
    head: {
      title: 'Dataplay Bets',
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'DataPlay' },
      ],
      link: [{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    },
  },
  modules: ['@nuxt/ui', '@nuxt/fonts', '@pinia/nuxt', '@nuxtjs/device', '@nuxt/eslint', '@vite-pwa/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    // suppressWarnings: em dev o @vite-pwa/nuxt injeta `_nuxt/builds/**/*.json`
    // (app manifest) no globPatterns, mas esse arquivo só existe no build de
    // produção — o workbox avisa "glob pattern doesn't match" a cada rebuild.
    // A flag troca o glob por um arquivo dummy (suppress-warnings.js) só no dev.
    devOptions: { enabled: true, suppressWarnings: true },
    workbox: { navigateFallback: null },
    manifest: {
      name: 'Dataplay Bets',
      short_name: 'DataPlay',
      description: 'Desempenho de apostas esportivas em tempo real',
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#09090b',
      background_color: '#09090b',
      icons: [
        { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
  },

  icon: {
    clientBundle: {
      scan: true,
    },
  },

  css: ['@/assets/css/main.css'],

  devtools: { enabled: false },

  compatibilityDate: '2026-06-05',

  colorMode: {
    preference: 'dark',
  },

  runtimeConfig: {
    public: {
      API_URL: 'https://api.jonebet.xyz',
      SCANNER_SNAPSHOT_URL: 'https://scanner.jonebet.xyz/live.json',
    },
  },

  // Home (dashboard) is public and its data changes by day, not by second.
  // Cache the SSR HTML at the CDN edge for 60s (stale-while-revalidate): the
  // first hit renders server-side, everyone else in the window gets the edge
  // copy (~50ms) with no SSR run and no API call.
  routeRules: {
    '/': { swr: 60 },
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom', 'luxon', 'pinia', 'vue-chart-3', 'zod'],
    },
  },
})
