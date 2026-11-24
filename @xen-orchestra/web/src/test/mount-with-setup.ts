import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { MountComposableOptions } from '@/test/mount-composable.ts'
import {
  mountComposableUnderSetup as mountCoreComposableUnderSetup,
  mountWithSetup as mountCoreWithSetup,
  mountWithSetupResult as mountCoreWithSetupResult,
} from '@core-test/mount-with-setup.ts'
import type { VNodeChild } from 'vue'

/**
 * The web-core `mountWithSetup`, on the XO 6 global test config.
 */
export function mountWithSetup(setup: () => () => VNodeChild) {
  return mountCoreWithSetup(setup, { global: createGlobalTestConfig() })
}

/**
 * The web-core `mountWithSetupResult`, on the XO 6 global test config built from `options`.
 */
export function mountWithSetupResult<TResult>(
  setup: () => { result: TResult; render: () => VNodeChild },
  options: MountComposableOptions = {}
) {
  return mountCoreWithSetupResult(setup, { global: createGlobalTestConfig(options) })
}

/**
 * The web-core `mountComposableUnderSetup`, on the XO 6 global test config built from `options`.
 */
export function mountComposableUnderSetup<TProvided, TResult>(
  setup: () => TProvided,
  composable: (provided: TProvided) => TResult,
  options: MountComposableOptions = {}
) {
  return mountCoreComposableUnderSetup(setup, composable, { global: createGlobalTestConfig(options) })
}
