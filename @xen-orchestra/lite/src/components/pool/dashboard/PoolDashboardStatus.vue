<template>
  <UiCard>
    <UiCardTitle>{{ $t("status") }}</UiCardTitle>
    <template v-if="isReady">
      <PoolDashboardStatusItem
        :active="activeHostsCount"
        :total="totalHostsCount"
        :label="$t('hosts')"
      />
      <UiSeparator />
      <PoolDashboardStatusItem
        :active="activeVmsCount"
        :total="totalVmsCount"
        :label="$t('vms')"
      />
    </template>
    <UiSpinner v-else class="spinner" />
  </UiCard>
</template>

<script lang="ts" setup>
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { computed } from "vue";
import PoolDashboardStatusItem from "@/components/pool/dashboard/PoolDashboardStatusItem.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiSeparator from "@/components/ui/UiSeparator.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useVmStore } from "@/stores/vm.store";

const vmStore = useVmStore();
const hostMetricsStore = useHostMetricsStore();

const isReady = computed(() => vmStore.isReady && hostMetricsStore.isReady);

const totalHostsCount = computed(() => hostMetricsStore.opaqueRefs.length);
const activeHostsCount = computed(() => {
  return hostMetricsStore.opaqueRefs.filter(
    (opaqueRef) => hostMetricsStore.getRecord(opaqueRef)?.live
  ).length;
});

const totalVmsCount = computed(() => vmStore.opaqueRefs.length);
const activeVmsCount = computed(() => {
  return vmStore.opaqueRefs.filter(
    (opaqueRef) => vmStore.getRecord(opaqueRef)?.power_state === "Running"
  ).length;
});
</script>

<style lang="postcss" scoped>
.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: auto;
  width: 40px;
  height: 40px;
}
</style>
