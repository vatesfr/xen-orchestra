# Testing

This guide documents the unit-testing conventions used in `@xen-orchestra/web`, as established across the `pool`, `host` and `vm` modules. Follow it when adding tests for a new module, composable or utility.

## Test runner and projects

Testing uses **Vitest 4**, configured with two projects (see `vite.config.ts`):

| Project   | File pattern           | Environment             | Purpose                                             |
| --------- | ---------------------- | ----------------------- | --------------------------------------------------- |
| `unit`    | `**/*.unit.test.ts`    | `happy-dom`, no browser | Fast, CLI-only. All business-logic tests live here. |
| `browser` | `**/*.browser.test.ts` | Playwright / Chromium   | Real-DOM / UI tests only (rendered components).     |

Almost everything belongs in the `unit` project. Reach for a `browser` test only when a real DOM is genuinely required.

### Running tests

```sh
# From the repository root — run the whole unit suite
cd @xen-orchestra/web && yarn vitest run --project unit

# Run a single module's tests
cd @xen-orchestra/web && yarn vitest run --project unit src/modules/host/

# Watch mode while developing
cd @xen-orchestra/web && yarn vitest --project unit src/modules/vm/
```

There is no `test-unit` script — always target a project with `--project unit`.

## File layout and naming

- A test file lives **next to** the file it covers, named `<source-name>.unit.test.ts`.
  - `xo-host.util.ts` → `xo-host.util.unit.test.ts`
  - `use-pool-enhanced-data.composable.ts` → `use-pool-enhanced-data.composable.unit.test.ts`
- Shared test data **factories** and helpers live in `src/test/`.

## Structuring a test file

- **One `describe` block per function or exposed property**, labelled with its exact name (`describe('getHostInfo')`, `describe('powerState')`).
- Use `test` (not `it`).
- Test names read as a **present-tense assertion**, lowercase, no trailing period, and **without a redundant prefix** — the `describe` label already carries the function name.

```typescript
describe('getHostCoreSocketInfo', () => {
  test('formats the core count with its socket count', () => {
    const host = createHost({ cpus: { cores: 8, sockets: 2 } })

    expect(getHostCoreSocketInfo(host)).toBe('8 (2)')
  })

  test('falls back to zero for missing core and socket counts', () => {
    const host = createHost({ cpus: {} })

    expect(getHostCoreSocketInfo(host)).toBe('0 (0)')
  })
})
```

### Do not import from `vitest`

`globals: true` (in `vite.config.ts`) together with `"types": ["vitest/globals"]` (in `tsconfig.app.json`) make `describe`, `test`, `expect`, `vi` and `beforeEach` available globally. **Never** add `import { ... } from 'vitest'`.

### Setup: prefer helpers over `beforeEach`

Reserve `beforeEach` for **mock resets only**. Repeated setup goes into small local helper/factory functions at the top of the file:

A composable mounted with different fixture overrides across a file gets one helper taking those overrides — never a `mountComposable(...)` call repeated per test:

```typescript
function mountVmUtils(overrides: Partial<FrontXoVm> = {}) {
  return mountComposable(() => useXoVmUtils(createVm(overrides))).result
}

test('is true while a state-changing operation is pending', () => {
  const result = mountVmUtils({ current_operations: { task1: VM_OPERATIONS.CLEAN_REBOOT } })

  expect(result.isChangingState.value).toBe(true)
})
```

Two cases legitimately stay inline: a **reactivity** test, which needs a `ref` it can reassign, and a test that must call `useI18n()` _inside_ the `setup` callback to build its expected value.

Because mocks are read lazily, calling `getX.mockReturnValue(...)` in the test body _before_ invoking the helper still takes effect.

This applies to **navigation into the result** too, not only to mounting. An expression such as `result.filterableServers.value[0]`, repeated across a `describe` block, is repeated setup — give it a helper and assert on a named local, rather than re-deriving it in every test.

The exception is a **reactivity** test: it must keep the live `result` so it can re-read the computed after reassigning the source ref. A helper returning a snapshot of the first item would defeat the test.

### Shared helpers: `use<X>EnhancedData`

When several modules test the _same shape_ of composable, the helpers belong in `src/test/`, not copy-pasted per module. The `use<X>EnhancedData` family (`usePoolEnhancedData`, `useVmEnhancedData`, … each backing a `<X>sTable.vue`) all expose a `filterable<X>s` computed plus a `getDisplayData`, so `src/test/create-enhanced-data-helpers.ts` builds their three helpers once. Only the name of the filterable list varies, so it is passed as a getter:

```typescript
const { mountEnhancedData, mountFirstFilterable, mountFirstDisplayData } = createEnhancedDataHelpers(
  usePoolEnhancedData,
  result => result.filterableServers,
  createServer
)

test('maps poolName from the server pool label', () => {
  const filterableServer = mountFirstFilterable([createServer({ poolNameLabel: 'Production Pool' })])

  expect(filterableServer.poolName).toBe('Production Pool')
})
```

Types are inferred from the composable itself, so `filterableServer` is a `ServerFilterableData` and `mountFirstDisplayData()` a `ServerDisplayData` — no annotation at the call site. `mountEnhancedData` returns the raw composable result, for the reactivity test.

Adding a new `use<X>EnhancedData` test means three lines of wiring, not three copied helpers.

## Test data factories

Domain objects are created through factories in `src/test/`, one per object type:

