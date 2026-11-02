<template>
  <div class="dashboard" :class="{ mobile: uiStore.isSmall }">
    <ClusterDashboardQuickInfo class="quick-info" :cluster />
    <ClusterDashboardCpuUsageChart
      class="cpu-usage-chart"
      :data="vmsStats"
      :excluded-node-count
      :loading="isFetching"
      :error="hasError"
    />
    <ClusterDashboardRamUsageChart
      class="ram-usage-chart"
      :data="vmsStats"
      :excluded-node-count
      :loading="isFetching"
      :error="hasError"
    />
    <ClusterDashboardNetworkUsageChart
      class="network-usage-chart"
      :data="vmsStats"
      :excluded-node-count
      :loading="isFetching"
      :error="hasError"
    />
  </div>
</template>

<script setup lang="ts">
import ClusterDashboardCpuUsageChart from '@/modules/kubernetes/components/dashboard/ClusterDashboardCpuUsageChart.vue'
import ClusterDashboardNetworkUsageChart from '@/modules/kubernetes/components/dashboard/ClusterDashboardNetworkUsageChart.vue'
import ClusterDashboardQuickInfo from '@/modules/kubernetes/components/dashboard/ClusterDashboardQuickInfo.vue'
import ClusterDashboardRamUsageChart from '@/modules/kubernetes/components/dashboard/ClusterDashboardRamUsageChart.vue'
import { useKubernetesClusterStats } from '@/modules/kubernetes/composables/use-kubernetes-cluster-stats.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { vmsStats, excludedNodeCount, hasError, isFetching } = useKubernetesClusterStats(() => cluster)

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(20rem, 1fr));
  grid-template-areas:
    'quick-info quick-info quick-info'
    'cpu-usage-chart ram-usage-chart network-usage-chart';

  .quick-info {
    grid-area: quick-info;
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

  &.mobile {
    display: flex;
    flex-direction: column;
  }
}
</style>
