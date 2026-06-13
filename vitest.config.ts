import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    include: ['app/**/__tests__/**/*.spec.ts'],
    setupFiles: ['./app/test.setup.ts'],
  },
})
