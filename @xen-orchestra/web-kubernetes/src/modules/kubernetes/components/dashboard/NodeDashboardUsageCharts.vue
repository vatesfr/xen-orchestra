<template>
  <div class="node-dashboard-usage-charts" :class="{ mobile: uiStore.isSmall }">
    <VmDashboardCpuUsageChart :data :error :loading="isFetching" />
    <VmDashboardRamUsageChart :data :error :loading="isFetching" />
    <VmDashboardNetworkUsageChart :data :error :loading="isFetching" />
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@core/stores/ui.store.ts'
import {
  type FrontXoVm,
  GRANULARITY,
  useFetchStats,
  VmDashboardCpuUsageChart,
  VmDashboardNetworkUsageChart,
  VmDashboardRamUsageChart,
} from '@xen-orchestra/web/ui-plugin-sdk'

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
