# Testing composables

A composable that relies on a Vue context (`useI18n`, `inject`, an effect scope, plugins) must run **inside a mounted component**. Use the helpers from `src/test/mount-composable.ts`, which mount a throwaway component with `createGlobalTestConfig()`: the real `vue-i18n` instance, the app form validation messages, a fresh Pinia and a router.

Because the real i18n instance is installed, translations resolve to actual strings, and the assertion builds its expected label with `t` instead of hard-coding the wording — see [Assert behaviour](./assert-behaviour.md). `mountComposableWithI18n` mounts the composable, spreads its result, adds the `t` of the mounted component and returns `wrapper.vm`:

```typescript
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

const result = mountComposableWithI18n(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.RUNNING })))

expect(result.powerState.icon).toBe('status:running-circle')
expect(result.powerState.text).toBe(result.t('vm:status:running'))
```

`mountComposable` does the same without `t` and returns `{ wrapper }`, for a test that needs neither the translation nor a returned object spread.

Both take the options of `createGlobalTestConfig()` as a second argument, e.g. `{ router }` for a composable that navigates (build it with `createTestRouter()` and assert on `router.currentRoute.value`).

A composable that drives a component of its caller (it reacts to what that component does) takes a `render` option, which renders that component beside it: `mountComposable(() => useFeature(), { render: () => h(SomeComponent, { someProp: true }) })`.

A composable that only has side effects (it returns nothing) is mounted the same way: assert on the store or the component it acts on.

The composable result becomes the component state, so `wrapper.vm` exposes it with refs **already unwrapped** — no `.value`. Read through it rather than destructuring it: a destructured value is a snapshot and stops following updates.

The wrapper is unmounted after the test, so `onUnmounted` and `onScopeDispose` cleanup runs and no watcher of a previous test can re-fire in the next one.

## Reactivity

To test that a composable reacts to its source, pass a `ref` and reassign it:

```typescript
const vm = ref(createVm({ power_state: VM_POWER_STATE.RUNNING }))
const { wrapper } = mountComposable(() => useXoVmUtils(vm))

expect(wrapper.vm.powerState.icon).toBe('status:running-circle')

vm.value = createVm({ power_state: VM_POWER_STATE.HALTED })

expect(wrapper.vm.powerState.icon).toBe('status:halted-circle')
```

## Composables whose returned function calls `useI18n` / `inject`

`useI18n()` must be called synchronously during a component `setup()`. If a composable returns a function that _itself_ calls `useI18n` (e.g. `useXoHostUtils(host).getRelativeStartTime`), you cannot call that function from the test body after `mountComposable` has returned — it throws `Must be called at the top of a 'setup' function`. Invoke it **inside** the `mountComposable` callback instead:

```typescript
const startTimeInSeconds = 1660000000

const { wrapper } = mountComposable(() => {
  const { locale } = useI18n()

  return {
    relativeStartTime: useXoHostUtils(createHost()).getRelativeStartTime(startTimeInSeconds),
    expectedRelativeTime: getRelativeTime(new Date(startTimeInSeconds * 1000), locale.value),
  }
})

expect(wrapper.vm.relativeStartTime).toBe(wrapper.vm.expectedRelativeTime)
```

Note the object literal: `setup()` returns the component **bindings**, so the callback must hand back an object. A lone ref is not component state and would not surface on `wrapper.vm`. Anything the assertion needs — the `t`, a `locale`, an expected value — is returned alongside, which is why the callback body is a block rather than a bare object.

The expected value is **derived the way production derives it** ([Assert behaviour](./assert-behaviour.md)): `getRelativeTime` owns the wording, and what the composable decides is which date to hand it. `expect(typeof …).toBe('string')` would pass for any string, including one built from a start time read as milliseconds instead of seconds — it asserts the type, not the behaviour. Where a value is environment-dependent, name the helper production uses and call it with the same input; never assert merely that the value is non-empty or differs from some other label.

Functions that only touch refs/computed (e.g. `getPowerState`) can be called on the returned object as usual.
