<template>
  <div class="pool-dashboard-view">
    <PoolDashboardStatus class="item" />
    <PoolDashboardCpuUsage class="item" />
    <PoolDashboardRamUsage class="item" />
    <UiCard style="min-width: 40rem">
      <UiTitle type="h4">Storage usage</UiTitle>
      <ProgressBar :value="65" style="margin: 1rem 0" />
      <ProgressBar :value="50" style="margin: 1rem 0" />
      <ProgressBar :value="40" style="margin: 1rem 0" />
      <ProgressBar :value="22" style="margin: 1rem 0" />
    </UiCard>

    <UiCard>
      <UiBadge>38/64 GB</UiBadge>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import { differenceBy } from "lodash-es";
import { computed, onMounted, provide, readonly, watch } from "vue";
import ProgressBar from "@/components/ProgressBar.vue";
import PoolDashboardCpuUsage from "@/components/pool/dashboard/PoolDashboardCpuUsage.vue";
import PoolDashboardRamUsage from "@/components/pool/dashboard/PoolDashboardRamUsage.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { GRANULARITY, type HostStats, type VmStats } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";

const hostStore = useHostStore();
const vmStore = useVmStore();

const {
  register: hostRegister,
  unregister: hostUnregister,
  stats: hostStats,
} = useFetchStats<XenApiHost, HostStats>("host", GRANULARITY.Seconds);
const {
  register: vmRegister,
  unregister: vmUnregister,
  stats: vmStats,
} = useFetchStats<XenApiVm, VmStats>("vm", GRANULARITY.Seconds);

const runningVms = computed(() =>
  vmStore.allRecords.filter((vm) => vm.power_state === "Running")
);

provide("hostStats", readonly(hostStats));
provide("vmStats", readonly(vmStats));

watch(
  () => hostStore.allRecords,
  (hosts, previousHosts) => {
    // turned On
    differenceBy(hosts, previousHosts ?? [], "uuid").forEach(hostRegister);

    // turned Off
    differenceBy(previousHosts, hosts, "uuid").forEach(hostUnregister);
  }
);

watch(runningVms, (vms, previousVms) => {
  // turned On
  differenceBy(vms, previousVms ?? [], "uuid").forEach(vmRegister);

  // turned Off
  differenceBy(previousVms, vms, "uuid").forEach(vmUnregister);
});

onMounted(() => {
  hostStore.allRecords.forEach(hostRegister);
  runningVms.value.forEach(vmRegister);
});
</script>

<style lang="postcss" scoped>
.pool-dashboard-view {
  display: flex;
  gap: 2rem;
}

.item {
  min-width: 37rem;
}
</style>
