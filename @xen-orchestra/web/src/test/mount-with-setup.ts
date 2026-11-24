import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mountWithSetup as mountCoreWithSetup } from '@core-test/mount-with-setup.ts'
import type { VNodeChild } from 'vue'

/**
 * The web-core `mountWithSetup`, on the XO 6 global test config.
 */
export function mountWithSetup(setup: () => () => VNodeChild) {
  return mountCoreWithSetup(setup, { global: createGlobalTestConfig() })
}
