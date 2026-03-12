import { defineConfig, globalIgnores } from 'eslint/config'
import nextPlugin from '@next/eslint-plugin-next'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default defineConfig([
  globalIgnores([
    '.next/**',
    'coverage/**',
    'node_modules/**',
    'dist/**',
    'out/**',
    'eslint.config.mjs',
    'middleware.ts',
    'next.config.js',
    'jest.config.js',
    'jest.setup.js',
    'next-env.d.ts',
  ]),
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  ...tseslint.configs.recommended,
])
