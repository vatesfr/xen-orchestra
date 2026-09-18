import type {
  BackupRepositoriesFormatted,
  StorageRepositoriesFormatted,
} from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { createSiteDashboard } from '@/test/create-site-dashboard.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { ref, type Component } from 'vue'

/**
 * The state `useXoSiteDashboard` hands its callers, as plain refs a test can
 * write to — every card of the site dashboard reads the resource itself rather
 * than taking it as a prop, so each of their tests has to stub it.
 *
 * Built at module scope and returned by the `vi.mock` factory's arrow, which
 * runs only when a card mounts:
 *
 * ```ts
 * const siteDashboard = createSiteDashboardMock()
 *
 * vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
 *   useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
 * }))
 *
 * const mountPoolsStatus = (overrides?: Partial<XoDashboard>) =>
 *   siteDashboard.mountCard(SiteDashboardPoolsStatus, overrides)
 * ```
 */
export function createSiteDashboardMock() {
  const dashboard = ref<XoDashboard>({})
  const hasError = ref(false)
  const backupRepositoriesFormatted = ref<BackupRepositoriesFormatted>()
  const storageRepositoriesFormatted = ref<StorageRepositoriesFormatted>()

  return {
    dashboard,
    hasError,
    isDashboardReady: ref(true),
    backupRepositoriesFormatted,
    storageRepositoriesFormatted,

    /** Back to a fully-populated dashboard with no error — call it in `beforeEach`. */
    reset() {
      dashboard.value = createSiteDashboard()
      hasError.value = false
      backupRepositoriesFormatted.value = undefined
      storageRepositoriesFormatted.value = undefined
    },

    /**
     * Mounts a card over a dashboard built from `overrides`, for the cards
     * reading `dashboard` itself. The two repository cards read a formatted
     * section instead, and set it before mounting on their own.
     */
    mountCard(component: Component, overrides: Partial<XoDashboard> = {}) {
      dashboard.value = createSiteDashboard(overrides)

      return mount(component, { global: createGlobalTestConfig() })
    },
  }
}
