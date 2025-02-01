// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "nuxt-lodash", "@nuxt/fonts", "@pinia/nuxt"],
  devtools: { enabled: false },

  app: {
	head: {
	  script: [
		{
		  src: "//cdn.mouseflow.com/projects/5385053f-80d7-4871-bb21-d73a67e291da.js",
		  defer: true,
		},
	  ],
	},
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