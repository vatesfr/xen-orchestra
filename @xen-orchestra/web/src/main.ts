import i18n from '@core/i18n'
import type { XoUser } from '@vates/types'
import { useFetch } from '@vueuse/core'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import App from './App.vue'
import '@xen-orchestra/web-core/assets/css/base.pcss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

async function init() {
  // TODO: remove when non admin users are handled in XO6
  if (import.meta.env.PROD) {
    const { data: me } = await useFetch('/rest/v0/users/me').json<XoUser>()
    if (me.value === null) {
      console.error('Unexpected response from `/users/me` endpoint')
    } else {
      if (me.value.permission !== 'admin') {
        // voluntary not using `useXoRoutes` we need info BEFORE mounting anything from XO6 (UI,store, ...)
        const { data } = await useFetch<{ xo5: string; xo6: string }>('/rest/v0/gui-routes').json()
        if (data.value !== undefined) {
          window.location.pathname = data.value.xo5
        } else {
          console.error('Unexpected response from `gui-routes` endpoint')
        }
      }
    }
  }

  const app = createApp(App)

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  })

  if (import.meta.hot) {
    handleHotUpdate(router)
  }

  app.use(i18n)
  app.use(createPinia())
  app.use(router)

  app.mount('#app')
}

init()
