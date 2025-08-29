<template>
  <div class="dashboard" :class="{ mobile: uiStore.isMobile }">
    <HostDashboardQuickInfo class="quick-info" :host />
    <div v-if="!data" class="offline-hero-container">
      <VtsStateHero format="page" type="offline" image-size="large" horizontal>
        <span>
          {{ t('engines-off') }}
        </span>
        <span class="title typo-h1">{{ t('host-off') }}</span>
        <div class="description">
          <span class="typo-body-bold">{{ t('host-currently-shutdown') }}</span>
          <span class="typo-body-bold">{{ t('start-host') }}</span>
        </div>
      </VtsStateHero>
    </div>
    <template v-else>
      <HostDashboardVmsStatus class="vms-status" :host />
      <HostDashboardCpuProvisioning class="cpu-provisioning" :host />
      <HostDashboardRamProvisioning class="ram-provisioning" :host />
      <HostDashboardCpuUsageChart class="cpu-usage-chart" :data :loading="isFetching" :error />
      <HostDashboardRamUsageChart class="ram-usage-chart" :data :loading="isFetching" :error />
      <HostDashboardNetworkUsageChart class="network-usage-chart" :data :loading="isFetching" :error />
      <HostDashboardLoadAverageChart class="load-average-chart" :data :loading="isFetching" :error />
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
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import { type XoHost } from '@/types/xo/host.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { data, isFetching, error } = useFetchStats('host', () => host.id, GRANULARITY.Hours)

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
    'cpu-usage-chart cpu-usage-chart ram-usage-chart ram-usage-chart network-usage-chart network-usage-chart load-average-chart load-average-chart'
    'offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container';

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
