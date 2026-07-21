// ─── ESLint flat config (ESLint 9 + typescript-eslint) ───────────────────────
// Configuración básica para un proyecto Vite + React + TypeScript.
// Objetivo de esta remediación: que `npm run lint` funcione (herramienta
// instalada y configurada); no es necesario resolver todos los warnings
// sobre el código ya existente.

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // No es necesario resolver todo el código preexistente en esta pasada;
      // se deja como warning en vez de error bloqueante.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
)
