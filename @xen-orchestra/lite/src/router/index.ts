import pool from '@/router/pool'
import story from '@/router/story'
import vm from '@/router/vm'
import HomeView from '@/views/HomeView.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/xoa-deploy',
      name: 'xoa.deploy',
      component: () => import('@/views/xoa-deploy/XoaDeployView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
    },
    story,
    pool,
    vm,
    {
      path: '/host/:uuid',
      component: () => import('@/views/host/HostRootView.vue'),
      children: [
        {
          path: '',
          name: 'host.dashboard',
          component: () => import('@/views/host/HostDashboardView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/PageNotFoundView.vue'),
    },
  ],
})

export default router
