<template>
  <div v-if="!xenApiStore.isConnected">
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
  </div>
</template>

<script lang="ts" setup>
import { watchEffect } from "vue";
import favicon from "@/assets/favicon.svg";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
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

const xenApiStore = useXenApiStore();

watchEffect(() => {
  if (xenApiStore.isConnected) {
    xenApiStore.init();
  }
});
useChartTheme();
</script>

<style lang="postcss">
@import "@/assets/base.css";

.nav {
  overflow: auto;
  width: 37rem;
  max-width: 37rem;
  height: calc(100vh - 9rem);
  padding: 0.5rem;
  border-right: 1px solid var(--color-blue-scale-400);
  background-color: var(--background-color-primary);
}

.main {
  overflow: auto;
  flex: 1;
  height: calc(100vh - 9rem);
  background-color: var(--background-color-secondary);
}
</style>
