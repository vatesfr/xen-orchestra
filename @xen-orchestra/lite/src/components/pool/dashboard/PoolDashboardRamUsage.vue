<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("ram-usage") }}</UiCardTitle>
    <HostsRamUsage />
    <VmsRamUsage />
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HostsRamUsage from "@/components/pool/dashboard/ramUsage/HostsRamUsage.vue";
import VmsRamUsage from "@/components/pool/dashboard/ramUsage/VmsRamUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useVmStore } from "@/stores/vm.store";
import { useHostStore } from "@/stores/host.store";

const hasError = computed(
  () => useVmStore().hasError || useHostStore().hasError
);
</script>
