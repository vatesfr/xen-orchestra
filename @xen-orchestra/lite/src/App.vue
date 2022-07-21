<template>
<<<<<<< HEAD
  <div v-if="!xenApiStore.isConnected">
=======
  <div v-if="!xenApiStore.isConnected" style="display: flex">
>>>>>>> feat(lite): initial Vue.js implementation
    <AppLogin />
  </div>
  <div v-else>
    <AppHeader />
    <div style="display: flex">
      <nav class="nav">
        <InfraPoolList />
      </nav>
      <main class="main">
        <RouterView />
      </main>
    </div>
<<<<<<< HEAD
    <AppTooltips />
=======
>>>>>>> feat(lite): initial Vue.js implementation
  </div>
</template>

<script lang="ts" setup>
import { watchEffect } from "vue";
<<<<<<< HEAD
import favicon from "@/assets/favicon.svg";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import AppTooltips from "@/components/AppTooltips.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import { useChartTheme } from "@/composables/chart-theme.composable";
import { useXenApiStore } from "@/stores/xen-api.store";

let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
if (link == null) {
  link = document.createElement("link");
  link.rel = "icon";
  document.getElementsByTagName("head")[0].appendChild(link);
}
link.href = favicon;

document.title = "XO Lite";

if (window.localStorage?.getItem("colorMode") !== "light") {
  document.documentElement.classList.add("dark");
}

=======
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import { useXenApiStore } from "@/stores/xen-api.store";

>>>>>>> feat(lite): initial Vue.js implementation
const xenApiStore = useXenApiStore();

watchEffect(() => {
  if (xenApiStore.isConnected) {
    xenApiStore.init();
  }
});
<<<<<<< HEAD

useChartTheme();
=======
>>>>>>> feat(lite): initial Vue.js implementation
</script>

<style lang="postcss">
@import "@/assets/base.css";

.nav {
  overflow: auto;
  width: 37rem;
  max-width: 37rem;
  height: calc(100vh - 9rem);
  padding: 0.5rem;
<<<<<<< HEAD
  border-right: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}

.main {
  overflow: auto;
  flex: 1;
  height: calc(100vh - 9rem);
  background-color: var(--background-color-secondary);
=======
  background-color: var(--background-color-primary);
  border-right: 1px solid var(--color-blue-scale-400);
}

.main {
  flex: 1;
  background-color: var(--background-color-secondary);
  height: calc(100vh - 9rem);
  overflow: auto;
>>>>>>> feat(lite): initial Vue.js implementation
}
</style>
