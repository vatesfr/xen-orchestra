<template>
  <UiModal
    v-if="isSslModalOpen"
    :icon="faServer"
    color="error"
    @close="clearUnreachableHostsUrls"
  >
    <template #title>{{ $t("unreachable-hosts") }}</template>
    <template #subtitle>{{ $t("following-hosts-unreachable") }}</template>
    <p>{{ $t("allow-self-signed-ssl") }}</p>
    <ul>
      <li v-for="url in unreachableHostsUrls" :key="url.hostname">
        <a :href="url.href" rel="noopener" target="_blank">{{ url.href }}</a>
      </li>
    </ul>
    <template #buttons>
      <UiButton color="success" @click="reload">
        {{ $t("unreachable-hosts-reload-page") }}
      </UiButton>
      <UiButton @click="clearUnreachableHostsUrls">{{ $t("cancel") }}</UiButton>
    </template>
  </UiModal>
  <div v-if="!$route.meta.hasStoryNav && !xenApiStore.isConnected">
    <AppLogin />
  </div>
  <div v-else>
    <AppHeader />
    <div style="display: flex">
      <AppNavigation />
      <main class="main">
        <RouterView />
      </main>
    </div>
    <AppTooltips />
  </div>
</template>

<script lang="ts" setup>
import favicon from "@/assets/favicon.svg";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import AppNavigation from "@/components/AppNavigation.vue";
import AppTooltips from "@/components/AppTooltips.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiModal from "@/components/ui/UiModal.vue";
import { useChartTheme } from "@/composables/chart-theme.composable";
import { useHostStore } from "@/stores/host.store";
import { useUiStore } from "@/stores/ui.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import { useActiveElement, useMagicKeys, whenever } from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
import { difference } from "lodash";
import { computed, ref, watch, watchEffect } from "vue";
import { useRoute } from "vue-router";

const unreachableHostsUrls = ref<URL[]>([]);
const clearUnreachableHostsUrls = () => (unreachableHostsUrls.value = []);

let link = document.querySelector(
  "link[rel~='icon']"
) as HTMLLinkElement | null;
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

if (import.meta.env.DEV) {
  const activeElement = useActiveElement();
  const { D } = useMagicKeys();

  const canToggleDarkMode = computed(() => {
    if (activeElement.value == null) {
      return true;
    }

    return !["INPUT", "TEXTAREA"].includes(activeElement.value.tagName);
  });

  whenever(
    logicAnd(D, canToggleDarkMode),
    () => (uiStore.colorMode = uiStore.colorMode === "dark" ? "light" : "dark")
  );
}

const route = useRoute();

watchEffect(() => {
  if (route.meta.hasStoryNav) {
    return;
  }

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
const reload = () => window.location.reload();
</script>

<style lang="postcss">
@import "@/assets/base.css";
</style>

<style lang="postcss" scoped>
.main {
  overflow: auto;
  flex: 1;
  height: calc(100vh - 8rem);
  background-color: var(--background-color-secondary);
}
</style>
