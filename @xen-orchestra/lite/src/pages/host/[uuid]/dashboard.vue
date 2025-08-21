<template>
  <VtsStateHero v-if="host === undefined" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id }) }}
  </VtsStateHero>
  <div v-else class="host-dashboard-view" :class="{ mobile: uiStore.isMobile }">
    <HostDashboardQuickInfo class="quick-info" :host />
    <div v-if="data.stats === undefined" class="offline-hero-container">
      <VtsStateHero format="page" type="offline" size="large" horizontal>
        <span>
          {{ t('engines-off') }}
        </span>
        <span class="title typo-h1">{{ t('host-off') }}</span>
        <div class="description typo-body-bold">
          <span>{{ t('host-currently-shutdown') }}</span>
          <span>{{ t('start-host') }}</span>
        </div>
      </VtsStateHero>
    </div>
    <template v-else>
      <HostDashboardVmsStatus class="vms-status" :host />
      <HostDashboardCpuProvisioning class="cpu-provisioning" :host />
      <HostDashboardRamProvisioning class="ram-provisioning" :host />
      <HostDashboardCpuUsageChart class="cpu-usage-chart" :data :error="!!lastError" :loading="isFetching" />
      <HostDashboardRamUsageChart class="ram-usage-chart" :data :error="!!lastError" :loading="isFetching" />
      <HostDashboardNetworkUsageChart class="network-usage-chart" :data :error="!!lastError" :loading="isFetching" />
      <HostDashboardLoadAverageChart class="load-average-chart" :data :error="!!lastError" :loading="isFetching" />
    </template>
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
import useFetchStats from '@/composables/fetch-stats.composable.ts'
import { GRANULARITY } from '@/libs/xapi-stats.ts'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XenApiHost } from '@vates/types'
import { computed, onUnmounted, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

usePageTitleStore().setTitle(t('dashboard'))

const route = useRoute<'/host/[uuid]/dashboard'>()

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
    'cpu-usage-chart cpu-usage-chart memory-usage-chart memory-usage-chart network-usage-chart network-usage-chart load-average-chart load-average-chart'
    'offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container';

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
      'load-average-chart'
      'offline-hero-container';
  }

  .quick-info {
    grid-area: quick-info;
  }

  .offline-hero-container {
    grid-area: offline-hero-container;
  }

  .vms-status {
    grid-area: vms-status;
  }

  .cpu-provisioning {
    grid-area: cpu-provisioning;
  }

  .ram-provisioning {
    grid-area: ram-usage;
  }

  .cpu-usage-chart {
    grid-area: cpu-usage-chart;
  }

  .ram-usage-chart {
    grid-area: memory-usage-chart;
  }

  .network-usage-chart {
    grid-area: network-usage-chart;
  }

  .load-average-chart {
    grid-area: load-average-chart;
  }

  .title {
    color: var(--color-neutral-txt-primary);
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
