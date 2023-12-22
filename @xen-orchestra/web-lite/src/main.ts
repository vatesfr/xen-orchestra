import '@xen-orchestra/web-core/assets/css/base.pcss'
import { createPinia } from 'pinia'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router/auto'

import App from './App.vue'

const app = createApp(App)

const router = createRouter({
  history: createWebHashHistory(),
})

app.use(createPinia())
app.use(router)

app.mount('#app')
