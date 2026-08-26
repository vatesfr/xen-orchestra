# Setup: prefer helpers over `beforeEach`

Reserve `beforeEach` for **mock resets only**. Repeated setup goes into small local helper/factory functions at the top of the file:

A composable mounted with different fixture overrides across a file gets one helper taking those overrides — never a `mountComposable(...)` call repeated per test:

```typescript
function mountVmUtils(overrides: Partial<FrontXoVm> = {}) {
  return mountComposable(() => useXoVmUtils(createVm(overrides))).wrapper.vm
}

it('is true while a state-changing operation is pending', () => {
  const result = mountVmUtils({ current_operations: { task1: VM_OPERATIONS.CLEAN_REBOOT } })

  expect(result.isChangingState).toBe(true)
})
```

Two cases legitimately stay inline: a **reactivity** test, which needs a `ref` it can reassign, and a test that must call `useI18n()` _inside_ the `setup` callback to build its expected value (see [Testing composables](./testing-composables.md)).

Because mocks are read lazily, calling `getX.mockReturnValue(...)` in the test body _before_ invoking the helper still takes effect.

This applies to **navigation into the result** too, not only to mounting. An expression such as `result.filterableServers[0]`, repeated across a `describe` block, is repeated setup — give it a helper and assert on a named local, rather than re-deriving it in every test.

The exception is a **reactivity** test: it must keep the live `wrapper` so it can re-read through `wrapper.vm` after reassigning the source ref. A helper returning a snapshot of the first item would defeat the test.

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

Types are inferred from the composable itself, so `filterableServer` is a `ServerFilterableData` and `mountFirstDisplayData()` a `ServerDisplayData` — no annotation at the call site. `mountEnhancedData` returns the mounted instance, for the reactivity test.

Adding a new `use<X>EnhancedData` test means three lines of wiring, not three copied helpers.
