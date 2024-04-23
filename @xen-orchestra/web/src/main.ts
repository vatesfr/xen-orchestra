import i18n from '@core/i18n'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
// eslint-disable-next-line import/no-unresolved -- https://github.com/posva/unplugin-vue-router/issues/232
import { createRouter, createWebHashHistory } from 'vue-router/auto'
import App from './App.vue'
import '@xen-orchestra/web-core/assets/css/base.pcss'

const app = createApp(App)

const router = createRouter({
  history: createWebHashHistory(),
})

app.use(i18n)
app.use(createPinia())
app.use(router)

app.mount('#app')
