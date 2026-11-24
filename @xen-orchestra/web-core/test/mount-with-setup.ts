import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount, type MountingOptions } from '@vue/test-utils'
import { defineComponent, type VNodeChild } from 'vue'

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
