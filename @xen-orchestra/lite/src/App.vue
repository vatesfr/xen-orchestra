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
  <div v-if="!xenApiStore.isConnected">
    <AppLogin />
  </div>
  <div v-else>
    <AppHeader />
    <div style="display: flex">
      <transition name="slide">
        <AppNavigation />
      </transition>
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
import { usePoolStore } from "@/stores/pool.store";
import { useUiStore } from "@/stores/ui.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import { useActiveElement, useMagicKeys, whenever } from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
import { difference } from "lodash-es";
import { computed, ref, watch } from "vue";

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
const { records: hosts } = useHostStore().subscribe();
const { pool } = usePoolStore().subscribe();
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

watch(hosts, (hosts, previousHosts) => {
  difference(hosts, previousHosts).forEach((host) => {
    const url = new URL("http://localhost");
    url.protocol = window.location.protocol;
    url.hostname = host.address;
    fetch(url, { mode: "no-cors" }).catch(() =>
      unreachableHostsUrls.value.push(url)
    );
  });
});

whenever(
  () => pool.value?.$ref,
  async (poolRef) => {
    const xenApi = xenApiStore.getXapi();
    await xenApi.injectWatchEvent(poolRef);
    await xenApi.startWatch();
  }
);

const isSslModalOpen = computed(() => unreachableHostsUrls.value.length > 0);
const reload = () => window.location.reload();
</script>

<style lang="postcss">
@import "@/assets/base.css";

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-37rem);
}

.main {
  overflow: auto;
  flex: 1;
  height: calc(100vh - 8rem);
  background-color: var(--background-color-secondary);
}
</style>
