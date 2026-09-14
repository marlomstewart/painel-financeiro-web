import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      // Carregamentos assíncronos iniciados ao montar hooks permanecem observáveis durante a
      // migração gradual para efeitos com cancelamento; não devem bloquear o lint da aplicação.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: { globals: globals.vitest },
  },
  {
    files: ['src/hooks/**/*.{js,jsx}', 'src/main.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
