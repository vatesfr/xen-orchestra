import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, type ShallowUnwrapRef } from 'vue'

export function mountComposable<TResult extends Record<string, unknown>>(composable: () => TResult) {
  const wrapper = mount(
    defineComponent({
      setup: () => composable(),
      render: () => null,
    }),
    { global: createGlobalTestConfig() }
  ) as unknown as VueWrapper<ShallowUnwrapRef<TResult>>

  return { wrapper }
}
