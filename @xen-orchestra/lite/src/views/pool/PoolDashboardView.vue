<template>
  <div class="pool-dashboard-view">
    <div class="row first-row">
      <PoolDashboardStatus />
      <PoolDashboardComingSoon title="Alarms" class="alarms" />
      <PoolDashboardComingSoon title="Patches" />
    </div>
    <div class="row">
      <div class="column">
        <PoolDashboardStorageUsage />
        <PoolDashboardNetworkChart />
      </div>
      <div class="column">
        <PoolDashboardRamUsage />
        <PoolDashboardRamUsageChart />
      </div>
      <div class="column">
        <PoolDashboardCpuProvisioning />
        <PoolDashboardCpuUsage />
        <PoolCpuUsageChart />
      </div>
    </div>
    <div class="row">
      <PoolDashboardComingSoon title="Tasks" class="tasks" />
    </div>
  </div>
</template>

<script lang="ts">
export const N_ITEMS = 5;
</script>

<script lang="ts" setup>
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { differenceBy } from "lodash-es";
import { provide, watch } from "vue";
import PoolDashboardComingSoon from "@/components/pool/dashboard/PoolDashboardComingSoon.vue";
import PoolCpuUsageChart from "@/components/pool/dashboard/cpuUsage/PoolCpuUsageChart.vue";
import PoolDashboardCpuUsage from "@/components/pool/dashboard/PoolDashboardCpuUsage.vue";
import PoolDashboardNetworkChart from "@/components/pool/dashboard/PoolDashboardNetworkChart.vue";
import PoolDashboardCpuProvisioning from "@/components/pool/dashboard/PoolDashboardCpuProvisioning.vue";
import PoolDashboardRamUsage from "@/components/pool/dashboard/PoolDashboardRamUsage.vue";
import PoolDashboardRamUsageChart from "@/components/pool/dashboard/ramUsage/PoolRamUsage.vue";
import PoolDashboardStatus from "@/components/pool/dashboard/PoolDashboardStatus.vue";
import PoolDashboardStorageUsage from "@/components/pool/dashboard/PoolDashboardStorageUsage.vue";
import useFetchStats from "@/composables/fetch-stats.composable";
import { GRANULARITY, type HostStats, type VmStats } from "@/libs/xapi-stats";
import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { useVmStore } from "@/stores/vm.store";

const hostMetricsSubscription = useHostMetricsStore().subscribe();

const hostSubscription = useHostStore().subscribe({ hostMetricsSubscription });

const { runningHosts, getStats: getHostStats } = hostSubscription;

const { runningVms, getStats: getVmStats } = useVmStore().subscribe({
  hostSubscription,
});

const {
  register: hostRegister,
  unregister: hostUnregister,
  stats: hostStats,
} = useFetchStats<XenApiHost, HostStats>(getHostStats, GRANULARITY.Seconds);

const {
  register: vmRegister,
  unregister: vmUnregister,
  stats: vmStats,
} = useFetchStats<XenApiVm, VmStats>(getVmStats, GRANULARITY.Seconds);

const hostLastWeekStats = useFetchStats<XenApiHost, HostStats>(
  getHostStats,
  GRANULARITY.Hours
);

provide("hostStats", hostStats);
provide("vmStats", vmStats);
provide("hostLastWeekStats", hostLastWeekStats);

watch(runningHosts, (hosts, previousHosts) => {
  // turned On
  differenceBy(hosts, previousHosts ?? [], "uuid").forEach((host) => {
    hostRegister(host);
    hostLastWeekStats.register(host);
  });

  // turned Off
  differenceBy(previousHosts, hosts, "uuid").forEach((host) => {
    hostUnregister(host);
    hostLastWeekStats.unregister(host);
  });
});

watch(runningVms, (vms, previousVms) => {
  // turned On
  differenceBy(vms, previousVms ?? [], "uuid").forEach((vm) => vmRegister(vm));

  // turned Off
  differenceBy(previousVms, vms, "uuid").forEach((vm) => vmUnregister(vm));
});

runningHosts.value.forEach((host) => {
  hostRegister(host);
  hostLastWeekStats.register(host);
});

runningVms.value.forEach((vm) => vmRegister(vm));
</script>

<style lang="postcss" scoped>
.pool-dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.row {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.alarms,
.tasks {
  flex: 1;
}

@media (min-width: 1500px) {
  .row {
    flex-direction: row;
  }
}
</style>
