<template>
  <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
    <VmHeader />
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from "@/components/ObjectNotFoundWrapper.vue";
import VmHeader from "@/components/vm/VmHeader.vue";
import { useUiStore } from "@/stores/ui.store";
import { useVmStore } from "@/stores/vm.store";
import { watchEffect } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { getByUuid, hasUuid, isReady } = useVmStore().subscribe();
const uiStore = useUiStore();

watchEffect(() => {
  uiStore.currentHostOpaqueRef = getByUuid(
    route.params.uuid as string
  )?.resident_on;
});
</script>
