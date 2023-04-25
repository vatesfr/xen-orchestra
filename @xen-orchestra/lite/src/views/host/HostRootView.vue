<template>
  <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from "@/components/ObjectNotFoundWrapper.vue";
import { useHostStore } from "@/stores/host.store";
import { useUiStore } from "@/stores/ui.store";
import { watchEffect } from "vue";
import { useRoute } from "vue-router";

const { hasUuid, isReady, getByUuid } = useHostStore().subscribe();
const route = useRoute();
const uiStore = useUiStore();

watchEffect(() => {
  uiStore.currentHostOpaqueRef = getByUuid(route.params.uuid as string)?.$ref;
});
</script>
