# 1.1 — xo-server: drop legacy asyncMapSettled where a call passes a promise or an object

Four xo-server files each hold one call that the new `asyncMapSettled` would reject. Two calls pass a
promise and two pass a plain object; legacy accepts both. This step moves all 16 calls in these four
files to the new import and adapts those four. They go in their own commit because they are the only
calls in the plan whose code changes.

## Files to touch

- `packages/xo-server/src/collection/redis.mjs`: the import, plus `await` in `rebuildIndexes`
- `packages/xo-server/src/xapi/index.mjs`: merge the import, plus `Object.values` in `createBondedNetwork`
- `packages/xo-server/src/xo-mixins/jobs/index.mjs`: the import, plus `async`/`await` in the
  `plugins:registered` listener
- `packages/xo-server/src/xo-mixins/metadata-backups.mjs`: the import, plus `Object.entries` in
  `createMetadataBackupJob`
- `CHANGELOG.unreleased.md`: `- xo-server patch`

## Current behavior

Each file imports `import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'`:

- `redis.mjs:2`
- `xapi/index.mjs:9`
- `jobs/index.mjs:1`
- `metadata-backups.mjs:1`

`xapi/index.mjs` **also** has, at line 25, `import { asyncMap } from '@xen-orchestra/async-map'`.

The four calls that need a change:

1. `redis.mjs`, `rebuildIndexes()`, line 121. `redis` is the node-redis v4 client, and
   `sMembers` returns `Promise<string[]>`:
   ```js
       await asyncMapSettled(redis.sMembers(idsIndex), async id => {
   ```
2. `xapi/index.mjs`, `createBondedNetwork()`, line 1399. `pifsByHost` is built just above it as
   `const pifsByHost = {}` with `pifsByHost[pif.host] = []` / `.push(pif.$ref)`. It is a plain object
   mapping a host ref to an array of PIF refs:
   ```js
   await asyncMapSettled(pifsByHost, pifs => this.call('Bond.create', network.$ref, pifs, '', bondMode))
   ```
3. `jobs/index.mjs`, in the constructor, lines 89–90. `this._jobs` is a `JobsDb` (redis
   `Collection`). `Collection#get` is an `async` method, so it returns `Promise<Array>`:
   ```js
       app.on('plugins:registered', () =>
         asyncMapSettled(this._jobs.get(), job => {
   ```
4. `metadata-backups.mjs`, `createMetadataBackupJob(props, schedules)`, line 170. `schedules` is a
   plain object keyed by temporary id. The API schema is `type: 'object'` and the field is required.
   xo-web sends `mapValues(schedules, …)`. The iteratee reads the **key** as its second parameter:
   ```js
       await asyncMapSettled(schedules, async (schedule, tmpId) => {
   ```

Every other call in these files already passes an array, so only the import changes for them:

- `redis.mjs` (lines 116, 125, 203, 233, 338): `indexes`, an array set by the constructor default
  `indexes = []`.
- `redis.mjs:334`: `ids`, always an array in `_remove`.
- `xapi/index.mjs:310`: `pluggedPbds`, the result of `.filter`.
- `xapi/index.mjs:781`: an array literal.
- `xapi/index.mjs:1205`: `vdi.$VBDs`, a xen-api ref-array getter, which always returns an array.
- `metadata-backups.mjs:73`: `remoteIds`, from `unboxIdsFromPattern`, which returns an array.
- `metadata-backups.mjs:81`: `[...servers]`.
- `metadata-backups.mjs:193`: `schedules` from `getAllSchedules()`. This is an array, unlike the one
  at line 170.

## The change

1. **Imports.**
   - In `redis.mjs`, `jobs/index.mjs` and `metadata-backups.mjs`, replace the legacy line in place
     with `import { asyncMapSettled } from '@xen-orchestra/async-map'`.
   - In `xapi/index.mjs`, **delete** the legacy line (line 9). Then change the existing
     `import { asyncMap } from '@xen-orchestra/async-map'` line (line 25 before the deletion) to
     `import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'`. Two import lines for the
     same specifier would trip `import/no-duplicates`.
