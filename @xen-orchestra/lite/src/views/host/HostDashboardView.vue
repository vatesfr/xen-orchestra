<template>
  <VtsObjectNotFoundHero v-if="host === undefined" :id type="page" />
  <div v-else class="host-dashboard-view" :class="{ mobile: uiStore.isMobile }">
    <HostDashboardQuickInfo class="quick-info" :host />
    <HostDashboardVmsStatus class="vms-status" :host />
    <HostDashboardCpuProvisioning class="cpu-provisioning" :host />
    <HostDashboardRamUsage class="ram-usage" :host />
    <HostDashboardCpuUsageChart class="cpu-usage-chart" :data :error="lastError" :loading="isFetching" />
    <HostDashboardMemoryUsageChart class="memory-usage-chart" :data :error="lastError" :loading="isFetching" />
    <HostDashboardNetworkUsageChart class="network-usage-chart" :data :error="lastError" :loading="isFetching" />
    <HostDashboardLoadAverageChart class="load-average-chart" :data :error="lastError" :loading="isFetching" />
  </div>
</template>

<script lang="ts" setup>
import HostDashboardCpuProvisioning from '@/components/host/dashboard/HostDashboardCpuProvisioning.vue'
import HostDashboardCpuUsageChart from '@/components/host/dashboard/HostDashboardCpuUsageChart.vue'
import HostDashboardLoadAverageChart from '@/components/host/dashboard/HostDashboardLoadAverageChart.vue'
import HostDashboardMemoryUsageChart from '@/components/host/dashboard/HostDashboardMemoryUsageChart.vue'
import HostDashboardNetworkUsageChart from '@/components/host/dashboard/HostDashboardNetworkUsageChart.vue'
import HostDashboardQuickInfo from '@/components/host/dashboard/HostDashboardQuickInfo.vue'
import HostDashboardRamUsage from '@/components/host/dashboard/HostDashboardRamUsage.vue'
import HostDashboardVmsStatus from '@/components/host/dashboard/HostDashboardVmsStatus.vue'
import useFetchStats from '@/composables/fetch-stats.composable.ts'
import { GRANULARITY } from '@/libs/xapi-stats.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsObjectNotFoundHero from '@core/components/state-hero/VtsObjectNotFoundHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed, onUnmounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

usePageTitleStore().setTitle(t('dashboard'))

const route = useRoute()

const id = computed(() => route.params.uuid as XenApiHost['uuid'])

const { getByUuid, getStats: getHostStats, isFetching, lastError } = useHostStore().subscribe()

const host = computed(() => getByUuid(id.value))

const uiStore = useUiStore()

const { stats, register, unregister, timestampStart } = useFetchStats<XenApiHost>(getHostStats, GRANULARITY.Hours)

const data = computed(() => ({ stats: stats.value.map(stat => stat.stats)[0], timestampStart: timestampStart.value }))

let registeredHost: XenApiHost | undefined

function setRegisteredHost(host: XenApiHost | undefined) {
  if (registeredHost !== undefined) {
    unregister(registeredHost)
    registeredHost = undefined
  }

  if (host !== undefined) {
    register(host)
    registeredHost = host
  }
}

watchEffect(() => setRegisteredHost(host.value))

onUnmounted(() => setRegisteredHost(undefined))
</script>

<style lang="postcss" scoped>
.host-dashboard-view {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'vms-status vms-status cpu-provisioning cpu-provisioning cpu-provisioning ram-usage ram-usage ram-usage'
    'cpu-usage-chart cpu-usage-chart memory-usage-chart memory-usage-chart network-usage-chart network-usage-chart load-average-chart load-average-chart';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick-info'
      'vms-status'
      'cpu-provisioning'
      'ram-usage'
      'cpu-usage-chart'
      'memory-usage-chart'
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
