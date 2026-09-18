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

## Reactive state a component reads for itself

`vi.hoisted` cannot build a `ref`: the factory runs before the imports, so `vue` is not loaded yet. State the test needs to **write** therefore lives at module scope, and the `vi.mock` factory returns an arrow that reads it — the arrow only runs when the component mounts, by which time the module has finished evaluating:

```typescript
// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})
```

Most dashboard cards take their data as a prop (`:pool-dashboard`, `:vm-dashboard`) and need no mock at all. The site ones call `useXoSiteDashboard()` themselves, so each of their tests stubs it — `src/test/create-site-dashboard-mock.ts` builds that stub once, with a `reset()` for `beforeEach`.

Its `mountCard` then mounts a card over a dashboard built by `createSiteDashboard`, so a test only names the section it cares about:

```typescript
const mountPoolsStatus = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardPoolsStatus, overrides)

const wrapper = mountPoolsStatus({ poolsStatus: undefined }) // still loading
```

The two repository cards read a formatted section (`storageRepositoriesFormatted`, `backupRepositoriesFormatted`) rather than `dashboard`, so they set that ref and mount on their own.

Mocking is not optional here: an unmocked remote-resource collection opens an SSE subscription, and `EventSource` does not exist in `happy-dom`. It surfaces as an **unhandled rejection**, so Vitest exits non-zero while reporting every test as passed.

## Network

`src/test/setup.ts` stubs the global `fetch` with a never-settling promise, so composables that trigger remote requests on use never hit the network in unit tests. Override it locally with `vi.stubGlobal('fetch', …)` when a test needs a real response.
