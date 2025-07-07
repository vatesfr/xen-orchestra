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
        'n/no-unsupported-features/es-builtins': [
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
      parser: 'vue-eslint-parser',
      parserOptions: {
        sourceType: 'module',
        parser: '@typescript-eslint/parser',
      },
      plugins: ['import'],
      extends: [
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/vue3-essential',
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
      globals: {
        XO_LITE_VERSION: true,
        XO_LITE_GIT_HEAD: true,
      },
      rules: {
        'import/order': [
          'error',
          {
            groups: ['builtin', 'object', 'internal', ['type', 'external']],
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
            pathGroups: [
              {
                pattern: '@/**',
                group: 'internal',
              },
              {
                pattern: '@core/**',
                group: 'internal',
              },
            ],
          },
        ],
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': 'error',
        'no-void': ['error', { allowAsStatement: true }],
        'n/no-missing-import': 'off', // using 'import' plugin instead, to support TS aliases
        'no-redeclare': 'off', // automatically checked by the TypeScript compiler
        'no-dupe-class-members': 'off', // automatically checked by the TypeScript compiler
        'no-undef': 'off', // automatically checked by the TypeScript compiler
        'no-use-before-define': 'off', // replaced with the rule below
        '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
        '@typescript-eslint/no-explicit-any': 'off',
        'vue/multi-word-component-names': 'off',
        // Vue 3 - Strongly Recommended
        'vue/attribute-hyphenation': 'error',
        'vue/component-definition-name-casing': 'error',
        'vue/first-attribute-linebreak': 'error',
        'vue/html-closing-bracket-newline': 'off', // Conflicts with Prettier
        'vue/html-closing-bracket-spacing': 'error',
        'vue/html-end-tags': 'error',
        'vue/html-indent': 'off', // Conflicts with Prettier
        'vue/html-quotes': 'error',
        'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
        'vue/max-attributes-per-line': 'off', // Conflicts with Prettier
        'vue/multiline-html-element-content-newline': 'error',
        'vue/mustache-interpolation-spacing': 'error',
        'vue/no-multi-spaces': 'error',
        'vue/no-spaces-around-equal-signs-in-attribute': 'error',
        'vue/no-template-shadow': 'error',
        'vue/prop-name-casing': 'error',
        'vue/require-default-prop': 'off', // https://github.com/vuejs/eslint-plugin-vue/issues/2051
        'vue/require-explicit-emits': 'error',
        'vue/require-prop-types': 'error',
        'vue/singleline-html-element-content-newline': 'off',
        'vue/v-bind-style': 'error',
        'vue/v-on-event-hyphenation': ['error', 'always', { autofix: true }],
        'vue/v-on-style': 'error',
        'vue/v-slot-style': 'error',
        // Vue 3 - Recommended
        'vue/attributes-order': 'error',
        'vue/no-lone-template': 'error',
        'vue/no-multiple-slot-args': 'error',
        'vue/no-v-html': 'error',
        'vue/this-in-template': 'error',
        // Vue 3 - Uncategorized
        'vue/block-lang': ['error', { script: { lang: 'ts' }, style: { lang: 'postcss' } }],
        'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
        'vue/block-tag-newline': ['error', { singleline: 'consistent', multiline: 'always', maxEmptyLines: 0 }],
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
        'vue/custom-event-name-casing': ['error', 'camelCase'],
        'vue/define-emits-declaration': ['error', 'type-literal'],
        'vue/define-macros-order': [
          'error',
          {
            order: ['defineOptions', 'defineProps', 'defineEmits', 'defineModel', 'defineSlots'],
            defineExposeLast: true,
          },
        ],
        'vue/define-props-declaration': ['error', 'type-based'],
        'vue/enforce-style-attribute': ['error', { allow: ['scoped', 'module'] }],
        'vue/html-button-has-type': 'error',
        'vue/html-comment-content-newline': ['error', { singleline: 'never', multiline: 'always' }],
        'vue/html-comment-content-spacing': ['error', 'always'],
        'vue/no-duplicate-attr-inheritance': 'error',
        'vue/no-empty-component-block': 'error',
        'vue/no-multiple-objects-in-class': 'error',
        'vue/no-ref-object-reactivity-loss': 'error',
        'vue/no-required-prop-with-default': 'error',
        'vue/no-static-inline-styles': 'error',
        'vue/no-template-target-blank': 'error',
        'vue/no-undef-components': ['error', { ignorePatterns: ['RouterLink', 'RouterView', 'I18nT'] }],
        'vue/no-undef-properties': 'error',
        'vue/no-unused-refs': 'error',
        'vue/no-use-v-else-with-v-for': 'error',
        'vue/no-useless-mustaches': 'error',
        'vue/no-useless-v-bind': 'error',
        'vue/no-v-text': 'error',
        'vue/padding-line-between-blocks': 'error',
        'vue/prefer-define-options': 'error',
        'vue/prefer-separate-static-class': 'error',
        'vue/prefer-true-attribute-shorthand': 'error',
        'vue/require-macro-variable-name': 'error',
        'vue/valid-define-options': 'error',
      },
    },
    // Specific rules for XO i18n-related files
    {
      files: [
        '@xen-orchestra/lite/**/*.{vue,ts}',
        '@xen-orchestra/web/**/*.{vue,ts}',
        '@xen-orchestra/web-core/**/*.{vue,ts,json}',
      ],
      extends: ['plugin:@intlify/vue-i18n/base'],
      settings: {
        'vue-i18n': {
          localeDir: ['@xen-orchestra/web-core/lib/locales/*.json'],
          messageSyntaxVersion: '^9.9.0',
        },
      },
      rules: {
        strict: 'off',
        'no-irregular-whitespace': 'off',
        '@intlify/vue-i18n/no-deprecated-i18n-component': 'error',
        '@intlify/vue-i18n/no-deprecated-i18n-place-attr': 'error',
        '@intlify/vue-i18n/no-deprecated-i18n-places-prop': 'error',
        '@intlify/vue-i18n/no-deprecated-modulo-syntax': 'error',
        '@intlify/vue-i18n/no-deprecated-tc': 'error',
        '@intlify/vue-i18n/no-html-messages': 'error',
        '@intlify/vue-i18n/no-i18n-t-path-prop': 'error',
        '@intlify/vue-i18n/no-missing-keys': 'error',
        '@intlify/vue-i18n/no-raw-text': [
          'error',
          {
            ignoreText: [
              'Xen Orchestra Lite',
              'Xen Orchestra',
              'Xen Orchestra Appliance',
              'XO Lite',
              'XCP-ng',
              'XO 5',
              '404',
              '⚠️',
            ],
          },
        ],
        '@intlify/vue-i18n/no-v-html': 'error',
        '@intlify/vue-i18n/valid-message-syntax': 'error',
        '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',
        '@intlify/vue-i18n/no-missing-keys-in-other-locales': [
          'error',
          { ignoreLocales: ['de', 'fa', 'cs', 'es', 'sv', 'it', 'ru', 'uk', 'nl'] },
        ],
      },
    },
    // Specific rules for XO dev-related files
    {
      files: [
        '@xen-orchestra/lite/src/stories/**/*',
        '@xen-orchestra/lite/src/components/component-story/**/*',
        '@xen-orchestra/web/src/pages/dev/**/*',
        '@xen-orchestra/lite/src/views/story/**/*',
      ],
      rules: {
        '@intlify/vue-i18n/no-raw-text': 'off',
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

  ignorePatterns: ['@vates/fatfs/'],

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
    'require-atomic-updates': ['warn', { allowProperties: true }],

    strict: 'error',
  },
}
