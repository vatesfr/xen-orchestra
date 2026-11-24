import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount, type MountingOptions } from '@vue/test-utils'
import { defineComponent, h, type VNodeChild } from 'vue'

/**
 * Mounts a component whose `setup` sets up what its render needs below it (a select only renders below the component
 * that defines it, a provided context is only injected by children) and returns that render. `global` defaults to the
 * web-core `createGlobalTestConfig()`; XO 6 passes its own.
 */
export function mountWithSetup(
  setup: () => () => VNodeChild,
  { global = createGlobalTestConfig(), attachTo }: Pick<MountingOptions<object>, 'global' | 'attachTo'> = {}
) {
  return mount(defineComponent({ setup }), { global, attachTo })
}

/**
 * Runs `mountWith`, which mounts synchronously, and returns what it mounted and the value it passed to `capture`.
 */
function captureDuringMount<TValue, TMounted>(mountWith: (capture: (value: TValue) => void) => TMounted) {
  // an object, so that TypeScript does not narrow what `capture` assigns to `undefined`
  const captured: { value?: TValue } = {}

  const mounted = mountWith(value => {
    captured.value = value
  })

  return { mounted, value: captured.value as TValue }
}

/**
 * `mountWithSetup` keeping what `setup` builds (a form, a composable's return): `setup` returns it as `result`, with the
 * render of what uses it. Returns the mount and that result.
 */
export function mountWithSetupResult<TResult>(
  setup: () => { result: TResult; render: () => VNodeChild },
  options: Parameters<typeof mountWithSetup>[1] = {}
) {
  const { mounted: wrapper, value: result } = captureDuringMount((capture: (result: TResult) => void) =>
    mountWithSetup(() => {
      const { result, render } = setup()
      capture(result)

      return render
    }, options)
  )

  return { wrapper, result }
}

/**
 * Runs `composable` in a component rendered under the one whose `setup` provides what it injects: a component does not
 * inject what it provides itself. `composable` receives what `setup` returned. Returns what `setup` returned and what
 * `composable` returned.
 */
export function mountComposableUnderSetup<TProvided, TResult>(
  setup: () => TProvided,
  composable: (provided: TProvided) => TResult,
  options: Parameters<typeof mountWithSetup>[1] = {}
) {
  const {
    value: { provided, result },
  } = captureDuringMount((capture: (value: { provided: TProvided; result: TResult }) => void) =>
    mountWithSetup(() => {
      const provided = setup()

      const Child = defineComponent({
        setup() {
          capture({ provided, result: composable(provided) })

          return () => null
        },
      })

      return () => h(Child)
    }, options)
  )

  return { provided, result }
}
