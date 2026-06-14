import prettierConfig from 'eslint-config-prettier'
import { createConfigForNuxt } from '@nuxt/eslint-config'
import blankLineBetweenSiblings from './eslint-rules/vue-blank-line-between-siblings.js'
import noHtmlComments from './eslint-rules/no-html-comments.js'
import globals from 'globals'

const nuxtGlobals = {
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      // Nuxt auto-imports
      defineNuxtPlugin: 'readonly',
      defineNuxtConfig: 'readonly',
      defineNuxtRouteMiddleware: 'readonly',
      defineAppConfig: 'readonly',
      useRuntimeConfig: 'readonly',
      useState: 'readonly',
      useFetch: 'readonly',
      useAsyncData: 'readonly',
      navigateTo: 'readonly',
      navigateBack: 'readonly',
      abortNavigation: 'readonly',
      addRouteMiddleware: 'readonly',
      setPageLayout: 'readonly',
      defineNuxtComponent: 'readonly',
      prerenderRoutes: 'readonly',
      useRequestEvent: 'readonly',
      useRequestURL: 'readonly',
      createError: 'readonly',
      clearError: 'readonly',
      showError: 'readonly',
      clearNuxtState: 'readonly',
      refreshNuxtData: 'readonly',
      clearNuxtData: 'readonly',
      useHydration: 'readonly',
      callOnce: 'readonly',
      setResponseStatus: 'readonly',
      reloadNuxtApp: 'readonly',
      defineNuxtRouteRules: 'readonly',
      getRouteRules: 'readonly',
      defineStore: 'readonly',
      // Vue auto-imports
      ref: 'readonly',
      reactive: 'readonly',
      computed: 'readonly',
      watch: 'readonly',
      watchEffect: 'readonly',
      toRef: 'readonly',
      toRefs: 'readonly',
      unref: 'readonly',
      nextTick: 'readonly',
      onMounted: 'readonly',
      onUnmounted: 'readonly',
      onBeforeMount: 'readonly',
      onBeforeUnmount: 'readonly',
      onUpdated: 'readonly',
      onBeforeUpdate: 'readonly',
    }
  }
}

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

export default createConfigForNuxt(
  { ignores: ['scripts/**/*.cjs'] },
  nuxtGlobals,
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
