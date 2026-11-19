# Setup helpers (XO 6)

The shared rules — helpers over `beforeEach`, auto-unmount — are in [Setup](../../../web-core/docs/tests/setup-helpers.md). XO 6 adds:

## Local storage

`src/test/setup.ts` stubs `fetch` (see [Mocking](./mocking.md#network)), calls `enableAutoUnmount(afterEach)` and clears `localStorage` before each test, so every test starts with an empty storage. Never clear it again in a test file: store what a test needs in its own setup (e.g. `seedV2vMigrationList`).

## Shared helpers: `use<X>EnhancedData`

When several modules test the _same shape_ of composable, the helpers belong in `src/test/`, not copy-pasted per module. The `use<X>EnhancedData` family (`usePoolEnhancedData`, `useVmEnhancedData`, … each backing a `<X>sTable.vue`) all expose a `filterable<X>s` computed plus a `getDisplayData`, so `src/test/create-enhanced-data-helpers.ts` builds their three helpers once. Only the name of the filterable list varies, so it is passed as a getter:

```typescript
const { mountEnhancedData, mountFirstFilterable, mountFirstDisplayData } = createEnhancedDataHelpers(
  usePoolEnhancedData,
  result => result.filterableServers,
  createServer
)

it('maps poolName from the server pool label', () => {
  const filterableServer = mountFirstFilterable([createServer({ poolNameLabel: 'Production Pool' })])

  expect(filterableServer.poolName).toBe('Production Pool')
})
```

Types are inferred from the composable itself, so `filterableServer` is a `PoolFilterableData` and `mountFirstDisplayData()` a `PoolDisplayData` — no annotation at the call site. `mountEnhancedData` returns the mounted instance, for the reactivity test.

Adding a new `use<X>EnhancedData` test means three lines of wiring, not three copied helpers.
