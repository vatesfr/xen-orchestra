<template>
  <div class="pool-dashboard-view card-view">
    <PoolDashboardStatus class="item" />
    <PoolCpuUsageChart class="item" />
    <PoolDashboardStorageUsage class="item" />
    <PoolDashboardCpuUsage class="item" />
    <PoolDashboardRamUsage class="item" />
  </div>
</template>

<script lang="ts">
export const N_ITEMS = 5;
</script>
<script lang="ts" setup>
import { differenceBy } from "lodash-es";
import { computed, onMounted, provide, watch } from "vue";
import PoolDashboardCpuUsage from "@/components/pool/dashboard/PoolDashboardCpuUsage.vue";
import PoolDashboardRamUsage from "@/components/pool/dashboard/PoolDashboardRamUsage.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import PoolDashboardStorageUsage from "@/components/pool/dashboard/PoolDashboardStorageUsage.vue";
import PoolCpuUsageChart from "@/components/pool/dashboard/cpuUsage/PoolCpuUsageChart.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { isHostRunning } from "@/libs/utils";
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

const {
  register: hostLastWeekStatsRegister,
  unregister: hostLastWeekStatsUnregister,
  ...hostLastWeekStats
} = useFetchStats<XenApiHost, HostStats>("host", GRANULARITY.Hours);

const {
  register: vmLastWeekStatsRegister,
  unregister: vmLastWeekStatsUnregister,
  ...vmLastWeekStats
} = useFetchStats<XenApiVm, VmStats>("vm", GRANULARITY.Hours);

const runningHosts = computed(() => hostStore.allRecords.filter(isHostRunning));
const runningVms = computed(() =>
  vmStore.allRecords.filter((vm) => vm.power_state === "Running")
);

provide("hostStats", hostStats);
provide("vmStats", vmStats);

provide("hostLastWeekStats", hostLastWeekStats);
provide("vmLastWeekStats", vmLastWeekStats);

watch(runningHosts, (hosts, previousHosts) => {
  // turned On
  const currentHosts = differenceBy(hosts, previousHosts ?? [], "uuid");
  currentHosts.forEach(hostRegister);
  currentHosts.forEach(hostLastWeekStatsRegister);

  // turned Off
  const _currentHosts = differenceBy(previousHosts, hosts, "uuid");
  _currentHosts.forEach(hostUnregister);
  _currentHosts.forEach(hostLastWeekStatsUnregister);
});

watch(runningVms, (vms, previousVms) => {
  // turned On
  const currentVms = differenceBy(vms, previousVms ?? [], "uuid");
  currentVms.forEach(vmRegister);
  currentVms.forEach(vmLastWeekStatsRegister);

  // turned Off
  const _currentVms = differenceBy(previousVms, vms, "uuid");
  _currentVms.forEach(vmUnregister);
  _currentVms.forEach(vmLastWeekStatsUnregister);
});

onMounted(() => {
  runningHosts.value.forEach(hostRegister);
  runningVms.value.forEach(vmRegister);

  runningHosts.value.forEach(hostLastWeekStatsRegister);
  runningVms.value.forEach(vmLastWeekStatsRegister);
});
</script>

<style lang="postcss" scoped>
.item {
  min-width: 37rem;
}
</style>
