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

When several test files mock the same remote resource (a collection or a single resource) with the same shape, the mock lives once in `src/test/` and the test file only points `vi.mock` to it; its exported state is read and changed by the tests, and reset in `beforeEach`:

```typescript
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  vmCollectionMock.reset()
})
```

`vmCollectionMock.areVmsReady` is true after a reset; set it to false to hold the collection as still loading.

Collections always read together share one mock module exporting each of their composables: `mock-xo-destination-collections.ts` stands for the pool, host, SR, network, PBD, PIF and VM template collections. Each `vi.mock` of these modules points to it (`vi.mock` is hoisted, it cannot be wrapped in a helper), and `destinationCollectionsMock.reset()` resets them all. Its pool collection also answers `getPoolById` and `hasPoolById` from `pools`, its SR and network collections `getSrById` and `getNetworkById`, and `arePoolsReady`, `areSrsReady`, `areNetworksReady` and `areTemplatesReady` (true after a reset) let a test hold that collection as still loading.

The same goes for `mock-xo-v2v-vm-rows-collections.ts`, the VM, task and VM snapshot collections the V2V VM rows are built from: `v2vVmRowsCollectionsMock` holds `vms`, `tasks`, `snapshots` and their `are…Ready` flags (true after a reset; set one to false to hold that collection as still loading).

`mock-delete-modal.ts` stands for `useDeleteModal`, whose overlay a unit test cannot answer: `deleteModalMock.answer('onConfirm' | 'onCancel')` sets how the next confirmation is answered, `deleteModalMock.open` is the spy to read the props it was opened with, and `deleteModalMock.reset()` goes in `beforeEach`.

## Network

`src/test/setup.ts` stubs the global `fetch` with a never-settling promise before each test, so composables that trigger remote requests on use never hit the network in unit tests. When a test needs a real response, `stubFetchResponse(status, body)` from `src/test/stub-fetch-response.ts` overrides it for that test only and returns the mock, to assert the request when the request is the contract (a job).
