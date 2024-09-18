import { pinia } from '@/pinia'
import { router } from '@/router'
import i18n from '@core/i18n'
import { createApp } from 'vue'
import { handleHotUpdate } from 'vue-router/auto-routes'
import App from './App.vue'
import '@xen-orchestra/web-core/assets/css/base.pcss'

const app = createApp(App)

if (import.meta.hot) {
  handleHotUpdate(router)
}

app.use(i18n)
app.use(pinia)
app.use(router)

app.mount('#app')
