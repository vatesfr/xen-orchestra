

// const { rules } = require("eslint-config-prettier");

module.exports = {
  // extends: ['plugin:eslint-comments/recommended', 'plugin:n/recommended', 'standard', 'standard-jsx', 'prettier'],
  globals: {
    __DEV__: true,
    $Dict: true,
    $Diff: true,
    $ElementType: true,
    $Exact: true,
    $Keys: true,
    $PropertyType: true,
    $Shape: true,
  },  parserOptions: {
    sourceType: "module",
  },
  // overrides: [
  //  {
  //    files: ['*.{integ,spec,test}.{,c,m}js'],
      rules: {
        newIsCap: ['warn']
      }
   // }
  // ]
}
