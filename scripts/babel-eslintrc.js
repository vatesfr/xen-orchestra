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

      rules: {
        // Native module (and this rule) requires file extensions, but Babel does not
        'n/no-missing-import': 'off',

        'n/no-unsupported-features/es-syntax': 'off',
        'n/shebang': [
          'error',
          {
            convertPath: {
              'src/**/*.{,c,m}js': ['^src/(.+)$', 'dist/$1'],
            },
          },
        ],
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
}
