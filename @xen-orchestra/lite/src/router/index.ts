import { createRouter, createWebHistory } from "vue-router";
import pool from "@/router/pool";
import DemoView from "@/views/DemoView.vue";
import HomeView from "@/views/HomeView.vue";
import HostDashboardView from "@/views/host/HostDashboardView.vue";
import HostRootView from "@/views/host/HostRootView.vue";
import VmConsoleView from "@/views/vm/VmConsoleView.vue";
import VmRootView from "@/views/vm/VmRootView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/demo",
      name: "demo",
      component: DemoView,
    },
    pool,
    {
      path: "/host/:uuid",
      component: HostRootView,
      children: [
        {
          path: "",
          name: "host.dashboard",
          component: HostDashboardView,
        },
      ],
    },
    {
      path: "/vm/:uuid",
      component: VmRootView,
      children: [
        {
          path: "console",
          name: "vm.console",
          component: VmConsoleView,
        },
      ],
    },
  ],
});

export default router;
