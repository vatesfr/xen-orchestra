// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: __dirname,
    },
  },
  ignores: ['dist'],
  rules: {
    // Allow empty interface for recursive generic typing (E.g. interface XenApiNetworkWrapped)
    '@typescript-eslint/no-empty-object-type': 'off',
  },
})
