import { getFirst } from "@/libs/utils";
import pool from "@/router/pool";
import story from "@/router/story";
import vm from "@/router/vm";
import HomeView from "@/views/HomeView.vue";
import type { Router } from "vue-router";
import { createRouter, createWebHashHistory } from "vue-router";

function preserveMasterQueryParam(router: Router) {
  let keepMaster = true;

  router.beforeEach((to, from, next) => {
    const previousMasterQueryParam = getFirst(from.query["master"])?.trim();
    const currentMasterQueryParam = getFirst(to.query["master"])?.trim();

    if (previousMasterQueryParam == undefined) {
      keepMaster = true;
      next();
      return;
    }

    // Needed to keep master query param between navigation
    if (currentMasterQueryParam == undefined && keepMaster) {
      const nav = router.resolve({
        path: to.path,
        query: { ...to.query, master: previousMasterQueryParam },
      });
      next(nav);
      return;
    }

    // If user remove the master query value
    if (currentMasterQueryParam === "") {
      delete to.query.master;
      keepMaster = false;
      const nav = router.resolve({
        path: to.path,
        query: to.query,
      });
      next(nav);
      return;
    }

    next();
  });
}

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
      component: () => import("@/views/settings/SettingsView.vue"),
    },
    story,
    pool,
    vm,
    {
      path: "/host/:uuid",
      component: () => import("@/views/host/HostRootView.vue"),
      children: [
        {
          path: "",
          name: "host.dashboard",
          component: () => import("@/views/host/HostDashboardView.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/PageNotFoundView.vue"),
    },
  ],
});

preserveMasterQueryParam(router);

export default router;
