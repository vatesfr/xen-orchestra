# Composables (XO 6)

The shared rules — mounting in a Vue context, reactivity, a returned function calling `useI18n` — are in [Testing composables](../../../web-core/docs/tests/testing-composables.md). XO 6 mounts with the helpers of `src/test/mount-composable.ts`, which mount a throwaway component with `createGlobalTestConfig()`: the real `vue-i18n` instance, the app form validation messages, a fresh Pinia and a router.

`mountComposableWithI18n` mounts the composable, spreads its result, adds the `t` of the mounted component and returns `wrapper.vm`:

```typescript
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

const result = mountComposableWithI18n(() => useXoVmUtils(createVm({ power_state: VM_POWER_STATE.RUNNING })))

expect(result.powerState.icon).toBe('status:running-circle')
expect(result.powerState.text).toBe(result.t('vm:status:running'))
```

`mountComposable` does the same without `t` and returns `{ wrapper }`, for a test that needs neither the translation nor a returned object spread.

Both take the options of `createGlobalTestConfig()` as a second argument, e.g. `{ router }` for a composable that navigates (build it with `createTestRouter()` and assert on `router.currentRoute.value`), or `{ provide }` for a composable injecting what a parent component provides.
