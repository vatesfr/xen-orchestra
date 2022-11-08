import { createRouter, createWebHashHistory } from "vue-router";
import pool from "@/router/pool";
import HomeView from "@/views/HomeView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import HostDashboardView from "@/views/host/HostDashboardView.vue";
import HostRootView from "@/views/host/HostRootView.vue";
import SettingsView from "@/views/settings/SettingsView.vue";
import VmConsoleView from "@/views/vm/VmConsoleView.vue";
import VmRootView from "@/views/vm/VmRootView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
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
    {
      path: "/404",
      name: "notFound",
      component: NotFoundView,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ],
});

export default router;
