<template>
  <div class="dashboard" :class="{ mobile: uiStore.isMobile }">
    <HostDashboardQuickInfo class="quick-info" :host />
    <HostDashboardVmsStatus class="vms-status" :host />
    <HostDashboardCpuProvisioning class="cpu-provisioning" :host />
    <HostDashboardRamProvisioning class="ram-provisioning" :host />
    <HostDashboardCpuUsageChart class="cpu-usage-chart" :data :loading="isFetching" :error />
    <HostDashboardRamUsageChart class="ram-usage-chart" :data :loading="isFetching" :error />
    <HostDashboardNetworkUsageChart class="network-usage-chart" :data :loading="isFetching" :error />
    <HostDashboardLoadAverageChart class="load-average-chart" :data :loading="isFetching" :error />
  </div>
</template>

<script lang="ts" setup>
import HostDashboardCpuProvisioning from '@/components/host/dashboard/HostDashboardCpuProvisioning.vue'
import HostDashboardCpuUsageChart from '@/components/host/dashboard/HostDashboardCpuUsageChart.vue'
import HostDashboardLoadAverageChart from '@/components/host/dashboard/HostDashboardLoadAverageChart.vue'
import HostDashboardNetworkUsageChart from '@/components/host/dashboard/HostDashboardNetworkUsageChart.vue'
import HostDashboardQuickInfo from '@/components/host/dashboard/HostDashboardQuickInfo.vue'
import HostDashboardRamProvisioning from '@/components/host/dashboard/HostDashboardRamProvisioning.vue'
import HostDashboardRamUsageChart from '@/components/host/dashboard/HostDashboardRamUsageChart.vue'
import HostDashboardVmsStatus from '@/components/host/dashboard/HostDashboardVmsStatus.vue'
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import { type XoHost } from '@/types/xo/host.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const { host } = defineProps<{
  host: XoHost
}>()

const { data, isFetching, error } = useFetchStats(() => host.id, GRANULARITY.Hours)

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'vms-status vms-status cpu-provisioning cpu-provisioning cpu-provisioning ram-provisioning ram-provisioning ram-provisioning'
    'cpu-usage-chart cpu-usage-chart ram-usage-chart ram-usage-chart network-usage-chart network-usage-chart load-average-chart load-average-chart';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick-info'
      'vms-status'
      'cpu-provisioning'
      'ram-provisioning'
      'cpu-usage-chart'
      'ram-usage-chart'
      'network-usage-chart'
      'load-average-chart';
  }

  .quick-info {
    grid-area: quick-info;
  }

  .vms-status {
    grid-area: vms-status;
  }

  .cpu-provisioning {
    grid-area: cpu-provisioning;
  }

  .ram-provisioning {
    grid-area: ram-provisioning;
  }

  .cpu-usage-chart {
    grid-area: cpu-usage-chart;
  }

  .ram-usage-chart {
    grid-area: ram-usage-chart;
  }

  .network-usage-chart {
    grid-area: network-usage-chart;
  }

  .load-average-chart {
    grid-area: load-average-chart;
  }
}
</style>
