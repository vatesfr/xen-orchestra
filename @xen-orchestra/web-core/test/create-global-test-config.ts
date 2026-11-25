import i18n from '@core/i18n.ts'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

/**
 * Shared `global` mounting options for component tests: the real `vue-i18n` instance, plus a Pinia and a router,
 * both created per call to keep tests isolated.
 *
 * Pass `provide` to stand in for what a parent component would provide (a root component injects from the app).
 *
 * The router is there for `useUiStore`, which calls `useRouter()`/`useRoute()` in its setup: every component reaching
 * that store (`VtsStateHero`, `VtsSuccessStateHero`…) needs one.
 */
export function createGlobalTestConfig({ provide = {} }: { provide?: Record<symbol, unknown> } = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
  })

  return { plugins: [i18n, createPinia(), router], provide }
}
