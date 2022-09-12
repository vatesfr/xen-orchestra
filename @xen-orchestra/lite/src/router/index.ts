import { createRouter, createWebHashHistory } from "vue-router";
import pool from "@/router/pool";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";
import HomeView from "@/views/HomeView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import HostDashboardView from "@/views/host/HostDashboardView.vue";
import HostRootView from "@/views/host/HostRootView.vue";
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
      beforeEnter: (to, _, next) => {
        const hostStore = useHostStore();
        const host = hostStore.getRecordByUuid(to.params["uuid"] as string);
        if (host === undefined) {
          next({ name: "notFound" });
        }
        next();
      },
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
      beforeEnter: (to, _, next) => {
        const vmStore = useVmStore();
        const vm = vmStore.getRecordByUuid(to.params["uuid"] as string);
        if (vm === undefined) {
          next({ name: "notFound" });
        }
        next();
      },
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
