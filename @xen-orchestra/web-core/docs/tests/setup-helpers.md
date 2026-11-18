# Setup: prefer helpers over `beforeEach`

Reserve `beforeEach` for **mock resets only**. Repeated setup goes into small local helper/factory functions at the top of the file.

A component or composable mounted with different props or fixtures across a file gets one helper taking them — never a `mount(...)` call repeated per test:

```typescript
function mountSuccessStateHero({ title }: { title?: string } = {}) {
  return mount(VtsSuccessStateHero, {
    global: createGlobalTestConfig(),
    slots: { default: 'Message', ...(title !== undefined && { title }) },
  })
}
```

A composable helper returns the mounted state, read with no `.value`:

```typescript
function mountLevel({ isPopup = true, horizontal = false } = {}) {
  return mountComposable(() => useMenuLevel({ isPopup, horizontal })).wrapper.vm
}
```

A helper returning `wrapper.vm` serves a **reactivity** test too, as long as it accepts the source as a `ref` (`MaybeRefOrGetter`): `wrapper.vm` keeps following the updates. Only a test that must call a function returned by the composable, or build its expected value, _inside_ the `setup` callback stays inline (see [Testing composables](./testing-composables.md)).

Because mocks are read lazily, calling `getX.mockReturnValue(...)` in the test body _before_ invoking the helper still takes effect.

This applies to **navigation into the result** too, not only to mounting. An expression such as `result.items[0]`, repeated across a `describe` block, is repeated setup — give it a helper and assert on a named local, rather than re-deriving it in every test.

The exception is a **reactivity** test: it must keep reading through the mounted `vm` after reassigning the source ref. A helper returning a snapshot of the first item would defeat the test.

A helper used by a second test file moves to the package's test infrastructure — see [Shared test helpers](../tests.md#shared-test-helpers).

## Unmounting

Each package's `setup.ts` calls `enableAutoUnmount(afterEach)`, so every wrapper is unmounted after the test that created it. Never unmount by hand for cleanup, and never mount in `beforeAll`: that wrapper would be torn down after the first test. The one `wrapper.unmount()` allowed is the act of a test asserting what `onUnmounted` does.
