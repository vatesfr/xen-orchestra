<template>
  <UiCard>
    <UiCardTitle>{{ $t("status") }}</UiCardTitle>
    <template v-if="isReady">
      <PoolDashboardStatusItem
        :active="activeHostsCount"
        :label="$t('hosts')"
        :total="totalHostsCount"
      />
      <UiSeparator />
      <PoolDashboardStatusItem
        :active="activeVmsCount"
        :label="$t('vms')"
        :total="totalVmsCount"
      />
    </template>
    <UiSpinner v-else class="spinner" />
  </UiCard>
</template>

<script lang="ts" setup>
import PoolDashboardStatusItem from "@/components/pool/dashboard/PoolDashboardStatusItem.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiSeparator from "@/components/ui/UiSeparator.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useVmStore } from "@/stores/vm.store";
import { computed } from "vue";

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
