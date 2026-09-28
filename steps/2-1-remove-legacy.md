# 2.1 — async-map: remove the deprecated legacy entry point

After phase 1, nothing in the repo imports `@xen-orchestra/async-map/legacy` or `legacy.js`.
This step deletes the entry point, its tests, its two `exports` entries, and the `lodash` dependency
that only it used. That is a breaking change for any external consumer of `/legacy`, so the
changelog bump becomes `major`.

## Files to touch

- `@xen-orchestra/async-map/src/legacy.cts`: delete
- `@xen-orchestra/async-map/src/legacy.test.cts`: delete
- `@xen-orchestra/async-map/package.json`: `exports`, `dependencies`, `devDependencies`
- `yarn.lock`: whatever `yarn` changes
- `CHANGELOG.unreleased.md`: `@xen-orchestra/async-map minor` → `major`

## Current behavior

`src/legacy.cts` defines `asyncMapLegacy` as two overloads over arrays and records, with an untyped
implementation built on `import map = require('lodash/map')`, and ends with `export = asyncMapLegacy`.
`src/legacy.test.cts` holds the 7 `asyncMapLegacy` tests. `src/index.cts` and `src/index.test.cts`
don't reference `lodash` or `legacy`, and neither do `.USAGE.md` and `README.md`.

`package.json` (version `0.1.5`) has:

- in `exports`, the entries `"."`, `"./index.js"`, `"./legacy"`, `"./legacy.js"` and
  `"./package.json"`. Both legacy entries map `types` to `./dist/legacy.d.cts` and `default` to
  `./dist/legacy.cjs`.
- `"dependencies": { "lodash": "^4.18.0" }`, its only runtime dependency.
- `"@types/lodash": "^4.17.0"` among the `devDependencies`. No other workspace package declares it.

`yarn.lock` has two entries: `"@types/lodash@^4.17.0"`, which exists only because of this package,
and `"@types/lodash@*"`, which `@types/lodash-es` pulls in.

The `test` script is `tsc && node --test "dist/**/*.test.cjs"`. It does **not** clear `dist/`; only
`prebuild` runs `rimraf dist/`. So after deleting the sources, a bare `yarn test` would still find and
run the stale `dist/legacy.test.cjs` against the stale `dist/legacy.cjs`, and pass.

## The change

1. Delete `src/legacy.cts` and `src/legacy.test.cts`.
2. In `package.json`:
   - remove the `"./legacy"` and `"./legacy.js"` blocks from `exports`. Keep `"."`, `"./index.js"` and
     `"./package.json"` as they are.
   - remove the whole `dependencies` key. `lodash` was its only entry, and
     `scripts/normalize-packages.js` deletes empty ones anyway.
   - remove `"@types/lodash"` from `devDependencies`.
   - touch nothing else: `version`, `main`, `types`, `engines` and `keywords` all stay.
3. Run `yarn` at the repo root and include the resulting `yarn.lock` change. Expect the
   `"@types/lodash@^4.17.0"` entry to disappear and `"@types/lodash@*"` to stay.
4. In `CHANGELOG.unreleased.md`, change `- @xen-orchestra/async-map minor` to
   `- @xen-orchestra/async-map major`.
   - Don't add lines for the packages that depend on async-map: `gen-deps-list.js` derives those.
   - Add no prose bullet.

Commit subject: `feat(async-map): remove the deprecated legacy entry point`

The body must say three things:

- it is breaking: `@xen-orchestra/async-map/legacy` and `/legacy.js` no longer resolve
  (`ERR_PACKAGE_PATH_NOT_EXPORTED`);
- phase 1 moved every in-repo caller to the named `asyncMapSettled`;
- `lodash` goes with it.

Also give external consumers the migration:

- use the named `asyncMapSettled` from the main entry point;
- `await` a promise collection first;
- pass `Object.values(obj)`, or `Object.entries(obj)` when the key was used;
- pass `x ?? []` where the collection can be nullish;
- the mapper now receives only the item.

**Not this step's job:**

- `@vates/nbd-client`'s unused dependency on async-map;
- any change to `index.cts`, its tests, `.USAGE.md` or `README.md`. `README.md` is generated; never
  hand-edit it.

## Verify

```sh
cd @xen-orchestra/async-map
yarn build                      # runs prebuild's rimraf dist/ first: required, see "Current behavior"
ls dist                         # index.cjs index.d.cts index.test.cjs index.test.d.cts, and no legacy.*
yarn test                       # tests 11, suites 2, pass 11, fail 0
cd ../..

# both old specifiers must now fail with ERR_PACKAGE_PATH_NOT_EXPORTED; the main entry still works
node -e "require('@xen-orchestra/async-map/legacy.js')" 2>&1 | grep -c ERR_PACKAGE_PATH_NOT_EXPORTED   # 1
node --input-type=module -e "import('@xen-orchestra/async-map/legacy').catch(e => console.log(e.code))" # ERR_PACKAGE_PATH_NOT_EXPORTED
node -e "const m = require('@xen-orchestra/async-map'); console.log(typeof m.asyncMap, typeof m.asyncMapSettled)"  # function function

# nothing left in the repo refers to it (steps/ quotes the old import, so it is excluded)
rg -n "async-map/legacy" -g '!**/node_modules/**' -g '!**/dist/**' -g '!steps/**' .   # nothing
rg -n "lodash" @xen-orchestra/async-map -g '!node_modules' -g '!dist'                  # nothing

git add yarn.lock && yarn && git diff --exit-code yarn.lock   # a second install on top of the staged lock is a no-op
./scripts/gen-deps-list.js --check-order

# the real consumers still load against the rebuilt package
node -e "require('./@vates/disposable/debounceResource.js'); require('./packages/vhd-lib/merge.js'); console.log('cjs consumers ok')"
yarn workspace xo-server build && yarn workspace xo-server test     # 383 pass, 0 fail
for f in collection/redis.mjs xapi/index.mjs xo-mixins/metadata-backups.mjs; do
  node --input-type=module -e "await import('./packages/xo-server/dist/$f')" && echo "ok $f"
done
npx eslint --ignore-path .gitignore @xen-orchestra/async-map
```
