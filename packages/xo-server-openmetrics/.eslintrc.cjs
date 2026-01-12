'use strict'

const { resolve } = require('path')

module.exports = {
  ignorePatterns: ['src/*.d.ts'],
  overrides: [
    {
      files: ['src/**/*.mts'],

      parser: '@typescript-eslint/parser',

      parserOptions: {
        sourceType: 'module',
        project: './packages/xo-server-openmetrics/tsconfig.json',
        tsconfigRootDir: resolve(__dirname, '../..'),
      },

      plugins: ['@typescript-eslint'],

      rules: {
        // Native module requires file extensions
        'n/no-missing-import': 'off',

        'n/no-unsupported-features/es-syntax': 'off',

        // Allow TypeScript-specific patterns
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  ],
}
