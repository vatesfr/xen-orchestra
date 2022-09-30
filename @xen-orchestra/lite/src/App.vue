<template>
  <UiModal
    v-if="isSslModalOpen"
    color="error"
    :icon="faServer"
    :onClose="closeSslModal"
  >
    <UiTitle type="h2">{{ $t("unreachable-hosts") }}</UiTitle>
    <p>{{ $t("following-hosts-unreachable") }}</p>
    <p>{{ $t("allow-self-signed-ssl") }}</p>
    <ul>
      <li v-for="url in sslModalPayload?.value" :key="url.hostname">
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
import { type Ref, ref, watchEffect } from "vue";
import favicon from "@/assets/favicon.svg";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import AppHeader from "@/components/AppHeader.vue";
import AppLogin from "@/components/AppLogin.vue";
import AppTooltips from "@/components/AppTooltips.vue";
import InfraPoolList from "@/components/infra/InfraPoolList.vue";
import UiModal from "@/components/ui/UiModal.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { useChartTheme } from "@/composables/chart-theme.composable";
import useModal from "@/composables/modal.composable";
import { useHostStore } from "@/stores/host.store";
import { useXenApiStore } from "@/stores/xen-api.store";

const unreachableUrlHosts = ref<URL[]>([]);

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
const hostStore = useHostStore();
const {
  close: closeSslModal,
  isOpen: isSslModalOpen,
  open: openSslModal,
  payload: sslModalPayload,
} = useModal<Ref<URL[]>>();
useChartTheme();

watchEffect(() => {
  if (xenApiStore.isConnected) {
    xenApiStore.init();
  }
});
watchEffect(async () => {
  const _unreachableUrlHosts = [];
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
      _unreachableUrlHosts.push(url);
    }
  }
  unreachableUrlHosts.value = _unreachableUrlHosts;
});

watchEffect(() => {
  if (
    unreachableUrlHosts.value?.length > 0 &&
    window.location.protocol === "https:"
  ) {
    openSslModal(unreachableUrlHosts);
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
