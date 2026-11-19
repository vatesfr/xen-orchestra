# Remove `@xen-orchestra/async-map/legacy`

One file per step. Each is self-contained: it names the files to touch, the current behavior, the
change, and how to verify. Read only the step you are doing.

`@xen-orchestra/async-map` is now TypeScript (`src/*.cts`, compiled by `tsc` to CommonJS `dist/*.cjs`).
It still ships a deprecated second entry point, `legacy`
(`src/legacy.cts`, `@deprecated Don't support iterables, please use new implementations`). 11 files
still import it, making 28 calls. This plan moves every one of those calls to the main
`asyncMapSettled`, then deletes `legacy`. That is a **major** bump for async-map, and it also drops the
package's `lodash` dependency, which only `legacy` uses.

## The two functions are not interchangeable

|                       | legacy (`import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'`)                                          | new (`import { asyncMapSettled } from '@xen-orchestra/async-map'`) |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| promise as collection | awaited first                                                                                                        | `for…of` on it → rejects with a TypeError                          |
| plain object          | mapped over its **values** (`lodash/map`)                                                                            | rejects with a TypeError                                           |
| `null` / `undefined`  | `[]`                                                                                                                 | rejects with a TypeError                                           |
| `Map` / `Set`         | `[]` (nothing runs)                                                                                                  | iterated                                                           |
| iteratee called with  | `(value, key, collection)`, `this` undefined                                                                         | `(item)`, `this` = the iterable                                    |
| both                  | wait for all to settle, reject with the first rejection, resolve in order, turn a synchronous throw into a rejection |                                                                    |

All 28 calls were classified before this plan was written. Each step lists what its calls pass. Trust
those lists; don't re-derive them. Only 4 calls need more than the import changed. They are all in step
1.1. Every iteratee is an arrow function, so the new `this` binding never matters.

## Steps

### Phase 1: move the callers

The steps run in order, one at a time. None runs in parallel: each one's Verify runs a babel build,
which needs the repo's `node_modules`, and an isolated worktree doesn't have them.

| Step | File                                                                  | What lands                                                                                                                                                                         |
| ---- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | [xo-server, calls needing a change](1-1-xo-server-non-array-calls.md) | `redis.mjs`, `xapi/index.mjs`, `jobs/index.mjs` and `metadata-backups.mjs` use the new import. Two promises are awaited, and two objects become `Object.values` / `Object.entries` |
| 1.2  | [xo-server, import-only files](1-2-xo-server-import-only.md)          | the other 6 xo-server files use the new import                                                                                                                                     |
| 1.3  | [xo-server-usage-report](1-3-usage-report.md)                         | the single call uses the new import                                                                                                                                                |

### Phase 2: delete `legacy`

This needs all of phase 1: afterwards, nothing in the repo may import `legacy`.

| Step | File                                  | What lands                                                                                                                 |
| ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2.1  | [remove legacy](2-1-remove-legacy.md) | `src/legacy*.cts`, its `exports` entries, `lodash` and `@types/lodash` are removed, and the changelog line becomes `major` |

## Shared conventions

- **Builds.** `xo-server` and `xo-server-usage-report` are babel packages, and their tests run from
  `dist/`, so build before testing:
  - `yarn workspace xo-server build`, then `yarn workspace xo-server test`. The baseline is 383 pass,
    0 fail. Redis isn't needed.
  - `yarn workspace xo-server-usage-report build`. It has no test script.
- **Smoke import.** A misspelled named import from a CommonJS package fails at ESM link time
  (`SyntaxError: Named export 'x' not found`), and only an import catches it. So after building
  xo-server:
  ```sh
  node --input-type=module -e "await import('./packages/xo-server/dist/<path>.mjs')"
  ```
  All 10 xo-server files this plan touches import cleanly at the start. Run from the repo root.
- **Lint.** Run root ESLint on the files you touched, not the whole repo:
  `npx eslint --ignore-path .gitignore <files>`. The baseline is 0 errors. The warning
  `require-atomic-updates` at `xo-mixins/vmware/index.mjs:241` is pre-existing; leave it.
  `import/no-duplicates` errors if one file imports `'@xen-orchestra/async-map'` on two lines.
- **Formatting.** Run `npx prettier --write <files>` on what you touched (`printWidth` 120, no
  semicolons).
- **Imports.** Replace the legacy import line **in place**, in the same slot. Don't reorder the rest of
  the import block.
- **`CHANGELOG.unreleased.md`.**
  - Only the `<!--packages-start-->` block changes. Add no prose bullet: no user can see this change.
  - Lines are `- <package> patch|minor|major`, in alphabetical order (scoped `@…` names sort first),
    with no duplicates.
  - If the package already has a line, keep the stronger bump (`major > minor > patch`); never
    downgrade one.
  - Check the order with `./scripts/gen-deps-list.js --check-order`.
- **Code comments.** None are needed. Every change here explains itself (`await`, `Object.values`,
  `Object.entries`), and the neighbouring code has no comments at these calls.
- **Commits.**
  - Subject: `type(scope): lowercase subject`, no trailing period, at most 100 characters. Each step
    gives its subject.
  - Body: what the old code relied on, why the change keeps behaviour identical, and any accepted
    difference.

## Deliberately out of scope for all of these

- **Bugs seen next to these calls.** Don't fix them, and don't "improve" them while you're there:
  - In `xo-mixins/scheduling.mjs`, the config importer calls `this._start(schedule.id)`, but
    `_start(schedule)` destructures `{ id }` from its argument.
  - `deleteMetadataBackupJob` (`metadata-backups.mjs`) and `deleteBackupNgJob` (`backups-ng/index.mjs`)
    compare `schedule.id === id`, where `id` is the **job** id, so they never match a schedule.
  - `deleteBackupNgJob` also doesn't return the `deleteSchedule` promise.
- Passing a `Set` (`servers`) straight to the new function instead of `[...servers]`: the spread is
  harmless, so leave it.
- A guard for malformed `paramsVector` in `jobs/execute-call.mjs`. Step 1.2 accepts that difference
  on purpose.
- `asyncMap` call sites, `packages/xo-server/src/_asyncMapValues.mjs`, and every other package that
  imports the main entry point: none of them uses `legacy`.
- `@vates/nbd-client` declares `@xen-orchestra/async-map` as a dependency but never imports it. It is a
  separate cleanup.
- Hand-adding dependent bumps (vhd-lib, backups, proxy, …) to the changelog: `gen-deps-list.js`
  derives them.
