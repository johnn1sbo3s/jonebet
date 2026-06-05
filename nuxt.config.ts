export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@pinia/nuxt',
    '@nuxtjs/device',
    '@nuxt/eslint'
  ],

  css: ['@/assets/css/main.css'],

  devtools: { enabled: false },

  colorMode: {
    preference: 'dark',
  },

  runtimeConfig: {
    public: {
      API_URL: 'https://api.jonebet.xyz',
    },
  }
})