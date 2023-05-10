<template>
  <div class="pool-dashboard-view">
    <UiCardGroup>
      <PoolDashboardStatus />
      <UiCardComingSoon class="alarms" title="Alarms" />
      <UiCardComingSoon title="Patches" />
    </UiCardGroup>
    <UiCardGroup>
      <UiCardGroup vertical>
        <PoolDashboardStorageUsage />
        <PoolDashboardNetworkChart />
      </UiCardGroup>
      <UiCardGroup vertical>
        <PoolDashboardRamUsage />
        <PoolDashboardRamUsageChart />
      </UiCardGroup>
      <UiCardGroup vertical>
        <PoolDashboardCpuProvisioning />
        <PoolDashboardCpuUsage />
        <PoolCpuUsageChart />
      </UiCardGroup>
    </UiCardGroup>
    <UiCardGroup>
      <UiCardComingSoon class="tasks" title="Tasks" />
    </UiCardGroup>
  </div>
</template>

<script lang="ts">
export const N_ITEMS = 5;
</script>

<script lang="ts" setup>
import UiCardGroup from "@/components/ui/UiCardGroup.vue";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { differenceBy } from "lodash-es";
import { provide, watch } from "vue";
import UiCardComingSoon from "@/components/ui/UiCardComingSoon.vue";
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

.alarms,
.tasks {
  flex: 1;
}
</style>
