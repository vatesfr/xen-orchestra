'use strict'

module.exports = {
  overrides: [
    {
      files: ['src/**/*'],

      parser: '@babel/eslint-parser',

      parserOptions: {
        ecmaFeatures: {
          legacyDecorators: true,
        },
        sourceType: 'module',
      },
    },
  ],
}
