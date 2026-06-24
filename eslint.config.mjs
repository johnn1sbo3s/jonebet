import prettierConfig from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'
import blankLineBetweenSiblings from './eslint-rules/vue-blank-line-between-siblings.js'
import noHtmlComments from './eslint-rules/no-html-comments.js'

const customPlugin = {
  files: ['**/*.vue'],
  plugins: {
    custom: {
      rules: {
        'vue-blank-line-between-siblings': blankLineBetweenSiblings,
        'no-html-comments': noHtmlComments
      }
    }
  },
  rules: {
    'custom/vue-blank-line-between-siblings': 'error',
    'custom/no-html-comments': 'error'
  }
}

export default withNuxt(
  { ignores: ['scripts/**/*.cjs'] },
  customPlugin,
  {
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': ['error', { singleline: 3 }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
      'nuxt/nuxt-config-keys-order': 'off',
      'indent': ['error', 2]
    }
  },
  prettierConfig
)
