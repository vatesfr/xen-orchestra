import App from '@/App.vue'
import router from '@/router'
import i18n from '@core/i18n'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import '@xen-orchestra/web-core/assets/css/base.pcss'

const app = createApp(App)

app.use(i18n)
app.use(createPinia())
app.use(router)

app.mount('#root')
