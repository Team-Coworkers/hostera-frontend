import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', '.repos/**']),
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    extends: [js.configs.recommended, pluginVue.configs['flat/recommended']],
  },
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.{js,mjs,cjs}', 'server/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    },
  },
  {
    files: ['src/shared/presentation/views/home.vue'],
    rules: {
      // Preserve the guide's filename for the shared home view.
      'vue/multi-word-component-names': 'off',
    },
  },
  eslintConfigPrettier,
])
