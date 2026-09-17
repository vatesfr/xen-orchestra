# POC results — `xapi-object-to-xo` in the browser

Fixture-only (no host available). Everything below is reproducible from this worktree.

## Verdict

| Question | Answer |
|---|---|
| Can the translation run in a browser? | **Yes**, and it was the easy part |
| Can XO Lite feed it the input it expects? | **Yes**, via ~150 lines of object-graph glue |
| Can a component holding an XO object still call XAPI? | **Yes**, `_xapiRef` is enough and is already typed |
| Is it a good idea to go this way? | **Not as done here.** See §6 — same goal, better shape |

## 1. Evidence

| Check | Result |
|---|---|
| `@xen-orchestra/xapi-object-to-xo` unit tests (happy-dom) | **26 pass** |
| Built bundle run in a bare `node:vm` sandbox, no `process`/`Buffer`/`require`/`module` | **pass** |
| Translation run in a real browser against the Vite **dev** server | **pass** — 61-key frozen `XoVm`, console clean |
| Vite bundle, no polyfills, no externals | 213 modules, **52 kB gzip** |
| Node builtins in the bundle | **none** |
| XO Lite `type-check` (`vue-tsc`) | **clean** |
| XO Lite production build | **clean**, transform lands in the VM-system chunk |
| xo-server test suite, both callers repointed | **287 pass, 0 fail** |
| eslint on all POC files | **clean** |

## 2. Q1 — browser

No genuinely node-only *logic* on the VM path. Every blocker was a module-level import, fixed by copying the pure helper out:

| Original | Why it could not be imported |
|---|---|
| `xo-server/src/utils.mjs` | pulls `tmp`, `crypto`, `path`, `highland`; only 5 pure helpers are used |
| `xo-server/src/xapi/utils.mjs` | imports the above |
| `@xen-orchestra/xapi` | `index.mjs` imports the `xen-api` client (undici) |
| `@xen-orchestra/xapi/xoData.mjs` | `node:assert/strict` (2 call sites) |
| `@xen-orchestra/log` | node transports |

One real code change was needed: `parseXml` calls `Buffer.isBuffer`, a bare global that throws `ReferenceError` in a browser.

## 3. Q2 — feeding it the input

`_wrapRecord` (`packages/xen-api/index.mjs:1641`) ported almost verbatim — it is generic and needs only a façade (`getObjectByRef`, `pool`, `call`, `setField*`). XO Lite's side is one composable federating the 12 stores the VM path touches into a single `{ ref -> record }` registry.

