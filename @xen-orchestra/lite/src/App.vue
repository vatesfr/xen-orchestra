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
    <AppTooltips />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from "vue";
import favicon from "@/assets/favicon.svg";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import AppTooltips from "@/components/AppTooltips.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import { useChartTheme } from "@/composables/chart-theme.composable";
import { useHostStore } from "@/stores/host.store";
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

const unreachableHosts = ref();

const xenApiStore = useXenApiStore();
const hostStore = useHostStore();

watchEffect(() => {
  if (xenApiStore.isConnected) {
    xenApiStore.init();
  }
});

useChartTheme();
watchEffect(async () => {
  const _unreachableHosts = [];
  for (const key in hostStore.allRecords) {
    const host = hostStore.allRecords[key];

    const url = new URL("http://localhost");
    url.protocol = window.location.protocol;
    url.hostname = host.address;

    try {
      await fetch(url, {
        mode: "no-cors",
      });
    } catch (_) {
      _unreachableHosts.push(url);
    }
  }
  unreachableHosts.value = _unreachableHosts;
});

watchEffect(() => {
  if (unreachableHosts.value?.length > 0) {
    // TODO: Replace with modal component when available.
    let string = "The following hosts are unreachable. ";
    if (window.location.protocol === "https:") {
      string +=
        "You may need to allow self-signed SSL certificates in your browser.";
    }
    string += "\n\n";
    unreachableHosts.value.forEach((url: URL) => {
      string += url.href + "\n";
    });
    alert(string);
  }
});
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
