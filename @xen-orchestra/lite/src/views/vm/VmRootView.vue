<template>
  <RedirectIfNotFound object-type="vm">
    <RouterView />
  </RedirectIfNotFound>
</template>

<script lang="ts" setup>
import { watchEffect } from "vue";
import { useRoute } from "vue-router";
import RedirectIfNotFound from "@/components/RedirectIfNotFound.vue";
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
