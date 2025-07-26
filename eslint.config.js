import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  rules: {
    // Allow unused variables that start with underscore
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }
    ],
    // Relax some Vue-specific rules
    'vue/no-required-prop-with-default': 'warn',
    'vue/require-prop-types': 'warn',
    'vue/no-v-html': 'warn',
    'vue/html-self-closing': 'warn',
    'vue/attributes-order': 'warn',
    'vue/attribute-hyphenation': 'warn',
    'vue/no-lone-template': 'warn',
    // Force attributes on separate lines
    'vue/max-attributes-per-line': [
      'error',
      {
        'singleline': 1,
        'multiline': 1
      }
    ],
    'vue/first-attribute-linebreak': [
      'error',
      {
        'singleline': 'ignore',
        'multiline': 'below'
      }
    ],
    'vue/html-closing-bracket-newline': [
      'error',
      {
        'singleline': 'never',
        'multiline': 'always'
      }
    ]
  },
  languageOptions: {
    globals: {
      // Lodash functions from nuxt-lodash
      '_groupBy': 'readonly',
      '_forEach': 'readonly',
      '_map': 'readonly',
      '_sum': 'readonly',
      // Pinia
      'defineStore': 'readonly'
    }
  }
})
