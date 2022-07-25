/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",
  ],
  plugins: [
    [
      "@limegrass/import-alias",
      { aliasConfigPath: require("path").join(__dirname, ".tsconfig.json") },
    ],
  ],
  rules: {
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@limegrass/import-alias/import-alias": [
      "error",
      { aliasConfigPath: require("path").join(__dirname, "tsconfig.json") },
    ],
  },
};
