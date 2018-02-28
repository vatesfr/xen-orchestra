module.exports = {
  extends: ['standard', 'standard-jsx'],
  globals: {
    __DEV__: true,
    $Diff: true,
    $Exact: true,
    $Keys: true,
    $Shape: true,
  },
  parser: 'babel-eslint',
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'no-var': 'error',
    'node/no-extraneous-import': 'error',
    'node/no-extraneous-require': 'error',
    'prefer-const': 'error',
  },
}
