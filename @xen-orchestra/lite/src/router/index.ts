import pool from "@/router/pool";
import vm from "@/router/vm";
import HomeView from "@/views/HomeView.vue";
import HostDashboardView from "@/views/host/HostDashboardView.vue";
import HostRootView from "@/views/host/HostRootView.vue";
import PageNotFoundView from "@/views/PageNotFoundView.vue";
import SettingsView from "@/views/settings/SettingsView.vue";
import StoryView from "@/views/StoryView.vue";
import storiesRoutes from "virtual:stories";
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/story",
      name: "story",
      component: StoryView,
      children: storiesRoutes,
      meta: { hasStoryNav: true },
    },
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
    vm,
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
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: PageNotFoundView,
    },
  ],
});

if (import.meta.env.DEV) {
  router.addRoute("story", {
    path: "",
    name: "story-home",
    component: () => import("@/views/story/HomeView.vue"),
  });
}

export default router;