2. **`rebuildIndexes`:**
   ```js
       await asyncMapSettled(await redis.sMembers(idsIndex), async id => {
   ```
   A rejection of `sMembers` still propagates: legacy only passed an `onFulfilled` to `then`.
3. **`createBondedNetwork`:**
   ```js
   await asyncMapSettled(Object.values(pifsByHost), pifs => this.call('Bond.create', network.$ref, pifs, '', bondMode))
   ```
   At its 4-space indent the line is exactly 120 columns, so prettier keeps it on one line.
   `lodash/map` walks a plain object in `Object.keys` order, so the order is unchanged.
4. **`plugins:registered` listener:** make the arrow `async` and await inside it. Only these two lines
   change; the 16-line body stays as it is:

   ```js
       app.on('plugins:registered', async () =>
         asyncMapSettled(await this._jobs.get(), job => {
   ```

   `EventEmitter#emit` discards the listener's return value, so returning a promise changes nothing
   for the caller.

   This is the one accepted difference in this step. If `this._jobs` were undefined when the event
   fires, the `TypeError` would become a rejected promise instead of a synchronous throw. It can't
   happen. `_jobs` is assigned synchronously by the `core started` listener in the same constructor.
   `Hooks#startCore` emits that event (`@xen-orchestra/mixins/Hooks.mjs`) before `hooks.start()`
   runs, and `packages/xo-server/src/index.mjs` emits `plugins:registered` only after
   `registerPlugins`. Say so in the commit body.
   Don't use `this._jobs.get().then(jobs => …)` instead: it would re-indent the whole body for no
   behavioural gain.

5. **`createMetadataBackupJob`:**
   ```js
       await asyncMapSettled(Object.entries(schedules), async ([tmpId, schedule]) => {
   ```
   The body is unchanged. It still uses `schedule` and `tmpId` under the same names.
6. **`CHANGELOG.unreleased.md`:** in the packages block, add `- xo-server patch` in alphabetical
   position (after any `@…` lines). If an `xo-server` line already exists, leave it.

**Not this step's job:**

- the other six xo-server files that import `legacy` (step 1.2);
- `xo-server-usage-report` (step 1.3);
- anything in `@xen-orchestra/async-map` itself (step 2.1).

Don't touch the bugs listed as out of scope in the README, even `deleteMetadataBackupJob` in this
same file.

Commit subject: `refactor(xo-server): drop legacy asyncMapSettled where calls pass a promise or an object`

## Verify

```sh
npx prettier --write packages/xo-server/src/collection/redis.mjs packages/xo-server/src/xapi/index.mjs \
  packages/xo-server/src/xo-mixins/jobs/index.mjs packages/xo-server/src/xo-mixins/metadata-backups.mjs

# none of these may match any more; each command must print nothing
rg -n "async-map/legacy" packages/xo-server/src/collection/redis.mjs packages/xo-server/src/xapi/index.mjs \
  packages/xo-server/src/xo-mixins/jobs/index.mjs packages/xo-server/src/xo-mixins/metadata-backups.mjs
rg -nF 'asyncMapSettled(redis.sMembers' packages/xo-server/src
rg -nF 'asyncMapSettled(this._jobs.get()' packages/xo-server/src
rg -nF 'asyncMapSettled(pifsByHost,' packages/xo-server/src
rg -nF '(schedule, tmpId)' packages/xo-server/src/xo-mixins/metadata-backups.mjs

# exactly one import line from the main entry point in xapi/index.mjs, naming both functions
rg -n "from '@xen-orchestra/async-map'" packages/xo-server/src/xapi/index.mjs

yarn workspace xo-server build
yarn workspace xo-server test          # 383 pass, 0 fail
for f in collection/redis.mjs xapi/index.mjs xo-mixins/jobs/index.mjs xo-mixins/metadata-backups.mjs; do
  node --input-type=module -e "await import('./packages/xo-server/dist/$f')" && echo "ok $f"
done
npx eslint --ignore-path .gitignore packages/xo-server/src/collection/redis.mjs packages/xo-server/src/xapi/index.mjs \
  packages/xo-server/src/xo-mixins/jobs/index.mjs packages/xo-server/src/xo-mixins/metadata-backups.mjs
./scripts/gen-deps-list.js --check-order
```

All four imports must print `ok`. ESLint must report 0 errors.
