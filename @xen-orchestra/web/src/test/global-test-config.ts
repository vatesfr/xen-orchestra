import i18n from '@core/i18n'
import { createPinia } from 'pinia'

/**
 * Shared `global` mounting options for component and composable tests: installs
 * the real `vue-i18n` instance (so translations resolve to actual strings) and
 * a fresh Pinia (required by directives/components that rely on stores, e.g. the
 * tooltip directive). A new Pinia is created per call to keep tests isolated.
 */
export function createGlobalTestConfig() {
  return {
    plugins: [i18n, createPinia()],
  }
}
