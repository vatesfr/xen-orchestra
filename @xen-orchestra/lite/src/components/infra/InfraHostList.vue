<template>
  <ul class="infra-host-list">
    <li v-if="isLoading">{{ $t("loading-hosts") }}</li>
    <li v-else-if="hasError" class="text-error">
      {{ $t("error-no-data") }}
    </li>
    <template v-else>
      <InfraHostItem
        v-for="opaqueRef in opaqueRefs"
        :key="opaqueRef"
        :host-opaque-ref="opaqueRef"
      />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
import InfraHostItem from "@/components/infra/InfraHostItem.vue";
import { useHostStore } from "@/stores/host.store";

const hostStore = useHostStore();
const { hasError, isLoading, opaqueRefs } = storeToRefs(hostStore);
</script>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-vates-base);
}
</style>
