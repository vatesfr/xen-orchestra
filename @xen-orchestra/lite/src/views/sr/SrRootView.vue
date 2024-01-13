<template>
    <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
      <template v-if="uiStore.hasUi">
        <SrHeader />
        <SrTabBar :uuid="currentSr!.uuid" />
      </template>
      <RouterView />
    </ObjectNotFoundWrapper>
  </template>
  
  <script lang="ts" setup>
  import ObjectNotFoundWrapper from "@/components/ObjectNotFoundWrapper.vue";
  import SrHeader from "@/components/sr/SrHeader.vue";
  import SrTabBar from "@/components/sr/SrTabBar.vue";
  import { useSrCollection } from "@/stores/xen-api/sr.store";
  import type { XenApiSr } from "@/libs/xen-api/xen-api.types";
  import { usePageTitleStore } from "@/stores/page-title.store";
  import { useUiStore } from "@/stores/ui.store";
  import { computed, watchEffect } from "vue";
  import { useRoute } from "vue-router";
  
  const { hasUuid, isReady, getByUuid } = useSrCollection();
  const route = useRoute();
  const uiStore = useUiStore();
  
  const currentSr = computed(() =>
    getByUuid(route.params.uuid as XenApiSr["uuid"])
  );
  
  watchEffect(() => {
    uiStore.currentSrOpaqueRef = currentSr.value?.$ref;
  });
  
  usePageTitleStore().setObject(currentSr);
  </script>
  