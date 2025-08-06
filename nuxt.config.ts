// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: false },
	compatibilityDate: '2025-07-26',

	modules: [
		"@nuxt/ui",
		"nuxt-lodash",
		"@nuxt/fonts",
		"@pinia/nuxt",
		"@nuxt/scripts",
		"@nuxtjs/device"
	],

	colorMode: {
		preference: 'dark',
	},


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
			API_URL: 'https://45.92.10.252/',
			API_V2: 'http://45.92.10.252:5001',
		},
	}
});