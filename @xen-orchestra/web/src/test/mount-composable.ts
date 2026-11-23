import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mountComposable as mountCoreComposable } from '@core-test/mount-composable.ts'
import { useI18n } from 'vue-i18n'

export type MountComposableOptions = NonNullable<Parameters<typeof createGlobalTestConfig>[0]>

/**
 * The web-core `mountComposable`, on the XO 6 global test config.
 */
export function mountComposable<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  globalOptions: MountComposableOptions = {}
) {
  return mountCoreComposable(composable, createGlobalTestConfig(globalOptions))
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
