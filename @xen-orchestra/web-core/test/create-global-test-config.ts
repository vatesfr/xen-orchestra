import i18n from '@core/i18n.ts'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

/**
 * Shared `global` mounting options for component tests: the real `vue-i18n` instance, plus a Pinia and a router,
 * both created per call to keep tests isolated.
 *
 * The router is there for `useUiStore`, which calls `useRouter()`/`useRoute()` in its setup: every component reaching
 * that store (`VtsStateHero`, `VtsSuccessStateHero`…) needs one.
 */
export function createGlobalTestConfig() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
  })

  return { plugins: [i18n, createPinia(), router] }
}
