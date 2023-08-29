<template>
  <UiModal
    v-if="isSslModalOpen"
    :icon="faServer"
    color="error"
    @close="clearUnreachableHostsUrls"
  >
    <template #title>{{ $t("unreachable-hosts") }}</template>
    <div class="description">
      <p>{{ $t("following-hosts-unreachable") }}</p>
      <p>{{ $t("allow-self-signed-ssl") }}</p>
      <ul>
        <li v-for="url in unreachableHostsUrls" :key="url">
          <a :href="url" class="link" rel="noopener" target="_blank">{{
            url
          }}</a>
        </li>
      </ul>
    </div>
    <template #buttons>
      <UiButton color="success" @click="reload">
        {{ $t("unreachable-hosts-reload-page") }}
      </UiButton>
      <UiButton @click="clearUnreachableHostsUrls">{{ $t("cancel") }}</UiButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { useHostCollection } from "@/stores/xen-api/host.store";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import UiModal from "@/components/ui/UiModal.vue";
import UiButton from "@/components/ui/UiButton.vue";
import { computed, ref, watch } from "vue";
import { difference } from "lodash-es";

const { records: hosts } = useHostCollection();
const unreachableHostsUrls = ref<Set<string>>(new Set());
const clearUnreachableHostsUrls = () => unreachableHostsUrls.value.clear();
const isSslModalOpen = computed(() => unreachableHostsUrls.value.size > 0);
const reload = () => window.location.reload();

watch(hosts, (nextHosts, previousHosts) => {
  difference(nextHosts, previousHosts).forEach((host) => {
    const url = new URL("http://localhost");
    url.protocol = window.location.protocol;
    url.hostname = host.address;
    fetch(url, { mode: "no-cors" }).catch(() =>
      unreachableHostsUrls.value.add(url.toString())
    );
  });
});
</script>

<style lang="postcss" scoped>
.description p {
  margin: 1rem 0;
}
</style>
