module.exports = {
  // use standard configuration and disable rules handled by prettier
  extends: [
    // standard configuration
    "standard",

    // https://github.com/mysticatea/eslint-plugin-node#-rules
    "plugin:node/recommended",

    // disable rules handled by prettier
    "prettier",
    "prettier/standard",
  ],

  rules: {
    // prefer let/const over var
    "no-var": "error",

    // prefer const over let when possible
    //
    // should be included in standard: https://github.com/standard/eslint-config-standard/pull/133/
    "prefer-const": "error",

    // detect incorrect import
    "node/no-extraneous-import": "error",
    "node/no-missing-import": "error",

    // we are using Babel
    "node/no-unsupported-features/es-syntax": "off",
  },
};
