import { createTestRouter } from '@/test/create-test-router.ts'
import i18n from '@core/i18n.ts'
import { createPinia } from 'pinia'
import type { Plugin } from 'vue'
import type { Router } from 'vue-router'

/**
 * Shared `global` mounting options for component and composable tests: installs
 * the real `vue-i18n` instance (so translations resolve to actual strings), plus
 * a Pinia and a router, both created per call to keep tests isolated.
 *
 * The router is not only for components rendering `RouterLink`: the shared
 * `useUiStore` calls `useRouter()`/`useRoute()` in its setup, so every component
 * reaching that store (`VtsStateHero`, `VtsKeyValueRow`, `TabItem`…) needs one —
 * without it the injections miss, and reading `uiStore.hasUi` would throw.
 *
 * Pass a `router` to navigate before mounting, which is what makes an active
 * route assertable.
 */
export function createGlobalTestConfig({ router = createTestRouter() }: { router?: Router } = {}) {
  const plugins: Plugin[] = [i18n, createPinia(), router]

  return { plugins }
}
