<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("ram-usage") }}</UiCardTitle>
    <HostsRamUsage />
    <VmsRamUsage />
  </UiCard>
</template>

<script lang="ts" setup>
import HostsRamUsage from "@/components/pool/dashboard/ramUsage/HostsRamUsage.vue";
import VmsRamUsage from "@/components/pool/dashboard/ramUsage/VmsRamUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";

const { hasError: hasVmError } = useVmStore().subscribe();
const { hasError: hasHostError } = useHostStore().subscribe();

const hasError = computed(() => hasVmError.value || hasHostError.value);
</script>
