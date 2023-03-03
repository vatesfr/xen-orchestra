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

const { isReady: isVmReady, records: vms } = useVmStore().subscribe();

const { isReady: isHostMetricsReady, records: hostMetrics } =
  useHostMetricsStore().subscribe();

const isReady = computed(() => isVmReady.value && isHostMetricsReady.value);

const totalHostsCount = computed(() => hostMetrics.value.length);

const activeHostsCount = computed(
  () => hostMetrics.value.filter((hostMetrics) => hostMetrics.live).length
);

const totalVmsCount = computed(() => vms.value.length);

const activeVmsCount = computed(
  () => vms.value.filter((vm) => vm.power_state === "Running").length
);
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
