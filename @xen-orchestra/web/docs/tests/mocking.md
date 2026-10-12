# Mocking dependencies

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

## Resolving by id

When what a composable decides is _which_ records it looks up — the SR of a VDI, the VMs behind its VBDs — a canned `useGetXById.mockReturnValue(computed(() => sr))` hands back the expected record whatever id was asked for, so the test only echoes the mock. Implement the lookup over fixtures instead, the way the real collection filters by id, and assert the record the composable ends up with:

```typescript
useGetSrById.mockImplementation((id: MaybeRefOrGetter<FrontXoSr['id'] | undefined>) =>
  computed(() => srs.find(sr => sr.id === toValue(id)))
)
```

`use-vdi-configuration.composable.unit.test.ts` follows a VDI to its VBDs, then to their VMs, this way. A component test that only renders what it is handed keeps the canned `mockReturnValue`.

## Network

`src/test/setup.ts` stubs the global `fetch` with a never-settling promise, so composables that trigger remote requests on use never hit the network in unit tests. Override it locally with `vi.stubGlobal('fetch', …)` when a test needs a real response.
