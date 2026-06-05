import { createConfigForNuxt } from '@nuxt/eslint-config'
import blankLineBetweenSiblings from './eslint-rules/vue-blank-line-between-siblings.js'

const customPlugin = {
  files: ['**/*.vue'],
  plugins: {
    custom: {
      rules: {
        'vue-blank-line-between-siblings': blankLineBetweenSiblings
      }
    }
  },
  rules: {
    'custom/vue-blank-line-between-siblings': 'error'
  }
}

export default createConfigForNuxt(
  { ignores: ['scripts/**/*.cjs'] },
  customPlugin,
  {
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      'nuxt/nuxt-config-keys-order': 'off'
    }
  }
)
