import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@xen-orchestra/web-core/assets/css/base.pcss'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
