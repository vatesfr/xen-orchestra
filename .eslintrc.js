'use strict'

module.exports = {
  extends: ['plugin:eslint-comments/recommended', 'plugin:n/recommended', 'standard', 'standard-jsx', 'prettier'],
  globals: {
    __DEV__: true,
    $Dict: true,
    $Diff: true,
    $ElementType: true,
    $Exact: true,
    $Keys: true,
    $PropertyType: true,
    $Shape: true,
  },

  overrides: [
    {
      files: ['cli.{,c,m}js', '*-cli.{,c,m}js', '**/*cli*/**/*.{,c,m}js'],
      rules: {
        'n/no-process-exit': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['*.mjs'],
      parserOptions: {
        sourceType: 'module',
      },
    },
    {
      files: ['*.{spec,test}.{,c,m}js'],
      rules: {
        'n/no-unpublished-require': 'off',
        'n/no-unpublished-import': 'off',
        'n/no-unsupported-features/node-builtins': [
          'error',
          {
            version: '>=16',
          },
        ],
        'n/no-unsupported-features/es-syntax': [
          'error',
          {
            version: '>=16',
          },
        ],
      },
    },
  ],

  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'script',
  },

  rules: {
    // disabled because XAPI objects are using camel case
    camelcase: ['off'],

    'react/jsx-handler-names': 'off',

    // disabled because not always relevant, we might reconsider in the future
    //
    // enabled by https://github.com/standard/eslint-config-standard/commit/319b177750899d4525eb1210686f6aca96190b2f
    //
    // example: https://github.com/vatesfr/xen-orchestra/blob/31ed3767c67044ca445658eb6b560718972402f2/packages/xen-api/src/index.js#L156-L157
    'lines-between-class-members': 'off',

    'no-console': ['error', { allow: ['warn', 'error'] }],

    strict: 'error',
  },
}
