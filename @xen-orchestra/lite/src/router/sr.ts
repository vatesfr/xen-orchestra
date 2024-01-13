export default {
    path: "/sr/:uuid",
    component: () => import("@/views/sr/SrRootView.vue"),
    redirect: { name: "sr.dashboard" },
    children: [
      {
        path: "dashboard",
        name: "sr.dashboard",
        component: () => import("@/views/sr/SrDashboardView.vue"),
      },
      {
        path: "vdis",
        name: "sr.vdis",
        component: () => import("@/views/sr/SrVdiView.vue"),
      }
    ],
  };