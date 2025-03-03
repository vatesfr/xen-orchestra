<template>
  <div class="dashboard">
    <HostDashboardQuickInfo class="quick-info" :host />
    <HostDashboardVmsStatus class="vms-status" :host />
    <HostDashboardCpuProvisioning class="cpu-provisioning" :host />
    <HostDashboardRamUsage class="ram-usage" :host />
    <HostDashboardCpuUsageChart class="cpu-usage-chart" :host />
    <HostDashboardMemoryUsageChart class="memory-usage-chart" :host />
    <HostDashboardNetworkUsageChart class="network-usage-chart" :host />
    <HostDashboardLoadAverageChart class="load-average-chart" :host />
  </div>
</template>

<script lang="ts" setup>
import HostDashboardCpuProvisioning from '@/components/host/dashboard/HostDashboadCpuProvisioning.vue'
import HostDashboardCpuUsageChart from '@/components/host/dashboard/HostDashboadCpuUsageChart.vue'
import HostDashboardRamUsage from '@/components/host/dashboard/HostDashboadRamUsage.vue'
import HostDashboardLoadAverageChart from '@/components/host/dashboard/HostDashboardLoadAverageChart.vue'
import HostDashboardMemoryUsageChart from '@/components/host/dashboard/HostDashboardMemoryUsageChart.vue'
import HostDashboardNetworkUsageChart from '@/components/host/dashboard/HostDashboardNetworkUsageChart.vue'
import HostDashboardQuickInfo from '@/components/host/dashboard/HostDashboardQuickInfo.vue'
import HostDashboardVmsStatus from '@/components/host/dashboard/HostDashboardVmsStatus.vue'
import { type XoHost } from '@/types/xo/host.type'

const { host } = defineProps<{
  host: XoHost
}>()
</script>

<style lang="postcss" scoped>
.dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'vms-status vms-status cpu-provisioning cpu-provisioning cpu-provisioning ram-usage ram-usage ram-usage'
    'cpu-usage-chart cpu-usage-chart memory-usage-chart memory-usage-chart network-usage-chart network-usage-chart load-average-chart load-average-chart';

  .quick-info {
    grid-area: quick-info;
  }

  .vms-status {
    grid-area: vms-status;
  }

  .cpu-provisioning {
    grid-area: cpu-provisioning;
  }

  .ram-usage {
    grid-area: ram-usage;
  }

  .cpu-usage-chart {
    grid-area: cpu-usage-chart;
  }

  .memory-usage-chart {
    grid-area: memory-usage-chart;
  }

  .network-usage-chart {
    grid-area: network-usage-chart;
  }

  .load-average-chart {
    grid-area: load-average-chart;
  }
}
</style>
