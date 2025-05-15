<template>
  <div class="vm-dashboard-view" :class="{ mobile: uiStore.isMobile }">
    <VmDashboardQuickInfo class="quick-info" :vm />
    <VmDashboardCpuUsageChart class="cpu-usage-chart" />
    <VmDashboardRamUsageChart class="ram-usage-chart" />
    <VmDashboardNetworkUsageChart class="network-usage-chart" />
    <VmDashboardDiskUsageChart class="disk-usage-chart" />
  </div>
</template>

<script lang="ts" setup>
import VmDashboardCpuUsageChart from '@/components/vm/dashboard/VmDashboardCpuUsageChart.vue'
import VmDashboardDiskUsageChart from '@/components/vm/dashboard/VmDashboardDiskUsageChart.vue'
import VmDashboardNetworkUsageChart from '@/components/vm/dashboard/VmDashboardNetworkUsageChart.vue'
import VmDashboardQuickInfo from '@/components/vm/dashboard/VmDashboardQuickInfo.vue'
import VmDashboardRamUsageChart from '@/components/vm/dashboard/VmDashboardRamUsageChart.vue'
import { type XoVm } from '@/types/xo/vm.type'
import { useUiStore } from '@core/stores/ui.store.ts'

const { vm } = defineProps<{
  vm: XoVm
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vm-dashboard-view {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'cpu-usage-chart cpu-usage-chart ram-usage-chart ram-usage-chart network-usage-chart network-usage-chart disk-usage-chart disk-usage-chart';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick-info'
      'cpu-usage-chart'
      'ram-usage-chart'
      'network-usage-chart'
      'disk-usage-chart';
  }

  .quick-info {
    grid-area: quick-info;
  }

  .charts-container {
    display: contents;
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

  .disk-usage-chart {
    grid-area: disk-usage-chart;
  }
}
</style>
