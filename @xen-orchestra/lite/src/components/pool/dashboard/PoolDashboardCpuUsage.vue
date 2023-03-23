<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("cpu-usage") }}</UiCardTitle>
    <HostsCpuUsage />
    <VmsCpuUsage />
  </UiCard>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import HostsCpuUsage from "@/components/pool/dashboard/cpuUsage/HostsCpuUsage.vue";
import VmsCpuUsage from "@/components/pool/dashboard/cpuUsage/VmsCpuUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useVmStore } from "@/stores/vm.store";
import { useHostStore } from "@/stores/host.store";

const hasError = computed(
  () => useVmStore().hasError || useHostStore().hasError
);
</script>
