export default defineNuxtConfig({
  app: {
    head: {
      title: 'Dataplay Bets',
      link: [
        { rel: 'preconnect', href: 'https://api.jonebet.xyz' },
        { rel: 'dns-prefetch', href: 'https://api.jonebet.xyz' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  modules: ['@nuxt/image', '@nuxt/ui', '@nuxt/fonts', '@pinia/nuxt', '@nuxtjs/device', '@nuxt/eslint'],

  image: {
    provider: 'vercel',
    quality: 80,
    format: ['webp', 'avif'],
  },

  fonts: {
    families: [{ name: 'Plus Jakarta Sans', preload: true }],
  },

  css: ['@/assets/css/main.css'],

  devtools: { enabled: false },

  compatibilityDate: '2026-06-05',

  colorMode: {
    preference: 'dark',
  },

  hooks: {
    'build:manifest': (manifest) => {
      for (const key of Object.keys(manifest)) {
        const entry = manifest[key]
        if (!entry) continue
        if (entry.resourceType === 'style' || key.endsWith('.css')) {
          entry.dynamicImports = []
        }
        entry.css = []
      }
    },
  },

  runtimeConfig: {
    public: {
      API_URL: 'https://api.jonebet.xyz',
    },
  },

  build: {
    analyze: true,
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom', 'luxon', 'pinia'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-charts': ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom'],
            'vendor-luxon': ['luxon'],
          },
        },
      },
    },
  },
})
