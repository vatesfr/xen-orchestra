# Testing composables

A composable that relies on a Vue context (`useI18n`, `inject`, an effect scope, plugins) must run **inside a mounted component**. Use the `mountComposable` helper from `src/test/mount-composable.ts`, which mounts a throwaway component with the real `vue-i18n` instance and a fresh Pinia:

```typescript
import { mountComposable } from '@/test/mount-composable.ts'

const { wrapper } = mountComposable(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.RUNNING })))

expect(wrapper.vm.powerState.icon).toBe('status:running-circle')
expect(wrapper.vm.powerState.text).toBe('Running')
```

The composable result becomes the component state, so `wrapper.vm` exposes it with refs **already unwrapped** — no `.value`. Read through `wrapper.vm` rather than destructuring it: a destructured value is a snapshot and stops following updates.

Because the real i18n instance is installed, assertions check the **actual translated strings** (`'Running'`, `'Not running'`, `'Unknown'`).

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
const { wrapper } = mountComposable(() => ({
  relativeStartTime: useXoHostUtils(createHost()).getRelativeStartTime(1660000000),
}))

expect(typeof wrapper.vm.relativeStartTime).toBe('string')
```

Note the object literal: `setup()` returns the component **bindings**, so the callback must hand back an object. A lone ref is not component state and would not surface on `wrapper.vm`.

Functions that only touch refs/computed (e.g. `getPowerState`) can be called on the returned object as usual.
