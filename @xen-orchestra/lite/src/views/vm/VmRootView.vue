<template>
  <ObjectNotFoundWrapper object-type="vm">
    <VmHeader />
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from "@/components/ObjectNotFoundWrapper.vue";
import VmHeader from "@/components/vm/VmHeader.vue";
import { watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useUiStore } from "@/stores/ui.store";
import { useVmStore } from "@/stores/vm.store";

const route = useRoute();
const vmStore = useVmStore();
const uiStore = useUiStore();

watchEffect(() => {
  const vm = vmStore.getRecordByUuid(route.params.uuid as string);
  uiStore.currentHostOpaqueRef = vm?.resident_on;
});
</script>
