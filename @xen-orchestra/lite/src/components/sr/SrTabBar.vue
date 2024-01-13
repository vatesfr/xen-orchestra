<template>
    <UiTabBar>
      <RouterTab :to="{ name: 'sr.dashboard', params: { uuid } }">
        {{ $t("dashboard") }}
      </RouterTab>
      <RouterTab :to="{ name: 'sr.vdis', params: { uuid } }">
        {{ $t("vdis") }}
      </RouterTab>
    </UiTabBar>
  </template>
  
  <script lang="ts" setup>
  import RouterTab from "@/components/RouterTab.vue";
  import UiTabBar from "@/components/ui/UiTabBar.vue";
  
  defineProps<{
    uuid: string;
  }>();
  </script>