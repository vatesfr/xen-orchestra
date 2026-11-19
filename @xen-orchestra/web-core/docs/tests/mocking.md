# Mocking dependencies

Keep the mock boundary tight: **mock only what reaches outside the code under test** (a remote resource, a store fed by the network, an overlay a unit test cannot answer), and let pure utilities and icon helpers run for real.

XO 6 test files never call `vi.mock`: they replace exports with `mockModule` over the global module mocks, see [XO 6 mocking](../../../web/docs/tests/mocking.md). The typed form, the partial-mock cast and the shared mock modules below apply to both packages.

Use the **typed** mock form — `vi.mock(import('<module>'), …)` — so a rename breaks type-check instead of silently leaving a stale mock. Create the stub functions with `vi.hoisted` (a plain `const fn = vi.fn()` referenced in the factory throws, because the mock is hoisted above imports), and reset them in `beforeEach`:

```typescript
const { sendCtrlAltDel } = vi.hoisted(() => ({
  sendCtrlAltDel: vi.fn(),
}))

vi.mock(import('@core/composables/remote-console.composable.ts'), () => ({
  useRemoteConsole: (() => ({ sendCtrlAltDel })) as unknown as typeof useRemoteConsole,
}))

beforeEach(() => {
  sendCtrlAltDel.mockReset()
})
```

Note the cast: the typed form checks the factory return against the **whole** module, so a partial mock of a large export needs `as unknown as typeof useX` (with an `import type { useX }`).

When several test files mock the same module with the same shape, the mock lives once in the package's test infrastructure (`test/` in web-core, `src/test/` in XO 6) and the test file only points `vi.mock` to it; its exported state is read and changed by the tests, and reset in `beforeEach`:

```typescript
vi.mock(import('@core/composables/remote-console.composable.ts'), () => import('@core-test/mock-remote-console.ts'))

beforeEach(() => {
  remoteConsoleMock.reset()
})
```

`vi.mock` is hoisted: it cannot be wrapped in a helper, so one `vi.mock(path, () => import(...))` line per file is the convention, not a duplication. XO 6's `mockModule` is not hoisted: each shared mock module exports the helper calling it, see [XO 6 mocking](../../../web/docs/tests/mocking.md).

The XO 6 shared mocks (remote-resource collections, modals, overlays) and the network stub are listed in [XO 6 mocking](../../../web/docs/tests/mocking.md).
