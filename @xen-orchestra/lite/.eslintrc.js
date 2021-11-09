module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  settings: {
    react: {
      version: '17',
    },
  },
  extends: [
    'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
  ],
  rules: {
    'eslint-comments/disable-enable-pair': 'off',
    // Necessary to pass empty Effects/State to Reaclette
    '@typescript-eslint/no-empty-interface': 'off',
    // https://github.com/typescript-eslint/typescript-eslint/issues/1071
    '@typescript-eslint/no-explicit-any': 'off',
    // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md#how-to-use
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-use-before-define': 'off',

    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    '@typescript-eslint/ban-ts-comment': 'off',
  },
}
