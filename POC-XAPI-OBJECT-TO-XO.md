# POC — running `xapi-object-to-xo` in the browser

**Goal:** answer the feasibility questions. Throwaway code. Nothing ships.
**Representative object:** VM (283 of the 1169 lines, links to host/pool/VBD/VDI/SR/VIF/VTPM/VGPU/metrics/guest_metrics).

## 1. Obstacles on the card — verified

| Card claim | Verdict | Detail |
|---|---|---|
| Input is xen-api's enriched object, not a raw record | **Confirmed** | Needs `$id` `$ref` `$type` `$pool` `$xapi` + lazy `$<field>` link getters |
| XO Lite stores raw records | **Confirmed** | `buildXoObject()` only adds `$ref`; zero `$`-props in `libs/xen-api/` |
| Node-only deps to audit | **Mostly a non-issue for VM** — see §2 | `@vates/obfuscate` is `pbd`-only, not VM |
| `utils.mjs` pulls `tmp`/`crypto`/`path`/`highland` | **Confirmed, avoidable** | Only 5 helpers used, all pure; the node deps are siblings in the same file |
| Plain JS, no types | **Confirmed** | But `XoVm` already exists in `@vates/types/src/xo.mts:825` → type the output against it |
| Output frozen, exposes `_xapiRef` | **Confirmed** | `_xapiRef` is enumerable; Lite's `xenApi.vm.*` already take `$ref` → plug-compatible |
| Callers to keep working | **Confirmed** | `xo-mixins/xen-servers.mjs:24`, `api/network.mjs:1` — both `import xapiObjectToXo from '../xapi-object-to-xo.mjs'` |

### Not on the card — found while auditing

| Finding | Impact |
|---|---|
| **The VM transform performs a XAPI write.** When `platform['cores-per-socket']` is absent it calls `obj.update_platform(...)` (line ~590) | The transform is not pure. Neutralize in the POC; flag as a blocker for any real extraction |
| `getCurrentOperations()` calls `$xapi.getObjectByRef()` | The façade must expose a real ref lookup, not a stub |
| Lite has **no `vgpu` store** | `link(obj, 'VGPUs')` returns `[]`; acceptable for the POC |
| Lite already hand-copied `getVmGuestToolsProps` into `modules/vm/utils/vm.util.ts:25` | Direct evidence the duplication is already happening |

## 2. Browser-safety audit — VM path only

| Dependency | Verdict |
|---|---|
| `_ensureArray`, `_extractIpFromVmNetworks`, `_normalizeVmNetworks` | Pure, copy as-is |
| `utils.mjs` → `extractProperty` `forEach` `isEmpty` `mapFilter` `parseXml` | Pure (lodash + `fast-xml-parser`). **Copy the 5, don't import the module** — the file's `tmp`/`crypto`/`path`/`highland` imports are what poison it |
| `xapi/utils.mjs` → `getVmDomainType` `isVmRunning` `useUpdateSystem` | Pure (lodash + `semver`), but the module imports `../utils.mjs` → copy the 3 |
| `@xen-orchestra/xapi` → `parseDateTime` `isDefaultTemplate` | `isDefaultTemplate.mjs` is a 1-line standalone file. `parseDateTime` lives in `index.mjs`, which imports `xen-api` (node) → **copy it** (~30 lines, `d3-time-format` is browser-safe) |
| `@xen-orchestra/xapi/xoData.mjs` | Imports `node:assert/strict` → Vite alias or copy |
| `@xen-orchestra/log` | Stub `createLogger` → `console` |
| `semver`, `compare-versions` | Browser-safe |

**Conclusion to confirm by running:** no genuinely node-only logic on the VM path. The blockers are *module-level* imports, not the code itself.

## 3. Approach — the one real decision

The input problem is the whole POC. Two ways:

- **A. Port `_wrapRecord`** (`packages/xen-api/index.mjs:1641`, ~110 lines, fully generic). It needs only a small façade: `_objectsByRef`, `_RecordsByType`, `call`, `callAsync`, `setField`, `setFieldEntry(-ies)`, `pool`, plus `Ref.is`.
- B. Hand-write a VM-shaped adapter (~40 lines, VM-only).

**Take A.** B proves the VM transform runs; A proves the *approach* generalizes, which is the actual question. A is barely bigger and reuses the real code path rather than a bespoke mock.

Lite gives it what it needs: every store already exposes `getByOpaqueRef`; the façade federates the ~12 stores the VM path touches into one `objectsByRef` lookup.

## 4. Steps

| # | Step | Deliverable |
|---|---|---|
| 1 | New package `@xen-orchestra/xapi-object-to-xo`: `xapi-object-to-xo.mjs` + the copied pure helpers, no build step (mirror web-core: raw `./lib/*` via `exports`) | Imports cleanly in Node |
| 2 | Point xo-server's 2 callers at it; `yarn test` xo-server | xo-server unchanged |
| 3 | Port `_wrapRecord` + `Ref` into the package under `browser/` | — |
| 4 | Lite: `useXapiFacade()` — federated `objectsByRef` over the ~12 VM-path stores + `call` delegating to `XenApi` | — |
| 5 | Debug page `/story/xo-object` — dump `xapiObjectToXo(wrap(vm))` side by side with the raw record, and diff against the `XoVm` type | **Q1 + Q2 answered** |
| 6 | Port `VmGeneralInfo.vue` to consume the XO object | Read path proven; also *shrinks* — `os_version` and `pvDriversVersion` come free, dropping its `useVmGuestMetricsStore` lookup |
| 7 | Port `VmActionPowerStateItems.vue` to call `xenApi.vm.start(vm._xapiRef)` | **Q3 answered** |
| 8 | Write up findings + recommendation | **Q4 answered** |

Steps 1–2 are safe and reversible. Steps 3–5 carry the risk. **Stop and reassess after step 5** — if the object graph can't be fed, 6–8 are moot.

## 5. Answering the questions

| Question | Answered by | What counts as an answer |
|---|---|---|
| Can the translation run in a browser? | 5 | Lite dev server renders the dump with no bundler error and no node shim beyond `xoData`'s `assert` |
| Can XO Lite feed it the input it expects? | 5 | Output matches `XoVm`; links resolve to ids, not `OpaqueRef:` strings |
| Can a component holding an XO object still call XAPI? | 7 | Start/stop works from `_xapiRef` alone |
| Is it a good idea? | 8 | Recommendation + the cost of the graph layer, the write side effect, and the untyped surface |

## 6. Out of scope

Other 22 transforms · reactivity/perf of the graph layer · `dependents`/retry in `xen-servers.mjs` · typing the transform · Lite's own object model migration.

## 7. Known costs

- Fresh worktree → full `yarn install` before Lite can run.
- Step 5 onward needs a **live XCP-ng/XenServer host** for Lite to connect to. Fallback: capture one `VM.get_all_records` dump as a fixture and run the translation against it — answers Q1/Q2 but not Q3.
