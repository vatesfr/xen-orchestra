# Testing composables

A composable that relies on a Vue context (`useI18n`, `inject`, an effect scope, plugins) must run **inside a mounted component**: a throwaway component whose `setup` calls it, mounted with the package's global test config. XO 6 has the helpers for it (`mountComposable`, `mountComposableWithI18n`, see [XO 6 composables](../../../web/docs/tests/testing-composables.md)); a web-core test needing one adds its generic version to `web-core/test/` (see [Shared test helpers](../tests.md#shared-test-helpers)) rather than mounting by hand. A composable needing no Vue context is called directly, like a [utility](./testing-utilities.md).

Because the real i18n instance is installed, translations resolve to actual strings, and the assertion builds its expected label with `t` instead of hard-coding the wording — see [Assert behavior](./assert-behavior.md).

The composable result becomes the component state, so `wrapper.vm` exposes it with refs **already unwrapped** — no `.value`. Read through it rather than destructuring it: a destructured value is a snapshot and stops following updates.

The wrapper is unmounted after the test, so `onUnmounted` and `onScopeDispose` cleanup runs and no watcher of a previous test can re-fire in the next one.

## Reactivity

To test that a composable reacts to its source, pass a `ref` and reassign it:

```typescript
const source = ref(createItem({ status: 'running' }))
const { wrapper } = mountComposable(() => useItemStatus(source))

expect(wrapper.vm.icon).toBe('status:running-circle')

source.value = createItem({ status: 'halted' })

expect(wrapper.vm.icon).toBe('status:halted-circle')
```

## Composables whose returned function calls `useI18n` / `inject`

`useI18n()` must be called synchronously during a component `setup()`. If a composable returns a function that _itself_ calls `useI18n`, you cannot call that function from the test body after the mount has returned — it throws `Must be called at the top of a 'setup' function`. Invoke it **inside** the `setup` callback instead:

```typescript
const startTimeInSeconds = 1660000000

const { wrapper } = mountComposable(() => {
  const { locale } = useI18n()

  return {
    relativeStartTime: useItemUtils(createItem()).getRelativeStartTime(startTimeInSeconds),
    expectedRelativeTime: getRelativeTime(new Date(startTimeInSeconds * 1000), locale.value),
  }
})

expect(wrapper.vm.relativeStartTime).toBe(wrapper.vm.expectedRelativeTime)
```

Note the object literal: `setup()` returns the component **bindings**, so the callback must hand back an object. A lone ref is not component state and would not surface on `wrapper.vm`. Anything the assertion needs — the `t`, a `locale`, an expected value — is returned alongside, which is why the callback body is a block rather than a bare object.

The expected value is **derived the way production derives it** ([Assert behavior](./assert-behavior.md)): `getRelativeTime` owns the wording, and what the composable decides is which date to hand it. `expect(typeof …).toBe('string')` would pass for any string, including one built from a start time read as milliseconds instead of seconds — it asserts the type, not the behavior. Where a value is environment-dependent, name the helper production uses and call it with the same input; never assert merely that the value is non-empty or differs from some other label.

Functions that only touch refs/computed can be called on the returned object as usual.
