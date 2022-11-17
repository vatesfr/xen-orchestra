<template>
  <UiModal
    v-if="isSslModalOpen"
    color="error"
    :icon="faServer"
    @close="clearUnreachableHostsUrls"
  >
    <template #title>{{ $t("unreachable-hosts") }}</template>
    <template #subtitle>{{ $t("following-hosts-unreachable") }}</template>
    <p>{{ $t("allow-self-signed-ssl") }}</p>
    <ul>
      <li v-for="url in unreachableHostsUrls" :key="url.hostname">
        <a :href="url.href" target="_blank" rel="noopener">{{ url.href }}</a>
      </li>
    </ul>
  </UiModal>
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
import { useUiStore } from "@/stores/ui.store";
import { useColorMode, useMagicKeys, whenever } from "@vueuse/core";
import { difference } from "lodash";
import { computed, ref, watch, watchEffect } from "vue";
import favicon from "@/assets/favicon.svg";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import AppTooltips from "@/components/AppTooltips.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import UiModal from "@/components/ui/UiModal.vue";
import { useChartTheme } from "@/composables/chart-theme.composable";
import { useHostStore } from "@/stores/host.store";
import { useXenApiStore } from "@/stores/xen-api.store";

const unreachableHostsUrls = ref<URL[]>([]);
const clearUnreachableHostsUrls = () => (unreachableHostsUrls.value = []);

let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
if (link == null) {
  link = document.createElement("link");
  link.rel = "icon";
  document.getElementsByTagName("head")[0].appendChild(link);
}
link.href = favicon;

document.title = "XO Lite";

const xenApiStore = useXenApiStore();
const hostStore = useHostStore();
useChartTheme();
const uiStore = useUiStore();

const { Ctrl_Shift_D } = useMagicKeys();
whenever(
  Ctrl_Shift_D,
  () => (uiStore.colorMode = uiStore.colorMode === "dark" ? "light" : "dark")
);

watchEffect(() => {
  if (xenApiStore.isConnected) {
    xenApiStore.init();
  }
});

watch(
  () => hostStore.allRecords,
  (hosts, previousHosts) => {
    difference(hosts, previousHosts).forEach((host) => {
      const url = new URL("http://localhost");
      url.protocol = window.location.protocol;
      url.hostname = host.address;
      fetch(url, { mode: "no-cors" }).catch(() =>
        unreachableHostsUrls.value.push(url)
      );
    });
  }
);

const isSslModalOpen = computed(() => unreachableHostsUrls.value.length > 0);
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
