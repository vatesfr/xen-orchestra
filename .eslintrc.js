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
      files: ['cli.js', '*-cli.js', 'packages/*cli*/**/*.js'],
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

    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-var': 'error',
    'node/no-extraneous-import': 'error',
    'node/no-extraneous-require': 'error',
    'prefer-const': 'error',
  },
}
