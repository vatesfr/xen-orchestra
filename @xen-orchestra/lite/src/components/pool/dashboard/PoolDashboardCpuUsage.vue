<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("cpu-usage") }}</UiCardTitle>
    <HostsCpuUsage />
    <VmsCpuUsage />
  </UiCard>
</template>
<script lang="ts" setup>
import HostsCpuUsage from "@/components/pool/dashboard/cpuUsage/HostsCpuUsage.vue";
import VmsCpuUsage from "@/components/pool/dashboard/cpuUsage/VmsCpuUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";

const { hasError: hasVmError } = useVmStore().subscribe();
const { hasError: hasHostError } = useHostStore().subscribe();

const hasError = computed(() => hasVmError.value || hasHostError.value);
</script>
