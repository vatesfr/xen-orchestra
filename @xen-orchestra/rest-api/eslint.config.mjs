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
  rules: {
    'no-unused-vars': ['off'], // In order to define the OpenAPI specification, we sometimes need to declare variables that will not be used.
  },
})
