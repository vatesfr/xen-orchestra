import type { XoPlugin } from '../plugin-api.ts'
import XoaPage from './XoaPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    hideTabs?: boolean
  }
}

const xoaPlugin: XoPlugin = {
  install({ router }) {
    router.addRoute('/(site)', {
      path: '/xoa',
      name: '/xoa',
      component: XoaPage,
    })

    router.addRoute('/(site)', {
      path: '/xoa/updates',
      name: '/xoa/updates',
      component: () => import('./updates/UpdatesPage.vue'),
      meta: { hideTabs: true },
    })
  },
}

export default xoaPlugin
