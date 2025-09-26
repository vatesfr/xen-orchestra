<template>
  <div class="dashboard" :class="{ mobile: isMobile }">
    <VmDashboardQuickInfo class="quick-info" :vm />
    <div v-if="!data" class="offline-hero-container">
      <VtsStateHero format="page" type="offline" size="large" horizontal>
        <span>
          {{ t('all-quiet-launchpad') }}
        </span>
        <span class="title typo-h1">{{ t('vm-shutdown') }}</span>
        <div class="description typo-body-bold">
          <span>{{ t('vm-off') }}</span>
          <span>{{ t('start-vm') }}</span>
        </div>
      </VtsStateHero>
    </div>
    <template v-else>
      <DashboardAlarms
        class="alarms"
        :alarms="vmAlarms"
        :is-ready="areVmAlarmsReady"
        :has-ready="hasVmAlarmFetchError"
      />
      <VmDashboardCpuUsageChart class="cpu-usage-chart" :data :error :loading="isFetching" />
      <VmDashboardRamUsageChart class="ram-usage-chart" :data :error :loading="isFetching" />
      <VmDashboardNetworkUsageChart class="network-usage-chart" :data :error :loading="isFetching" />
      <VmDashboardVdiUsageChart class="vdi-usage-chart" :data :error :loading="isFetching" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import DashboardAlarms from '@/components/alarms/DashboardAlarms.vue'
import VmDashboardCpuUsageChart from '@/components/vm/dashboard/VmDashboardCpuUsageChart.vue'
import VmDashboardNetworkUsageChart from '@/components/vm/dashboard/VmDashboardNetworkUsageChart.vue'
import VmDashboardQuickInfo from '@/components/vm/dashboard/VmDashboardQuickInfo.vue'
import VmDashboardRamUsageChart from '@/components/vm/dashboard/VmDashboardRamUsageChart.vue'
import VmDashboardVdiUsageChart from '@/components/vm/dashboard/VmDashboardVdiUsageChart.vue'
import { useFetchStats } from '@/composables/fetch-stats.composable.ts'
import { useXoVmAlarmsCollection } from '@/remote-resources/use-xo-vm-alarms-collection.ts'
import { type XoVm } from '@/types/xo/vm.type'
import { GRANULARITY } from '@/utils/rest-api-stats.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { data, isFetching, error } = useFetchStats('vm', () => vm.id, GRANULARITY.Hours)

const { vmAlarms, areVmAlarmsReady, hasVmAlarmFetchError } = useXoVmAlarmsCollection({}, () => vm.id)

const { isMobile } = useUiStore()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.dashboard {
  display: grid;
  margin: 0.8rem;
  gap: 0.8rem;
  grid-template-columns: repeat(8, 1fr);
  grid-template-areas:
    'quick-info quick-info quick-info quick-info quick-info quick-info quick-info quick-info'
    'alarms alarms alarms alarms alarms alarms alarms alarms'
    'cpu-usage-chart cpu-usage-chart ram-usage-chart ram-usage-chart network-usage-chart network-usage-chart vdi-usage-chart vdi-usage-chart'
    'offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container offline-hero-container';

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick-info'
      'alarms'
      'cpu-usage-chart'
      'ram-usage-chart'
      'network-usage-chart'
      'vdi-usage-chart'
      'offline-hero-container';
  }

  .quick-info {
    grid-area: quick-info;
  }

  .alarms {
    grid-area: alarms;
    height: 46.2rem;
  }

  .offline-hero-container {
    grid-area: offline-hero-container;
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
