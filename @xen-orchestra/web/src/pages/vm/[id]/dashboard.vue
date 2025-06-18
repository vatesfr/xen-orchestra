<template>
  <div class="dashboard" :class="{ mobile: isMobile }">
    <VmDashboardQuickInfo class="quick-info" :vm />
    <div v-if="!data" class="offline-hero-container">
      <VtsOfflineHero type="page" />
    </div>
    <template v-else>
      <VmDashboardCpuUsageChart class="cpu-usage-chart" :data :error :loading="isFetching" />
      <VmDashboardRamUsageChart class="ram-usage-chart" :data :error :loading="isFetching" />
      <VmDashboardNetworkUsageChart class="network-usage-chart" :data :error :loading="isFetching" />
      <VmDashboardVdiUsageChart class="vdi-usage-chart" :data :error :loading="isFetching" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import VmDashboardCpuUsageChart from '@/components/vm/dashboard/VmDashboardCpuUsageChart.vue'
import VmDashboardNetworkUsageChart from '@/components/vm/dashboard/VmDashboardNetworkUsageChart.vue'
import VmDashboardQuickInfo from '@/components/vm/dashboard/VmDashboardQuickInfo.vue'
import VmDashboardRamUsageChart from '@/components/vm/dashboard/VmDashboardRamUsageChart.vue'
import VmDashboardVdiUsageChart from '@/components/vm/dashboard/VmDashboardVdiUsageChart.vue'
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import { type XoVm } from '@/types/xo/vm.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import VtsOfflineHero from '@core/components/state-hero/VtsOfflineHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { data, isFetching, error } = useFetchStats('vm', () => vm.id, GRANULARITY.Hours)

const { isMobile } = useUiStore()
</script>

<style lang="postcss" scoped>
.dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'cpu-usage-chart cpu-usage-chart ram-usage-chart ram-usage-chart network-usage-chart network-usage-chart vdi-usage-chart vdi-usage-chart'
    'offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick-info'
      'cpu-usage-chart'
      'ram-usage-chart'
      'network-usage-chart'
      'vdi-usage-chart'
      'offline-hero-container';
  }

  .quick-info {
    grid-area: quick-info;
  }

  .offline-hero-container {
    grid-area: offline-hero-container;
    width: 50rem;
    margin: 0 auto;
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

  .vdi-usage-chart {
    grid-area: vdi-usage-chart;
  }
}
</style>
