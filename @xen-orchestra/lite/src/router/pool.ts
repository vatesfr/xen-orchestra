import PoolDashboardView from '@/views/pool/PoolDashboardView.vue'
import PoolRootView from '@/views/pool/PoolRootView.vue'

export default {
  path: '/pool/:uuid',
  component: PoolRootView,
  redirect: { name: 'pool.dashboard' },
  children: [
    {
      path: 'dashboard',
      name: 'pool.dashboard',
      component: PoolDashboardView,
    },
    {
      path: 'alarms',
      name: 'pool.alarms',
      component: () => import('@/views/pool/PoolAlarmsView.vue'),
    },
    {
      path: 'stats',
      name: 'pool.stats',
      component: () => import('@/views/pool/PoolStatsView.vue'),
    },
    {
      path: 'system',
      name: 'pool.system',
      component: () => import('@/views/pool/PoolSystemView.vue'),
    },
    {
      path: 'network',
      name: 'pool.network',
      component: () => import('@/views/pool/PoolNetworkView.vue'),
    },
    {
      path: 'storage',
      name: 'pool.storage',
      component: () => import('@/views/pool/PoolStorageView.vue'),
    },
    {
      path: 'tasks',
      name: 'pool.tasks',
      component: () => import('@/views/pool/PoolTasksView.vue'),
    },
    {
      path: 'hosts',
      name: 'pool.hosts',
      component: () => import('@/views/pool/PoolHostsView.vue'),
    },
    {
      path: 'vms',
      name: 'pool.vms',
      component: () => import('@/views/pool/PoolVmsView.vue'),
    },
  ],
}
