export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@pinia/nuxt',
    '@nuxtjs/device'
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