import i18n from '@core/i18n'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import App from './App.vue'
import '@xen-orchestra/web-core/assets/css/base.pcss'

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
