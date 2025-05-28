export default {
  path: '/host/:uuid',
  component: () => import('@/views/host/HostRootView.vue'),
  redirect: { name: 'host.dashboard' },
  children: [
    {
      path: 'dashboard',
      name: 'host.dashboard',
      component: () => import('@/views/host/HostDashboardView.vue'),
    },
    {
      path: 'console',
      name: 'host.console',
      component: () => import('@/views/host/HostConsoleView.vue'),
    },
    {
      path: 'system',
      name: 'host.system',
      component: () => import('@/views/host/HostSystemView.vue'),
    },
    {
      path: 'network',
      name: 'host.network',
      component: () => import('@/views/host/HostNetworkView.vue'),
    },
    {
      path: 'tasks',
      name: 'host.tasks',
      component: () => import('@/views/host/HostTasksView.vue'),
    },
    {
      path: 'vms',
      name: 'host.vms',
      component: () => import('@/views/host/HostVmsView.vue'),
    },
  ],
}
