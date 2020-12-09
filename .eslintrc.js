module.exports = {
  extends: [
    'plugin:eslint-comments/recommended',

    'standard',
    'standard-jsx',
    'prettier',
    'prettier/standard',
    'prettier/react',
  ],
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
      files: ['cli.js', '*-cli.js', '**/*cli*/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],

  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
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
  },
}
