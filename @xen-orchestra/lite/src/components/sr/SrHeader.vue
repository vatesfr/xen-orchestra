<template>
    <TitleBar :icon="faHdd">
      {{ name }}
    </TitleBar>
  </template>
  
  <script lang="ts" setup>
  import AppMenu from "@/components/menu/AppMenu.vue";
  import TitleBar from "@/components/TitleBar.vue";
  import UiIcon from "@/components/ui/icon/UiIcon.vue";
  import UiButton from "@/components/ui/UiButton.vue";
  import { useSrCollection } from "@/stores/xen-api/sr.store";
  import { vTooltip } from "@/directives/tooltip.directive";
  import type { XenApiSr } from "@/libs/xen-api/xen-api.types";
  import {
    faHdd
  } from "@fortawesome/free-solid-svg-icons";
  import { computed } from "vue";
  import { useRouter } from "vue-router";
  
  const { getByUuid: getSrByUuid } = useSrCollection();
  const { currentRoute } = useRouter();
  
  const sr = computed(() =>
    getSrByUuid(currentRoute.value.params.uuid as XenApiSr["uuid"])
  );
  
  const name = computed(() => sr.value?.name_label);
  </script>
  
  <style lang="postcss">
  .more-actions-button {
    font-size: 1.2em;
  }
  </style>
  