Two divergences were required, both mechanical: drop the `addMethods` prototype walk (it harvests xo-server Xapi mixins that do not exist client-side), and strip `$ref`/`$id` from the field list (Lite's `buildXoObject()` puts `$ref` *inside* the record; assigning over the non-writable `$ref` throws in strict mode).

**Output fidelity:** 61 of `XoVm`'s 63 declared keys are produced. Every link is rewritten from `OpaqueRef:` to an XO id, asserted by a recursive walk over the whole output. The two absent keys are optional and simply not set for this VM.

## 4. Q3 — calling XAPI from an XO object

`_xapiRef` is declared on `BaseXapiXo`, so it is typed, not a back door. `VmPocPowerActions.vue` takes only an `XoVm`, holds no ref and touches no store, and drives start/reboot/shutdown from `vm._xapiRef`. One cast at the boundary: `_xapiRef` is `string`, Lite's operations take the branded `XenApiVm['$ref']`.

## 5. Costs this exposed

| Cost | Detail |
|---|---|
| **The transform is not pure** | The VM branch issues a XAPI *write* (`update_platform('cores-per-socket', …)`) when the platform key is missing. Guarded for the POC; a read path cannot keep it |
| **9 helper files had to be copied** | A fork of xo-server internals that will silently drift. Real extraction must *move* those helpers, touching `xo-server/src/utils.mjs` |
| **Graph rebuilt on every store change** | The POC composable is O(all records) per invalidation. Fine for a fixture, not for a real pool |
| **1169 untyped JS lines become shared** | Hand-written `.d.ts`, `xapiObjectToXo` returns `unknown` |
| **All-or-nothing payload** | 52 kB gzip covers all 23 transforms; Lite needs a handful |
| **Missing stores** | Lite has no `vgpu`/`vgpu_type`/`gpu_group`/`sm`/`host_patch`; links resolve to `undefined` |
| **CJS deps break the dev server only** | `@vates/obfuscate` is CJS and symlinked, so Vite does not pre-bundle it and dev serves bare `exports.x =` as ESM → `does not provide an export named 'default'`. The production build is fine, so this class of breakage does not show up in CI. Fixed by listing it in Lite's `optimizeDeps.include` |

## 6. Recommendation

Technically feasible, and browser-compatibility — the thing the card flagged as the main risk — turned out cheap. The real cost is elsewhere: to reuse this code Lite must re-implement and maintain xen-api's object graph, and the monorepo must carry a fork of five xo-server modules.

**Do not ship this shape.** The `$`-getter object graph exists only because the transform reaches for magic dynamic properties. Invert it:

- extract the **per-type transform functions** into a typed package, taking `(record, resolve)` where `resolve(ref)` is an explicit lookup
- callers supply `resolve`: xo-server from its xen-api cache, Lite from its stores
- move the 5 pure helpers out of `xo-server/src/utils.mjs` instead of copying them
- move the `cores-per-socket` write to its own caller-side concern

That removes the `_wrapRecord` port, the purity problem, most of the copied helpers, and lets Lite import only the types it uses. The POC's value is that it measures this: the translation logic itself is portable, the *access pattern* around it is not.

Worth confirming against a live host before deciding — the fixture is hand-built, and `current_operations` / task resolution is the one area it does not exercise.

## 7. Pre-existing bugs found (both in master, neither caused by the POC)

1. **`xapi-object-to-xo.mjs` throws on a VM whose `recommendations` XML holds exactly one `<restriction>`.** `fast-xml-parser` returns an object for a lone element and an array for several; `isFirmwareSupported` calls `.find()` unconditionally. Pinned by a test.
2. **`@vates/types/src/xo.mts:121` declares `xentools?`, the transform emits `xenTools`.** The type is wrong. Deprecated field, low impact.

## 8. Reproducing

```
yarn install
cd @xen-orchestra/xapi-object-to-xo && yarn build-poc-bundle && yarn test
cd @xen-orchestra/lite && yarn type-check && yarn build-only
cd packages/xo-server && yarn build && yarn test
```

A fresh worktree needs `turbo run build --filter xo-server` once, or xo-server's tests fail on unbuilt workspace deps (unrelated to this work).

## 9. Map

| Path | What |
|---|---|
| `@xen-orchestra/xapi-object-to-xo/xapi-object-to-xo.mjs` | the transform, verbatim but for the import block and the write guard |
| `@xen-orchestra/xapi-object-to-xo/_*.mjs` | copied pure helpers, each with a header saying why |
| `@xen-orchestra/xapi-object-to-xo/browser/wrapRecord.mjs` | the `_wrapRecord` port |
| `@xen-orchestra/xapi-object-to-xo/browser/createXapiGraph.mjs` | façade builder, knows nothing of Lite |
| `@xen-orchestra/xapi-object-to-xo/test/` | fixture, 26 tests, sandboxed-bundle proof |
| `@xen-orchestra/lite/src/composables/xo-object-graph.composable.ts` | the 12-store federation |
| `@xen-orchestra/lite/src/components/vm/system/VmGeneralInfo.vue` | ported to `XoVm`; lost a store dep and a computed |
| `@xen-orchestra/lite/src/components/vm/system/VmPocPowerActions.vue` | XAPI calls from `_xapiRef` only |
| `@xen-orchestra/lite/src/pages/vm/[uuid]/system.vue` | both models side by side |
