# POC results — `xapi-object-to-xo` in the browser

Fixture-only (no host available). Everything below is reproducible from this worktree.

## Decision

The migration plan (`WEB-SHARED-MIGRATION-PLAN.md`) **moves the transform as-is** into
`@xen-orchestra/xapi-object-to-xo`, used by both xo-server and Lite. No rewrite of the transforms.

This POC now demonstrates that shape: the moved transform, typed output, a read path with no XAPI write, and a Lite
cache that follows the plan's performance rules (§4).

## Verdict

| Question                                              | Answer                                                   |
| ----------------------------------------------------- | -------------------------------------------------------- |
| Can the translation run in a browser?                 | **Yes**                                                  |
| Can XO Lite feed it the input it expects?             | **Yes**, `wrapRecord` + one incrementally updated lookup |
| Can a component holding an XO object still call XAPI? | **Yes**, `_xapiRef` is enough and is already typed       |
| Is it a good idea?                                    | **Yes, as moved code** — see Decision                    |

## 1. Evidence

| Check                                                                | Result                           |
| -------------------------------------------------------------------- | -------------------------------- |
| `@xen-orchestra/xapi-object-to-xo` unit tests (happy-dom)            | **33 pass**                      |
| Built bundle run in a bare `node:vm` sandbox, no `process`/`Buffer`… | **pass**                         |
| Vite bundle, no polyfills, no externals                              | **52 kB gzip**, no Node builtins |
| XO Lite `type-check` (`vue-tsc`)                                     | **clean**                        |
| XO Lite production build                                             | **clean**                        |
| xo-server test suite, both callers repointed                         | **419 pass, 0 fail**             |
| Repo lint                                                            | **clean** on POC files           |

## 2. What the package changes vs master's transform

The moved file (1155 lines, master 1172) differs from `packages/xo-server/src/xapi-object-to-xo.mjs` only by:

| Change                       | Why                                                                    |
| ---------------------------- | ---------------------------------------------------------------------- |
| import block                 | points at local copies of the pure helpers (see §4)                    |
| `cores-per-socket` write     | moved to xo-server's caller (`xen-servers.mjs`), a read must not write |
| `ensureArray` on restriction | bug fix, see §5                                                        |

Copied helpers diverge from their originals only where a browser requires it: `parseXml` (no `Buffer`), `_xoData`
(plain `if … throw` instead of `node:assert`), `_log` (console instead of `@xen-orchestra/log`).

## 3. Lite side

- `wrapRecord` (port of `_wrapRecord`, `packages/xen-api/index.mjs:1666`) and an incremental `createXapiGraph`
  (`setRecord` / `deleteRecord`).
- `xo-object-graph.composable.ts`: one lookup fed by XAPI `add`/`mod`/`del`/`afterLoad` events; translation on first
  read; results in a `shallowReactive` Map; a change forgets that ref plus its `dependents` (metrics). Nothing returned
  until the 12 stores are ready. Raw records are never made reactive.
- `xapiObjectToXo` output is typed against `@vates/types` (`vm` → `AnyXoVm`, `host` → `XoHost`…); Lite narrows on
  `type === 'VM'`, no cast.

## 4. Remaining costs

| Cost                                   | Detail                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| **7 helper files are copies**          | POC shortcut. The plan moves the originals instead                                        |
| **All-or-nothing payload**             | 52 kB gzip covers all 23 transforms                                                       |
| **Missing stores**                     | Lite has no `vgpu`/`vgpu_type`/`gpu_group`/`sm`/`host_patch`; those links are `undefined` |
| **CJS deps break the dev server only** | `@vates/obfuscate` needs Lite's `optimizeDeps.include`; CI does not catch this class      |
| **Not measured on a real pool**        | Plan §4 targets (<150 ms full, <1 ms per change) still need a live host                   |

## 5. Bugs found in master, fixed here

1. The transform threw on a VM whose `recommendations` holds exactly one `<restriction>` (fast-xml-parser returns an
   object, not an array). Fixed with `ensureArray`, covered by tests.
2. `@vates/types` declared `xentools?`; the transform emits `xenTools` (all consumers read `xenTools`). Type renamed
   and its shape corrected (numbers, not nullable).

## 6. Reproducing

```
yarn install
cd @xen-orchestra/xapi-object-to-xo && yarn test   # builds the bundle first
cd @xen-orchestra/lite && yarn type-check && yarn build-only
cd packages/xo-server && yarn build && yarn test
```

A fresh worktree needs `turbo run build --filter xo-server` once, or xo-server's tests fail on unbuilt workspace deps.

## 7. Map

| Path                                                                 | What                                      |
| -------------------------------------------------------------------- | ----------------------------------------- |
| `@xen-orchestra/xapi-object-to-xo/xapi-object-to-xo.mjs`             | the transform, moved with `git mv`        |
| `@xen-orchestra/xapi-object-to-xo/_*.mjs`                            | copied pure helpers                       |
| `@xen-orchestra/xapi-object-to-xo/index.d.ts`                        | output typed against `@vates/types`       |
| `@xen-orchestra/xapi-object-to-xo/browser/`                          | `wrapRecord` port, incremental graph      |
| `@xen-orchestra/xapi-object-to-xo/test/`                             | fixture, 33 tests, sandboxed-bundle proof |
| `packages/xo-server/src/xo-mixins/xen-servers.mjs`                   | now owns the `cores-per-socket` write     |
| `@xen-orchestra/lite/src/composables/xo-object-graph.composable.ts`  | lookup + lazy cache                       |
| `@xen-orchestra/lite/src/components/vm/system/VmGeneralInfo.vue`     | ported to `XoVm`                          |
| `@xen-orchestra/lite/src/components/vm/system/VmPocPowerActions.vue` | XAPI calls from `_xapiRef` only           |
