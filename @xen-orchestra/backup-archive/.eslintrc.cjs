'use strict'

module.exports = {
  overrides: [
    {
      // .mjs files importing compiled .mts sources (`./x.mjs` only exists in `dist/`)
      files: ['src/**/*.mjs'],
      rules: {
        'n/no-missing-import': 'off',
      },
    },
  ],
}
