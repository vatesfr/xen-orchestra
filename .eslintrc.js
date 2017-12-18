module.exports = {
  extends: ['standard', 'standard-jsx'],
  globals: {
    __DEV__: true,
  },
  parser: 'babel-eslint',
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'no-var': 'error',
    'prefer-const': 'error',
  },
}
