import App from '@/App.vue'
import { formValidationConfig } from '@/plugins/form-validation.config.ts'
import i18n from '@core/i18n.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { RegleVuePlugin } from '@regle/core'
import { noop } from '@vueuse/core'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import '@xen-orchestra/web-core/assets/css/base.pcss'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router
  .isReady()
  .catch(noop)
  .then(() => {
    router.afterEach(() => useOverlayStore().abortAll())
  })

const app = createApp(App)

app.use(i18n)
app.use(createPinia())
app.use(router)
app.use(RegleVuePlugin, formValidationConfig)

app.mount('#root')
