# 1.3 — xo-server-usage-report: drop legacy asyncMapSettled

`xo-server-usage-report` is the last package in the repo that imports `legacy`. It has one call, and
that call passes an array, so only the import changes. After this step, nothing in the repo imports
`legacy`, which is what lets 2.1 delete it.

## Files to touch

- `packages/xo-server-usage-report/src/index.js`: line 1
- `CHANGELOG.unreleased.md`: `- xo-server-usage-report patch`

## Current behavior

`src/index.js:1` is `import asyncMapSettled from '@xen-orchestra/async-map/legacy'`, without `.js`.
The package is babel-compiled to CommonJS (`.babelrc.js` → `@xen-orchestra/babel-config`), so
today's `dist/index.js` holds
`var _legacy = _interopRequireDefault(require("@xen-orchestra/async-map/legacy"));`.

The only call is at line 399, in the SR stats. Its collection is
`filter(xoObjects, obj => obj.type === 'SR' && obj.size > 0 && obj.$PBDs.length > 0)`. That is lodash
`filter` over `values(xo.getObjects())`, so always a new array. The iteratee is a one-argument
`async sr => {…}`. The result **is** used: it is the first argument to `orderBy(…, 'name', 'desc')`.
Both functions resolve in input order, so `orderBy` sees the same array.

## The change

- Replace line 1 **in place** with `import { asyncMapSettled } from '@xen-orchestra/async-map'`. It
  stays the first line of the import block. Nothing else in the file changes.
- In `CHANGELOG.unreleased.md`, add `- xo-server-usage-report patch` in alphabetical order.
  - `xo-server` sorts before `xo-server-usage-report`.
  - Any other `xo-server-<x>` line sorts by that suffix.

**Not this step's job:** `@xen-orchestra/async-map` itself (step 2.1).

Commit subject: `refactor(xo-server-usage-report): drop legacy asyncMapSettled`

## Verify

```sh
npx prettier --write packages/xo-server-usage-report/src/index.js

# must print nothing: this is the last in-repo importer of legacy (steps/ quotes the old import, so it is excluded)
rg -n "async-map/legacy" -g '!**/node_modules/**' -g '!**/dist/**' -g '!steps/**' .

yarn workspace xo-server-usage-report build
rg -nF '_asyncMap.asyncMapSettled' packages/xo-server-usage-report/dist/index.js   # the compiled call uses the named export
rg -n 'async-map/legacy' packages/xo-server-usage-report/dist/index.js            # must print nothing
node -e "require('./packages/xo-server-usage-report/dist/index.js'); console.log('loads')"
node -e "console.log(typeof require('@xen-orchestra/async-map').asyncMapSettled)"  # function

npx eslint --ignore-path .gitignore packages/xo-server-usage-report/src/index.js
./scripts/gen-deps-list.js --check-order
```