| Factory           | Builds          |
| ----------------- | --------------- |
| `createVm`        | `FrontXoVm`     |
| `createHost`      | `FrontXoHost`   |
| `createServer`    | `FrontXoServer` |
| `createVbd`       | `FrontXoVbd`    |
| `createVdi`       | `FrontXoVdi`    |
| `createHostStats` | `XapiHostStats` |

Shared _helper_ factories live there too — `mount-composable.ts` and `create-enhanced-data-helpers.ts`.

Each factory returns a **fully-populated** object of the real front-end type and accepts a `Partial<T>` of overrides, spread last, so a test only states the fields relevant to its case:

```typescript
const runningVm = createVm({ power_state: VM_POWER_STATE.RUNNING })
const host = createHost({ memory: { size: 8 * 1024 ** 3, usage: 3 * 1024 ** 3 } })
```

Rules:

- **Reuse factories, never duplicate** the object shape inline.
- Type fixtures from the real source types so they drift with production. For a shape local to one test, derive it — e.g. `type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]` — and write a small local `createStorageUsage` helper.
- Cast branded ids with the honest type (`'host-1' as XoHost['id']`), never `as never`.

## Testing pure utilities

Utility functions (`*.util.ts`) are pure — import and call them directly, and assert `input → output`. No mounting, no mocks.

```typescript
describe('buildHostCpuUsageSeries', () => {
  test('averages the usage across all cpus at each index', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [10, 20], cpu1: [30, 40] } } })

    expect(buildHostCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 20 },
      { timestamp: 1_000_000, value: 30 },
    ])
  })

  test('returns an empty array for null data', () => {
    expect(buildHostCpuUsageSeries(null)).toEqual([])
  })
})
```

Cover the meaningful edge cases: empty input, missing samples (`NaN` propagation), `null` data, and boundary rounding.

> **Prefer extracting pure logic into a util.** When a `<script setup>` holds non-trivial logic (chart series, formatting, aggregation), pull it into `modules/<mod>/utils/*.util.ts` and unit-test that, rather than writing a headless component test. This is how the Pool and Host dashboard chart logic was made testable (`xo-pool-dashboard.util.ts`, `xo-host-dashboard.util.ts`).

## Testing composables

A composable that relies on a Vue context (`useI18n`, `inject`, an effect scope, plugins) must run **inside a mounted component**. Use the `mountComposable` helper from `src/test/mount-composable.ts`, which mounts a throwaway component with the real `vue-i18n` instance and a fresh Pinia:

```typescript
import { mountComposable } from '@/test/mount-composable.ts'

const { result } = mountComposable(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.RUNNING })))

expect(result.powerState.value.icon).toBe('status:running-circle')
expect(result.powerState.value.text).toBe('Running')
```

Because the real i18n instance is installed, assertions check the **actual translated strings** (`'Running'`, `'Not running'`, `'Unknown'`).

### Reactivity

To test that a composable reacts to its source, pass a `ref` and reassign it:

```typescript
const vm = ref(createVm({ power_state: VM_POWER_STATE.RUNNING }))
const { result } = mountComposable(() => useXoVmUtils(vm))

expect(result.powerState.value.icon).toBe('status:running-circle')

vm.value = createVm({ power_state: VM_POWER_STATE.HALTED })

expect(result.powerState.value.icon).toBe('status:halted-circle')
```

### Composables whose returned function calls `useI18n` / `inject`

`useI18n()` must be called synchronously during a component `setup()`. If a composable returns a function that _itself_ calls `useI18n` (e.g. `useXoHostUtils().getRelativeStartTime`), you cannot call that function from the test body after `mountComposable` has returned — it throws `Must be called at the top of a 'setup' function`. Invoke it **inside** the `mountComposable` callback instead:

```typescript
const relativeStartTime = mountComposable(() => useXoHostUtils().getRelativeStartTime(1660000000)).result

expect(typeof relativeStartTime.value).toBe('string')
```

Functions that only touch refs/computed (e.g. `getPowerState`) can be called on the returned object as usual.

## Mocking dependencies

Keep the mock boundary tight: **mock only the remote-resource collections / stores** a composable depends on, and let pure utilities and icon helpers run for real.

Use the **typed** mock form — `vi.mock(import('<module>'), …)` — so a rename breaks type-check instead of silently leaving a stale mock. Create the stub functions with `vi.hoisted` (a plain `const fn = vi.fn()` referenced in the factory throws, because the mock is hoisted above imports), and reset them in `beforeEach`:

```typescript
const { getHostById, isMasterHost } = vi.hoisted(() => ({
  getHostById: vi.fn(),
  isMasterHost: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById, isMasterHost })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  getHostById.mockReset()
  isMasterHost.mockReset()
})
```

Note the cast: the typed form checks the factory return against the **whole** module, so a partial mock of a large export needs `as unknown as typeof useX` (with an `import type { useX }`).

## Assert behaviour, not implementation

- Assert concrete outputs / contracts (`input → output`) so a refactor that preserves behaviour does not break the test.
- Every test must assert something meaningful — never re-assert a mock's own return value.
- Icon helpers are deterministic: `icon()` is identity and `objectIcon()` returns a plain string, so assert against them directly:

```typescript
expect(displayData.vmIcon).toBe(objectIcon('vm', 'running'))
expect(result.powerState.value.icon).toBe('status:running-circle')
```

## Network

`src/test/setup.ts` stubs the global `fetch` with a never-settling promise, so composables that trigger remote requests on use never hit the network in unit tests. Override it locally with `vi.stubGlobal('fetch', …)` when a test needs a real response.
