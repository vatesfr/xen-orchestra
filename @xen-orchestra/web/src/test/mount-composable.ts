import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, type ShallowUnwrapRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type MountComposableOptions = Parameters<typeof createGlobalTestConfig>[0]

/**
 * Runs a composable inside a mounted component so it has access to a Vue
 * instance context (lifecycle hooks, `provide`/`inject`, effect scope, plugins
 * such as `vue-i18n`…).
 *
 * The composable result becomes the component state: read it through
 * `wrapper.vm`, with refs already unwrapped. Destructuring it snapshots the
 * values and stops observing updates.
 */
export function mountComposable<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  options?: MountComposableOptions
) {
  const wrapper = mount(
    defineComponent({
      // Vue calls `setup(props, ctx)`: passing `composable` as-is would land `props` on its first parameter
      setup: () => composable(),
      render: () => null,
    }),
    { global: createGlobalTestConfig(options) }
    // `defineComponent` cannot infer the bindings of a generic setup
  ) as unknown as VueWrapper<ShallowUnwrapRef<TResult>>

  return { wrapper }
}

// The expected labels of a composable test are built with the `t` of the mounted component (see testing-composables.md)
export function mountComposableWithI18n<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  options?: MountComposableOptions
) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...composable(), t }
  }, options).wrapper.vm
}
