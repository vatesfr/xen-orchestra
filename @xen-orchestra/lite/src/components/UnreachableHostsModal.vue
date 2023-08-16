<template>
  <UiModal v-model="isSslModalOpen">
    <ConfirmModalLayout :icon="faServer" color="error">
      <template #title>{{ $t("unreachable-hosts") }}</template>

      <template #default>
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
      </template>

      <template #buttons>
        <UiButton color="success" @click="reload">
          {{ $t("unreachable-hosts-reload-page") }}
        </UiButton>
        <UiButton @click="closeSslModal">{{ $t("cancel") }}</UiButton>
      </template>
    </ConfirmModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import ConfirmModalLayout from "@/components/ui/modals/layouts/ConfirmModalLayout.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import UiButton from "@/components/ui/UiButton.vue";
import useModal from "@/composables/modal.composable";
import { useHostCollection } from "@/composables/xen-api-collection/host-collection.composable";
import { faServer } from "@fortawesome/free-solid-svg-icons";
import { difference } from "lodash-es";
import { ref, watch } from "vue";

const { records: hosts } = useHostCollection();
const unreachableHostsUrls = ref<Set<string>>(new Set());
const reload = () => window.location.reload();

const { isOpen: isSslModalOpen, close: closeSslModal } = useModal({
  onClose: () => unreachableHostsUrls.value.clear(),
});

watch(
  () => unreachableHostsUrls.value.size,
  (size) => {
    isSslModalOpen.value = size > 0;
  },
  { immediate: true }
);

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
