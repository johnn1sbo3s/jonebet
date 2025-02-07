// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
   "@nuxt/ui",
   "nuxt-lodash",
   "@nuxt/fonts",
   "@pinia/nuxt",
   "@nuxt/scripts",
   "@nuxtjs/device"
  ],
  devtools: { enabled: false },

  scripts: {
    registry: {
      clarity: {
        id: 'q35mj3r8vd'
      }
    }
  },

  lodash: {
    prefix: "_",
    prefixSkip: ["string"],
    upperAfterPrefix: false,
    exclude: [],
    alias: [
        ["camelCase", "stringToCamelCase"], // => stringToCamelCase
        ["kebabCase", "stringToKebab"], // => stringToKebab
        ["isDate", "isLodashDate"], // => _isLodashDate
    ],
  },

  runtimeConfig: {
    public: {
        API_URL: 'https://api.jonebet.xyz',
    },
  }
});