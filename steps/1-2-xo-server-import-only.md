# 1.2 — xo-server: drop legacy asyncMapSettled from the remaining files

After 1.1, six xo-server files still import `legacy`. Every one of their 11 calls passes an array to a
one-argument arrow function, so only the import line changes. This step is mechanical, which is why it
is kept out of 1.1's diff.

## Files to touch

- `packages/xo-server/src/api/vm.mjs`
- `packages/xo-server/src/xo-mixins/jobs/execute-call.mjs`
- `packages/xo-server/src/xo-mixins/scheduling.mjs`
- `packages/xo-server/src/xo-mixins/resource-sets.mjs`
- `packages/xo-server/src/xo-mixins/vmware/index.mjs`
- `packages/xo-server/src/xo-mixins/backups-ng/index.mjs`

`CHANGELOG.unreleased.md` is not touched: 1.1 already added `- xo-server patch`.

## Current behavior

Each file has exactly one line
`import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'`:

- line 6 of `api/vm.mjs`;
- line 5 of `vmware/index.mjs`;
- line 1 of the other four files.

None of these files imports anything else from `@xen-orchestra/async-map`. (`backups-ng/index.mjs`
imports `asyncEach` from `@vates/async-each`, which is a different package.)

What each call passes:

| call                           | collection                               | source                                                                              |
| ------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `api/vm.mjs:458`               | `vm.snapshots`                           | an array of ids: `link(obj, 'snapshots')` in `xapi-object-to-xo.mjs` over a ref set |
| `jobs/execute-call.mjs:62`     | `paramsFlatVector`                       | `[{}]`, or `resolveParamsVector(...)`, see below                                    |
| `scheduling.mjs:52`            | `schedules`                              | the config importer; a JSON round-trip of `db.get()`, which is an array             |
| `resource-sets.mjs:471`        | `subjects`                               | `set.subjects \|\| []` in `normalize`                                               |
| `vmware/index.mjs:124`, `:260` | `['start', 'start_on']`                  | literal                                                                             |
| `backups-ng/index.mjs:261`     | `[...targetRemoteIds, job.sourceRemote]` | literal                                                                             |
| `backups-ng/index.mjs:284`     | `[...servers]`                           | literal (a spread Set)                                                              |
| `backups-ng/index.mjs:423`     | `tmpIds`                                 | `Object.keys(schedules)`                                                            |
| `backups-ng/index.mjs:487`     | `schedules`                              | `getAllSchedules()`, an array                                                       |
| `backups-ng/index.mjs:502`     | `Object.entries(backupsByRemote)`        | already an array of pairs, destructured from the single argument                    |

`execute-call.mjs` needs a closer look. `paramsVector ? resolveParamsVector.call(app, paramsVector) : [{}]`
yields an array for every top-level type xo-web sends:

- `crossProduct` → `thunkToArray(...)`;
- `fetchObjects` → lodash `filter`;
- `map` → lodash `map`;
- `set` → its `values`.

xo-web always sends `crossProduct` (`xo-app/jobs/new/index.js`, `xo-app/backup/new/sequence/index.js`).

## The change

In each of the six files, replace the legacy line **in place** with
`import { asyncMapSettled } from '@xen-orchestra/async-map'`. Nothing else changes: no call, no
iteratee.

One accepted difference goes in the commit body. The API schema only checks that
`paramsVector.type` is a string, so a hand-crafted job can reach two malformed cases:

- a top-level `{ type: 'set' }` with no `values`. Legacy silently ran zero calls; the new function
  rejects with a `TypeError`, so the job run fails.
- a top-level `extractProperties`, which yields a plain object. Legacy mapped over its values; the new
  function also rejects.

No guard is added. Neither shape is a valid job, and failing loudly beats silently doing nothing.

**Not this step's job:**

- `xo-server-usage-report` (step 1.3);
- `@xen-orchestra/async-map` (step 2.1);
- replacing `[...servers]` with `servers`;
- the `schedule.id === id` comparison in `deleteBackupNgJob`, and its missing `return`;
- the `this._start(schedule.id)` call in `scheduling.mjs`.

The README lists those bugs as out of scope.

Commit subject: `refactor(xo-server): drop legacy asyncMapSettled from the remaining files`

## Verify

```sh
FILES="packages/xo-server/src/api/vm.mjs packages/xo-server/src/xo-mixins/jobs/execute-call.mjs \
  packages/xo-server/src/xo-mixins/scheduling.mjs packages/xo-server/src/xo-mixins/resource-sets.mjs \
  packages/xo-server/src/xo-mixins/vmware/index.mjs packages/xo-server/src/xo-mixins/backups-ng/index.mjs"
npx prettier --write $FILES

rg -n "async-map/legacy" packages/xo-server/src      # must print nothing: xo-server is now fully off legacy
git diff --stat                                      # 6 files, 6 insertions(+), 6 deletions(-)

yarn workspace xo-server build
yarn workspace xo-server test                        # 383 pass, 0 fail (includes jobs/execute-call.test.mjs)
for f in api/vm.mjs xo-mixins/jobs/execute-call.mjs xo-mixins/scheduling.mjs xo-mixins/resource-sets.mjs \
         xo-mixins/vmware/index.mjs xo-mixins/backups-ng/index.mjs; do
  node --input-type=module -e "await import('./packages/xo-server/dist/$f')" && echo "ok $f"
done
npx eslint --ignore-path .gitignore $FILES           # 0 errors; the vmware require-atomic-updates warning is pre-existing
```

All six imports must print `ok`.
