'use strict'

// Self-contained ESLint config for the Docusaurus docs site.
//
// `root: true` stops inheritance from the monorepo-root config: that config
// parses files as CommonJS scripts (`sourceType: 'script'`) and only opts into
// ESM for `.mjs` and a few XO web packages, which breaks the docs' ESM
// TypeScript/TSX sources (docusaurus.config.ts, sidebars.ts, src/**).
//
// The docs project ships no ESLint deps of its own; this reuses the parser and
// plugins already installed at the monorepo root (@typescript-eslint/parser,
// eslint-plugin-react, eslint-config-prettier).
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  extends: ['eslint:recommended', 'prettier'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.mjs'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: ['react'],
      extends: ['plugin:react/recommended', 'prettier'],
      settings: { react: { version: 'detect' } },
      rules: {
        // Docusaurus/React 18: the JSX runtime is automatic and props are typed.
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        // The @typescript-eslint *plugin* is not installed here, so core
        // no-undef/no-unused-vars misfire on TS type syntax — defer both to
        // `yarn typecheck` (tsc), which is the source of truth for types.
        'no-undef': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
}
