<template>
  <VtsObjectNotFoundHero v-if="vm === undefined" :id type="page" />
  <div v-else class="vm-dashboard-view" :class="{ mobile: uiStore.isMobile }">
    <VmDashboardQuickInfo class="quick-info" :vm />
    <div v-if="data.stats === undefined" class="offline-hero-container">
      <VtsOfflineHero type="page" />
    </div>
    <div v-else class="charts-container">
      <VmDashboardCpuUsageChart class="cpu-usage-chart" :data :error="lastError" :loading="isFetching" />
      <VmDashboardRamUsageChart class="ram-usage-chart" :data :error="lastError" :loading="isFetching" />
      <VmDashboardNetworkUsageChart class="network-usage-chart" :data :error="lastError" :loading="isFetching" />
      <VmDashboardVdiUsageChart class="disk-usage-chart" :data :error="lastError" :loading="isFetching" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmDashboardCpuUsageChart from '@/components/vm/dashboard/VmDashboardCpuUsageChart.vue'
import VmDashboardNetworkUsageChart from '@/components/vm/dashboard/VmDashboardNetworkUsageChart.vue'
import VmDashboardQuickInfo from '@/components/vm/dashboard/VmDashboardQuickInfo.vue'
import VmDashboardRamUsageChart from '@/components/vm/dashboard/VmDashboardRamUsageChart.vue'
import VmDashboardVdiUsageChart from '@/components/vm/dashboard/VmDashboardVdiUsageChart.vue'
import useFetchStats from '@/composables/fetch-stats.composable.ts'
import { GRANULARITY } from '@/libs/xapi-stats.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import VtsOfflineHero from '@core/components/state-hero/VtsOfflineHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed, onUnmounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

usePageTitleStore().setTitle(t('dashboard'))

const route = useRoute()

const id = computed(() => route.params.uuid as XenApiVm['uuid'])

const { getByUuid, getStats: getVmStats, isFetching, lastError } = useVmStore().subscribe()

const vm = computed(() => getByUuid(id.value))

const uiStore = useUiStore()

const { stats, register, unregister, timestampStart } = useFetchStats<XenApiVm>(getVmStats, GRANULARITY.Hours)

const data = computed(() => ({ stats: stats.value.map(stat => stat.stats)[0], timestampStart: timestampStart.value }))

let registeredVm: XenApiVm | undefined

function setRegisteredVm(vm: XenApiVm | undefined) {
  if (registeredVm !== undefined) {
    unregister(registeredVm)
    registeredVm = undefined
  }

  if (vm !== undefined) {
    register(vm)
    registeredVm = vm
  }
}

watchEffect(() => setRegisteredVm(vm.value))

onUnmounted(() => setRegisteredVm(undefined))
</script>

<style lang="postcss" scoped>
.vm-dashboard-view {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container'
    'cpu-usage-chart cpu-usage-chart ram-usage-chart ram-usage-chart network-usage-chart network-usage-chart disk-usage-chart disk-usage-chart';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick-info'
      'offline-hero-container'
      'cpu-usage-chart'
      'ram-usage-chart'
      'network-usage-chart'
      'disk-usage-chart';
  }

  .quick-info {
    grid-area: quick-info;
  }

  .offline-hero-container {
    grid-area: offline-hero-container;
    width: 50rem;
    margin: 0 auto;
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
