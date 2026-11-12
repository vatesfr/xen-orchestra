<template>
  <div class="node-dashboard-usage-charts" :class="{ mobile: uiStore.isSmall }">
    <VmDashboardCpuUsageChart :data :error :loading="isFetching" />
    <VmDashboardRamUsageChart :data :error :loading="isFetching" />
    <VmDashboardNetworkUsageChart :data :error :loading="isFetching" />
  </div>
</template>

<script setup lang="ts">
import VmDashboardCpuUsageChart from '@/modules/vm/components/dashboard/VmDashboardCpuUsageChart.vue'
import VmDashboardNetworkUsageChart from '@/modules/vm/components/dashboard/VmDashboardNetworkUsageChart.vue'
import VmDashboardRamUsageChart from '@/modules/vm/components/dashboard/VmDashboardRamUsageChart.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useFetchStats } from '@/shared/composables/fetch-stats.composable.ts'
import { GRANULARITY } from '@/shared/utils/rest-api-stats.ts'
import { useUiStore } from '@core/stores/ui.store.ts'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { data, isFetching, error } = useFetchStats('vm', () => vm.id, GRANULARITY.Hours)

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.node-dashboard-usage-charts {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(20rem, 1fr));

  &.mobile {
    display: flex;
    flex-direction: column;
  }
}
</style>
