import PoolAlarmsView from "@/views/pool/PoolAlarmsView.vue";
import PoolDashboardView from "@/views/pool/PoolDashboardView.vue";
import PoolHostsView from "@/views/pool/PoolHostsView.vue";
import PoolNetworkView from "@/views/pool/PoolNetworkView.vue";
import PoolRootView from "@/views/pool/PoolRootView.vue";
import PoolStatsView from "@/views/pool/PoolStatsView.vue";
import PoolStorageView from "@/views/pool/PoolStorageView.vue";
import PoolSystemView from "@/views/pool/PoolSystemView.vue";
import PoolTasksView from "@/views/pool/PoolTasksView.vue";
import PoolVmsView from "@/views/pool/PoolVmsView.vue";

export default {
  path: "/pool/:uuid",
  component: PoolRootView,
  redirect: { name: "pool.dashboard" },
  children: [
    {
      path: "dashboard",
      name: "pool.dashboard",
      component: PoolDashboardView,
    },
    {
      path: "alarms",
      name: "pool.alarms",
      component: PoolAlarmsView,
    },
    {
      path: "stats",
      name: "pool.stats",
      component: PoolStatsView,
    },
    {
      path: "system",
      name: "pool.system",
      component: PoolSystemView,
    },
    {
      path: "network",
      name: "pool.network",
      component: PoolNetworkView,
    },
    {
      path: "storage",
      name: "pool.storage",
      component: PoolStorageView,
    },
    {
      path: "tasks",
      name: "pool.tasks",
      component: PoolTasksView,
    },
    {
      path: "hosts",
      name: "pool.hosts",
      component: PoolHostsView,
    },
    {
      path: "vms",
      name: "pool.vms",
      component: PoolVmsView,
    },
  ],
};
