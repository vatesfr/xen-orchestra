<template>
  <ObjectNotFoundWrapper :is-ready="isReady" :uuid-checker="hasUuid">
    <VmHeader />
    <VmTabBar :uuid="vm!.uuid" />
    <RouterView />
  </ObjectNotFoundWrapper>
</template>

<script lang="ts" setup>
import ObjectNotFoundWrapper from "@/components/ObjectNotFoundWrapper.vue";
import VmHeader from "@/components/vm/VmHeader.vue";
import VmTabBar from "@/components/vm/VmTabBar.vue";
import { useUiStore } from "@/stores/ui.store";
import { useVmStore } from "@/stores/vm.store";
import { whenever } from "@vueuse/core";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { getByUuid, hasUuid, isReady } = useVmStore().subscribe();
const uiStore = useUiStore();
const vm = computed(() => getByUuid(route.params.uuid as string));
whenever(vm, (vm) => (uiStore.currentHostOpaqueRef = vm.resident_on));
</script>
