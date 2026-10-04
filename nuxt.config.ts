// Security headers, applied to every route below. HSTS is deliberately absent:
// the Vercel edge already sends it, and keeping it out avoids two sources of
// truth drifting apart.
// Allowed origins: the app itself, the own API, the scanner snapshot, and the
// font/icon CDNs @nuxt/fonts + @nuxt/ui fetch at runtime (the fonts module
// self-hosts and inlines, but its font metadata/CSS still comes from
// fonts.bunny.net / fonts.googleapis.com). 'unsafe-inline' stays on
// style-src because Nuxt UI and the app inject scoped styles at runtime;
// script-src does NOT need it, and frame-ancestors plus
// script-src-attr blocking javascript: URLs is the point of this policy.
const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.bunny.net",
    // No inline event handlers: this is what blocks javascript: navigation
    // URLs, which the 'unsafe-inline' that script-src needs (Nuxt SSR payload)
    // would otherwise permit via inline handlers.
    "script-src-attr 'none'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.jonebet.xyz https://scanner.jonebet.xyz",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

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
  modules: ['@nuxt/ui', '@nuxt/fonts', '@nuxtjs/device', '@nuxt/eslint', '@vite-pwa/nuxt'],

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
  // Cache the SSR HTML at the CDN edge for 60s, then serve stale for up to
  // 60s more while revalidating in background. max-age=0 keeps browsers from
  // caching it themselves. (swr:60 mapped to a bare stale-while-revalidate
  // that Vercel served indefinitely — explicit header bounds staleness.)

  // Security headers. HSTS is NOT here on purpose: the Vercel edge already sends
  // it, and duplicating it in the repo would make the two drift apart.
  // Origins allowed below: the app itself, the own API, the scanner snapshot,
  // the font/icon CDNs @nuxt/fonts + @nuxt/ui use, and the Flashscore links the
  // comparison UI links to (navigation, so only frame-ancestors/connect matter
  // for it — it is kept out of script/style/img on purpose).
  routeRules: {
    '/': {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
        ...securityHeaders,
      },
    },
    '/**': { headers: securityHeaders },
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', 'chartjs-plugin-annotation', 'chartjs-plugin-zoom', 'luxon', 'vue-chart-3', 'zod'],
    },
  },
})
