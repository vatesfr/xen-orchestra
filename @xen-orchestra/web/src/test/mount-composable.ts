import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

/**
 * Runs a composable inside a real mounted component so it has access to a Vue
 * instance context (lifecycle hooks, `provide`/`inject`, effect scope, plugins
 * such as `vue-i18n`…).
 *
 * Composables that only use refs/computed can be called directly in a test, but
 * any composable relying on `useI18n`, injection or an effect scope must run
 * within a component — which is what this helper provides.
 *
 * @returns the value returned by the composable and the mounted wrapper (call
 * `wrapper.unmount()` to trigger scope disposal when needed).
 */
export function mountComposable<TResult>(composable: () => TResult) {
  let result!: TResult

  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()

        return () => null
      },
    }),
    {
      global: createGlobalTestConfig(),
    }
  )

  return { result, wrapper }
}
