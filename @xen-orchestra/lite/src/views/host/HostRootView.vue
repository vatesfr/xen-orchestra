<template>
  <ObjectNotFoundWrapper object-type="host">
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from "@/components/ObjectNotFoundWrapper.vue";
import { useRoute } from "vue-router";
import { watchEffect } from "vue";
import { useHostStore } from "@/stores/host.store";
import { useUiStore } from "@/stores/ui.store";

const route = useRoute();
const hostStore = useHostStore();
const uiStore = useUiStore();

watchEffect(() => {
  const host = hostStore.getRecordByUuid(route.params.uuid as string);
  uiStore.currentHostOpaqueRef = host?.$ref;
});
</script>
