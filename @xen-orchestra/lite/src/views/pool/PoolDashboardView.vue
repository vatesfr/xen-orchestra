<template>
  <div class="pool-dashboard-view">
    <div class="item">
      <PoolDashboardStatus />
    </div>
    <div class="item">
      <PoolDashboardStorageUsage />
    </div>
    <div class="item">
      <PoolDashboardCpuUsage />
    </div>
    <div class="item">
      <PoolDashboardRamUsage />
    </div>
    <div class="item">
      <PoolDashboardCpuProvisionning />
    </div>
    <div class="item">
      <PoolDashboardNetworkChart />
    </div>
    <div class="item">
      <PoolDashboardRamUsageChart />
    </div>
    <div class="item">
      <PoolCpuUsageChart />
    </div>
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
import PoolDashboardNetworkChart from "@/components/pool/dashboard/PoolDashboardNetworkChart.vue";
import PoolDashboardCpuProvisionning from "@/components/pool/dashboard/PoolDashboardCpuProvisionning.vue";
import PoolDashboardRamUsage from "@/components/pool/dashboard/PoolDashboardRamUsage.vue";
import PoolDashboardRamUsageChart from "@/components/pool/dashboard/ramUsage/PoolRamUsage.vue";
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

const hostLastWeekStats = useFetchStats<XenApiHost, HostStats>(
  "host",
  GRANULARITY.Hours
);

const runningHosts = computed(() => hostStore.allRecords.filter(isHostRunning));
const runningVms = computed(() =>
  vmStore.allRecords.filter((vm) => vm.power_state === "Running")
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

onMounted(() => {
  runningHosts.value.forEach((host) => {
    hostRegister(host);
    hostLastWeekStats.register(host);
  });

  runningVms.value.forEach((vm) => vmRegister(vm));
});
</script>

<style lang="postcss" scoped>
.pool-dashboard-view {
  column-gap: 0;
  position: relative;
}

@media (min-width: 768px) {
  .pool-dashboard-view {
    column-count: 2;
  }
}

@media (min-width: 1500px) {
  .pool-dashboard-view {
    column-count: 3;
  }
}

.item {
  margin: 0;
  padding: 0.5rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .item {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
</style>
