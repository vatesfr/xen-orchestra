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
      files: ['cli.{,c,m}js', '*-cli.{,c,m}js', '**/*cli*/**/*.{,c,m}js', '**/scripts/**.{,c,m}js'],
      rules: {
        'n/no-process-exit': 'off',
        'n/shebang': 'off',
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
      files: ['*.{integ,spec,test}.{,c,m}js'],
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
    {
      files: ['@xen-orchestra/{web-core,lite,web}/**/*.{vue,ts}'],
      parserOptions: {
        sourceType: 'module',
      },
      plugins: ['import'],
      extends: [
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:vue/vue3-recommended',
        '@vue/eslint-config-typescript/recommended',
        '@vue/eslint-config-prettier',
      ],
      settings: {
        'import/resolver': {
          typescript: true,
          'eslint-import-resolver-custom-alias': {
            alias: {
              '@core': '../web-core/lib',
              '@': './src',
            },
            extensions: ['.ts'],
            packages: ['@xen-orchestra/lite', '@xen-orchestra/web'],
          },
        },
      },
      rules: {
        'no-void': 'off',
        'n/no-missing-import': 'off', // using 'import' plugin instead to support TS aliases
        '@typescript-eslint/no-explicit-any': 'off',
        'vue/require-default-prop': 'off', // https://github.com/vuejs/eslint-plugin-vue/issues/2051
      },
    },
    {
      files: ['@xen-orchestra/{web-core,lite,web}/src/pages/**/*.vue'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    {
      files: ['@xen-orchestra/{web-core,lite,web}/typed-router.d.ts'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'eslint-comments/disable-enable-pair': 'off',
        'eslint-comments/no-unlimited-disable': 'off',
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

    // this rule can prevent race condition bugs like parallel `a += await foo()`
    //
    // as it has a lots of false positive, it is only enabled as a warning for now
    'require-atomic-updates': 'warn',

    strict: 'error',
  },
}
