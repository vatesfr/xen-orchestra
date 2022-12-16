<template>
  <div class="pool-dashboard-view card-view">
    <PoolDashboardStatus class="item" />
    <PoolDashboardStorageUsage class="item" />
    <PoolDashboardCpuUsage class="item" />
    <PoolDashboardRamUsage class="item" />
    <PoolCpuUsageChart class="item" />
  </div>
</template>

<script lang="ts">
export const N_ITEMS = 5;
</script>
<script lang="ts" setup>
import { differenceBy } from "lodash-es";
import { computed, onMounted, provide, watch } from "vue";
import PoolCpuUsageChart from "@/components/pool/dashboard/cpuUsage/PoolCpuUsageChart.vue";
import PoolDashboardCpuUsage from "@/components/pool/dashboard/PoolDashboardCpuUsage.vue";
import PoolDashboardRamUsage from "@/components/pool/dashboard/PoolDashboardRamUsage.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import PoolDashboardStorageUsage from "@/components/pool/dashboard/PoolDashboardStorageUsage.vue";
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
  differenceBy(hosts, previousHosts ?? [], "uuid").forEach((host) => {
    hostRegister(host);
    hostLastWeekStatsRegister(host);
  });

  // turned Off
  differenceBy(previousHosts, hosts, "uuid").forEach((host) => {
    hostUnregister(host);
    hostLastWeekStatsUnregister(host);
  });
});

watch(runningVms, (vms, previousVms) => {
  // turned On
  differenceBy(vms, previousVms ?? [], "uuid").forEach((vm) => {
    vmRegister(vm);
    vmLastWeekStatsRegister(vm);
  });

  // turned Off
  differenceBy(previousVms, vms, "uuid").forEach((vm) => {
    vmUnregister(vm);
    vmLastWeekStatsUnregister(vm);
  });
});

onMounted(() => {
  runningHosts.value.forEach((host) => {
    hostRegister(host);
    hostLastWeekStatsRegister(host);
  });

  runningVms.value.forEach((vm) => {
    vmRegister(vm);
    vmLastWeekStatsRegister(vm);
  });
});
</script>

<style lang="postcss" scoped>
.item {
  min-width: 37rem;
}
</style>
