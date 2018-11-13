module.exports = {
  extends: ['standard', 'standard-jsx'],
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
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    indent: 'off',
    'no-var': 'error',
    'node/no-extraneous-import': 'error',
    'node/no-extraneous-require': 'error',
    'prefer-const': 'error',
    'react/jsx-indent': 'off',
  },
}
