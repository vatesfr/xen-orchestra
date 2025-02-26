// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  rules: {
    'no-unused-vars': ['off'], // In order to define the OpenAPI specification, we sometimes need to declare variables that will not be used.
  },
})
