export default {
  path: '/vm/:uuid',
  name: 'vm.default',
  component: () => import('@/views/vm/VmRootView.vue'),
  redirect: { name: 'vm.dashboard' },
  children: [
    {
      path: 'dashboard',
      name: 'vm.dashboard',
      component: () => import('@/views/vm/VmDashboardView.vue'),
    },
    {
      path: 'console',
      name: 'vm.console',
      component: () => import('@/views/vm/VmConsoleView.vue'),
    },
    {
      path: 'alarms',
      name: 'vm.alarms',
      component: () => import('@/views/vm/VmAlarmsView.vue'),
    },
    {
      path: 'stats',
      name: 'vm.stats',
      component: () => import('@/views/vm/VmStatsView.vue'),
    },
    {
      path: 'system',
      name: 'vm.system',
      component: () => import('@/views/vm/VmSystemView.vue'),
    },
    {
      path: 'network',
      name: 'vm.network',
      component: () => import('@/views/vm/VmNetworkView.vue'),
    },
    {
      path: 'storage',
      name: 'vm.storage',
      component: () => import('@/views/vm/VmStorageView.vue'),
    },
    {
      path: 'tasks',
      name: 'vm.tasks',
      component: () => import('@/views/vm/VmTasksView.vue'),
    },
  ],
}
