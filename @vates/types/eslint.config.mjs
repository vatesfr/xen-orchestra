// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  ignores: ['dist'],
  rules: {
    // Allow empty interface for recursive generic typing (E.g. interface XenApiNetworkWrapped)
    '@typescript-eslint/no-empty-object-type': 'off',
  },
})
